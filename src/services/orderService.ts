import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { canTransition } from "../utils/orderRules";

// Firebase might need to be imported differently if it's in a separate file
// For now, I'll use the one from App.tsx as it's common in this template

export const createOrder = async (data: any) => {
  return await addDoc(collection(db, "bookings"), {
    ...data,
    status: "broadcasting",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const listenAvailableOrders = (callback: (orders: any[]) => void) => {
  const q = query(
    collection(db, "bookings"),
    where("status", "==", "broadcasting")
  );

  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(orders);
  });
};

export const updateOrderStatus = async (orderId: string, newStatus: string, extra = {}) => {
  const ref = doc(db, "bookings", orderId);
  const snap = await getDoc(ref);

  if (!snap.exists()) throw new Error("Order not found");
  
  const current = snap.data().status;

  if (!canTransition(current, newStatus)) {
    throw new Error(`Invalid status transition from ${current} to ${newStatus}`);
  }

  await updateDoc(ref, {
    status: newStatus,
    ...extra,
    updatedAt: serverTimestamp()
  });
};

export const acceptOrder = async (orderId: string, driverId: string) => {
  return updateOrderStatus(orderId, "accepted", { driverId });
};

export const startTrip = (orderId: string) => {
  return updateOrderStatus(orderId, "in_progress");
};

export const completeTrip = (orderId: string) => {
  return updateOrderStatus(orderId, "completed");
};
