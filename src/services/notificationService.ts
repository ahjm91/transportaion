import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export enum NotificationType {
  NEW_CUSTOMER = 'new_customer',
  NEW_DRIVER = 'new_driver',
  NEW_TRIP = 'new_trip',
  PAYOUT_REQUEST = 'payout_request'
}

export const sendAdminNotification = async (type: NotificationType, details: any) => {
  try {
    await addDoc(collection(db, 'admin_notifications'), {
      type,
      details,
      recipients: ['ali@gcctaxi.net', 'ahjm91@gmail.com'],
      status: 'pending_email',
      createdAt: serverTimestamp()
    });
    console.log(`Notification sent: ${type}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyDriver = (driverId: string, message: string) => {
  // Logic for in-app or push notifications to driver
  console.log("Notify Driver:", driverId, message);
};

export const notifyClient = (clientId: string, message: string) => {
  // Logic for in-app or push notifications to client
  console.log("Notify Client:", clientId, message);
};
