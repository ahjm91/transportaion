import { 
  doc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";

export interface Transaction {
  id?: string;
  type: 'earning' | 'payout' | 'adjustment';
  amount: number;
  orderId?: string;
  driverId: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt?: any;
}

const PLATFORM_COMMISSION_RATE = 0.10; // 10%

export const processTripPayment = async (orderId: string, driverId: string, totalAmount: number) => {
  const commission = totalAmount * PLATFORM_COMMISSION_RATE;
  const driverEarnings = totalAmount - commission;

  try {
    // 1. تحديث محفظة السائق في كل من البروفايل وكولكشن السائقين
    const driverProfileRef = doc(db, 'users', driverId);
    const driverActiveRef = doc(db, 'drivers', driverId);
    
    const walletUpdate = {
      "wallet.balance": increment(driverEarnings),
      "wallet.totalEarnings": increment(driverEarnings),
      "wallet.lastUpdate": serverTimestamp()
    };

    await updateDoc(driverProfileRef, walletUpdate);
    
    // تأكد أن وثيقة السائق موجودة قبل التحديث لتجنب أخطاء فايرستور
    const driverSnap = await getDoc(driverActiveRef);
    if (driverSnap.exists()) {
      await updateDoc(driverActiveRef, walletUpdate);
    }

    // 2. تسجيل العملية المالية
    await addDoc(collection(db, 'transactions'), {
      type: 'earning',
      amount: driverEarnings,
      commission: commission,
      totalOrderAmount: totalAmount,
      orderId: orderId,
      driverId: driverId,
      description: `أرباح الرحلة رقم #${orderId.slice(-6)}`,
      status: 'completed',
      createdAt: serverTimestamp()
    });

    // 3. تحديث إحصائيات المنصة (Revenue Tracking)
    const statsRef = doc(db, 'system_stats', 'financials');
    await updateDoc(statsRef, {
      totalRevenue: increment(totalAmount),
      totalCommission: increment(commission),
      totalPayouts: increment(0)
    });

    // 4. تسجيل في الـ Audit Log
    await logAudit({
      action: AuditAction.PAYMENT_PROCESSED,
      entityId: orderId,
      entityType: 'wallet',
      metadata: { driverId, amount: totalAmount, commission }
    });

    return { success: true, driverEarnings, commission };
  } catch (error) {
    console.error("Wallet processing error:", error);
    throw error;
  }
};

import { logAudit, AuditAction } from "./auditService";

export const requestPayout = async (driverId: string, amount: number) => {
  const driverRef = doc(db, 'users', driverId);
  const snap = await getDoc(driverRef);
  const driverData = snap.data();
  const balance = driverData?.wallet?.balance || 0;
  const driverName = driverData?.name || 'Driver';

  if (amount > balance) throw new Error("الرصيد غير كافٍ");

  const walletUpdate = {
    "wallet.balance": increment(-amount),
    "wallet.pendingPayouts": increment(amount),
    "wallet.lastUpdate": serverTimestamp()
  };

  // خصم من الرصيد ونقل للمبالغ المعلقة
  await updateDoc(driverRef, walletUpdate);
  
  const driverActiveRef = doc(db, 'drivers', driverId);
  const driverActiveSnap = await getDoc(driverActiveRef);
  if (driverActiveSnap.exists()) {
    await updateDoc(driverActiveRef, walletUpdate);
  }

  // سجل في الـ Audit Log
  await logAudit({
    action: AuditAction.PAYOUT_REQUESTED,
    entityId: driverId,
    entityType: 'wallet',
    to: amount,
    metadata: { driverId, amount, driverName }
  });

  // تسجيل طلب سحب
  return await addDoc(collection(db, 'payout_requests'), {
    driverId,
    driverName,
    amount,
    status: 'pending',
    createdAt: serverTimestamp()
  });
};
