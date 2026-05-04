import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export enum AuditAction {
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  DRIVER_VERIFIED = 'DRIVER_VERIFIED'
}

export const logAudit = async (params: {
  action: AuditAction;
  entityId: string;
  entityType: 'order' | 'wallet' | 'user' | 'driver';
  from?: any;
  to?: any;
  metadata?: any;
}) => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'audit_logs'), {
      ...params,
      by: user?.uid || 'system',
      byEmail: user?.email || 'system',
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
};
