
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import axios from 'axios';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const initializeFirebase = () => {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let config: any = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.error("[FIREBASE] Failed to parse firebase-applet-config.json", e);
    }
  }

  const projectId = config.projectId || process.env.FIREBASE_PROJECT_ID;

  if (admin.apps.length > 0) {
    const existingApp = admin.app();
    if (existingApp.options.projectId === projectId) {
      return existingApp;
    }
    console.log(`[FIREBASE] Project ID mismatch (got ${existingApp.options.projectId}, want ${projectId}). Re-initializing...`);
  }

  try {
    // Standard initialization for GCP/Cloud Run
    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId
    });
    console.log(`[FIREBASE] Admin initialized with applicationDefault for project: ${projectId}`);
    return app;
  } catch (err: any) {
    console.warn("[FIREBASE] applicationDefault failed. Attempting projectId only initialization...", err.message);
    
    // If we already have an app with this project ID, just use it
    if (admin.apps.length > 0 && admin.app().options.projectId === projectId) {
      return admin.app();
    }

    if (projectId) {
      const app = admin.initializeApp({
        projectId: projectId
      });
      console.log(`[FIREBASE] Admin initialized with projectId only: ${projectId}. Note: Admin bypass might not work.`);
      return app;
    } else {
      console.error("[FIREBASE] CRITICAL: No projectId found for initialization.");
      return null;
    }
  }
};

const firebaseApp = initializeFirebase();

// Helper to get Firestore instance
const getDb = () => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    const expectedProjectId = config.projectId || process.env.FIREBASE_PROJECT_ID;

    if (admin.apps.length > 0) {
      if (admin.app().options.projectId !== expectedProjectId) {
        console.log(`[FIREBASE] Project ID mismatch. Expected ${expectedProjectId}, got ${admin.app().options.projectId}. Re-initializing...`);
        // Note: delete() is async, but for simplicity we'll just re-init if possible or proceed
      }
    } else {
      initializeFirebase();
    }
    
    // Use the provisioned database ID from config
    const databaseId = config.firestoreDatabaseId || undefined;
    
    console.log(`[FIREBASE] Getting Firestore for project ${admin.app().options.projectId} and database: ${databaseId || '(default)'}`);
    
    // Using admin.app() to ensure we use the initialized one
    const app = admin.app();
    return getFirestore(app, databaseId);
  } catch (error) {
    console.error("Failed to get Firestore instance:", error);
    return null;
  }
};

// Initial test of database connection
const db = getDb();
if (db) {
  console.log(`[FIREBASE] Firestore initialized successfully at startup. Target Database: ${path.join(process.cwd(), 'firebase-applet-config.json')}`);
  
  // Basic connectivity check
  db.collection("test_connection").limit(1).get()
    .then(() => console.log("[FIREBASE] Connectivity check: SUCCESS (Able to read)"))
    .catch((err) => console.error("[FIREBASE] Connectivity check: FAILED (Read error)", err.message));
} else {
  console.error("[FIREBASE] Firestore failed to initialize at startup");
}

