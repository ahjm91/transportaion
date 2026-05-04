import { collection, getDocs, query, where, addDoc, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Report } from "../types";

export const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end };
};

export const getWeekRange = () => {
  const now = new Date();
  const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); // Start from Monday
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const generateReport = async (startDate: Date, endDate: Date, type: 'daily' | 'weekly' | 'monthly', adminId: string) => {
  // 1. Check for existing report for this period to prevent duplicates
  const existingQuery = query(
    collection(db, "reports"),
    where("type", "==", type),
    where("startDate", "==", startDate.toISOString()),
    limit(1)
  );
  
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error("Report already exists for this period");
  }

  // 2. Fetch Bookings (Orders) within range
  // Note: We use string ISO dates if stored as strings, or Timestamps if stored as timestamps.
  // Based on current project knowledge, we use ISO strings or server timestamps.
  // I'll adjust to handle potential variations.
  const bookingsSnap = await getDocs(collection(db, "bookings"));
  const bookings = bookingsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as any))
    .filter(b => {
      const bDate = new Date(b.createdAt);
      return bDate >= startDate && bDate <= endDate;
    });

  // 3. Fetch Expenses (if exists)
  // Assuming there might not be an expenses collection yet, we'll handle empty
  let expenses: any[] = [];
  try {
    const expensesSnap = await getDocs(collection(db, "expenses"));
    expenses = expensesSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(e => {
        const eDate = new Date(e.date || e.createdAt);
        return eDate >= startDate && eDate <= endDate;
      });
  } catch (e) {
    console.warn("Expenses collection may not exist yet");
  }

  // Metrics
  const totalOrders = bookings.length;
  const completedOrders = bookings.filter(o => o.status === "completed").length;
  const pendingOrders = bookings.filter(o => ["pending", "searching", "assigned"].includes(o.status)).length;
  const cancelledOrders = bookings.filter(o => o.status === "cancelled").length;
  
  const totalIncome = bookings
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netProfit = totalIncome - totalExpenses;

  const reportData = {
    type,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalIncome,
    totalExpenses,
    netProfit,
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders, // Added to map closer to actual booking statuses
    createdAt: new Date().toISOString(),
    createdBy: adminId
  };

  const docRef = await addDoc(collection(db, "reports"), reportData);
  return { id: docRef.id, ...reportData };
};

export const fetchRecentReports = async () => {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
};