// =====================
// Email Notification (Resend)
// =====================
const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const sendBookingEmail = async (bookingData: any) => {
  if (!resendClient) {
    console.warn("⚠️ RESEND_API_KEY missing. Email skipped.");
    return;
  }

  const { customerName, phone, pickupAddress, dropoffAddress, date, time, bookingId, price } = bookingData;
  const adminEmail = process.env.ADMIN_EMAIL || 'ahjm91@gmail.com';

  try {
    console.log(`[EMAIL] Sending Resend email for booking ${bookingId}...`);
    await resendClient.emails.send({
      from: "GCC TAXI <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚗 حجز جديد: #${bookingId}`,
      html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; border: 1px solid #D4AF37; border-radius: 12px; padding: 25px; background-color: #fcfcfc;">
          <h2 style="color: #D4AF37; margin-bottom: 20px;">طلب حجز جديد 🚗</h2>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0;"><strong>العميل:</strong> ${customerName}</li>
            <li style="padding: 10px 0;"><strong>الهاتف:</strong> ${phone}</li>
            <li style="padding: 10px 0;"><strong>من:</strong> ${pickupAddress}</li>
            <li style="padding: 10px 0;"><strong>إلى:</strong> ${dropoffAddress || 'غير محدد'}</li>
            <li style="padding: 10px 0;"><strong>التوقيت:</strong> ${date} ${time}</li>
            <li style="padding: 10px 0; color: #D4AF37;"><strong>القيمة المتوقعة:</strong> ${price || '-'} دينار</li>
          </ul>
          <div style="margin-top: 30px; padding: 15px; background: #eee; border-radius: 8px;">
            <strong>رقم التتبع:</strong> #${bookingId}
          </div>
        </div>
      `
    });
    console.log(`[EMAIL] Resend email success.`);
  } catch (error) {
    console.error(`[EMAIL] Resend error:`, error);
  }
};

// =====================
// WhatsApp Logic
// =====================
const generateWhatsAppLink = (booking: any) => {
  const adminPhone = "97333138113"; // GCC TAXI Admin Phone
  const message = `🚗 *طلب حجز جديد*
  
👤 *الاسم:* ${booking.customerName}
📞 *الهاتف:* ${booking.phone}
📍 *من:* ${booking.pickupAddress}
📍 *إلى:* ${booking.dropoffAddress || 'غير محدد'}
🕒 *الوقت:* ${booking.date} ${booking.time}
💰 *القيمة:* ${booking.price || '-'} دينار
🆔 *رقم الحجز:* ${booking.bookingId}`;

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // =====================
  // API Routes
  // =====================

  // Auth Middleware placeholder
  const authMiddleware = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.split("Bearer ")[1];
      if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
      if (!admin.apps.length) return next(); // Skip if admin not init

      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: "Invalid Token" });
    }
  };

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Reports API (Professional Level)
  app.post("/api/reports/generate", async (req, res) => {
    const currentDb = db || getDb();
    if (!currentDb) return res.status(500).json({ success: false, message: "Database not initialized" });
    const { startDate, endDate, type, adminId } = req.body;

    try {
      const ordersSnap = await currentDb.collection("bookings")
        .where("createdAt", ">=", startDate)
        .where("createdAt", "<=", endDate)
        .get();

      const orders = ordersSnap.docs.map(d => d.data());

      const totalIncome = orders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

      // In a real app we'd fetch actual expenses here
      const totalExpenses = 0; 
      const netProfit = totalIncome - totalExpenses;

      const reportData = {
        type,
        startDate,
        endDate,
        totalIncome,
        totalExpenses,
        netProfit,
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === "completed").length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminId
      };

      const docRef = await currentDb.collection("reports").add(reportData);
      res.json({ id: docRef.id, ...reportData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Driver Approval API
  app.put("/api/drivers/:id/approve", async (req, res) => {
    const currentDb = db || getDb();
    if (!currentDb) return res.status(500).json({ success: false, message: "Database not initialized" });
    try {
      await currentDb.collection("drivers").doc(req.params.id).update({
        status: "approved",
        adminStatus: "active",
        registrationStatus: "approved",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await currentDb.collection("users").doc(req.params.id).update({
        role: "driver",
        driverApplicationStatus: "approved"
      });

      res.json({ success: true, message: "Driver Approved" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Order Lifecycle endpoints as requested
  app.put("/api/orders/:id/status", async (req, res) => {
    const currentDb = db || getDb();
    if (!currentDb) return res.status(500).json({ success: false, message: "Database not initialized" });
    const { status, driverId } = req.body;
    try {
      const updateData: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (driverId) updateData.driverId = driverId;

      await currentDb.collection("bookings").doc(req.params.id).update(updateData);
      res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create Trip API (used by frontend)
  app.post("/api/trips", async (req, res) => {
    const currentDb = db || getDb();
    if (!currentDb) return res.status(500).json({ success: false, message: "Database not initialized" });
    try {
      const tripData = {
        ...req.body,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await currentDb.collection("trips").add(tripData);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating trip:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create Realtime Booking API
  app.post("/api/create-booking", async (req, res) => {
    console.log("[BOOKING] Received new booking request:", req.body);
    
    const currentDb = db || getDb();
    if (!currentDb) {
      console.error("[BOOKING] Error: Firestore database not initialized");
      return res.status(500).json({ success: false, message: "Database not initialized" });
    }

    try {
      // 1. Validation
      const { customerName, phone, pickupAddress, dropoffAddress } = req.body;
      if (!customerName || !phone || !pickupAddress) {
        console.warn("[BOOKING] Validation failed: Missing fields");
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      // 2. Save to Database
      console.log("[BOOKING] Saving to Firestore...");
      const bookingData = {
        ...req.body,
        status: 'pending',
        source: 'web_form',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await currentDb.collection("bookings").add(bookingData);
      console.log("[BOOKING] Successfully saved with ID:", docRef.id);

      // 3. Generate Redirect Link
      const whatsappLink = generateWhatsAppLink({
        ...req.body,
        bookingId: docRef.id
      });

      // 4. Send Notifications in background
      sendBookingEmail({ 
        ...req.body, 
        bookingId: docRef.id 
      }).catch(err => console.error("[BOOKING] Background email error:", err));

      // 5. Send Success Response including WhatsApp link
      res.json({ 
        success: true, 
        bookingId: docRef.id,
        whatsappLink,
        message: "Booking created successfully" 
      });

    } catch (error: any) {
      console.error("[BOOKING] Fatal error during creation:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Notification API
  app.post("/api/notify-booking", async (req, res) => {
    // This would typically send an email or SMS
    // For now, we'll just log it as the frontend handles WhatsApp
    console.log("Notification requested for booking:", req.body.bookingNumber);
    res.json({ success: true });
  });

  // Create Checkout API
  app.post("/api/create-checkout", async (req, res) => {
    const { tripId, amount, gateway } = req.body;
    console.log(`Checkout requested for trip ${tripId} via ${gateway} for amount ${amount}`);
    
    // In a real app, you'd integrate with MyFatoorah/Tap SDKs here
    // For now, we'll redirect back with a success param as a fallback demo
    // or provide the WhatsApp URL if that's the config
    res.json({ 
      success: true, 
      url: `/?pay_success=${tripId}` // Mock success redirection
    });
  });

  // API 404 Handler (Should be before Vite middleware)
  app.all("/api/*", (req, res) => {
    res.status(404).json({ success: false, message: `API Route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[SERVER ERROR]", err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: process.env.NODE_ENV === "production" ? undefined : err.message 
    });
  });

  // =====================
  // Vite Middleware
  // =====================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
