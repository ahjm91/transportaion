
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const initializeFirebase = () => {
  if (admin.apps.length > 0) return;

  try {
    // Try default credentials (Cloud Run / AI Studio env)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin initialized with applicationDefault");
  } catch (err) {
    console.warn("Firebase Admin applicationDefault failed, trying config file...");
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      admin.initializeApp({
        projectId: config.projectId,
        // We can't use credential without service account, 
        // but projectId allows basic Firestore ops in some envs
      });
      console.log("Firebase Admin initialized with projectId from config file");
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      console.log("Firebase Admin initialized with FIREBASE_PROJECT_ID env var");
    } else {
      console.error("CRITICAL: Failed to initialize Firebase Admin. Persistence will fail.");
    }
  }
};

initializeFirebase();

const db = admin.firestore?.() || null;

// =====================
// Email Configuration (Nodemailer)
// =====================
const createTransporter = () => {
  // Use professional service like SendGrid, Mailtrap or Gmail (App Password)
  // For demo/dev, we recommend Mailtrap.io
  const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
  const port = parseInt(process.env.SMTP_PORT || '2525');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("⚠️ Email credentials missing in .env. Emails will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

const sendBookingEmail = async (bookingData: any) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const { customerName, phone, pickupAddress, dropoffAddress, date, time, bookingId } = bookingData;

  const mailOptions = {
    from: `"GCC TAXI Support" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || 'ahjm91@gmail.com', // Notify admin
    subject: `New Booking Request: #${bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #D4AF37; text-align: center;">GCC TAXI - New Booking</h2>
        <p>A new booking has been created with the following details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Booking ID:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${bookingId}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${customerName}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${phone}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Pickup:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${pickupAddress}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Dropoff:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${dropoffAddress}</td></tr>
          <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date/Time:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${date} at ${time}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #666; font-size: 12px; text-align: center;">This is an automated notification from GCC TAXI System.</p>
      </div>
    `
  };

  try {
    console.log(`[EMAIL] Attempting to send email for booking ${bookingId}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Successfully sent: ${info.messageId}`);
  } catch (error) {
    console.error(`[EMAIL] Failed to send email:`, error);
  }
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
      if (!token) return res.status(401).send("Unauthorized");
      if (!admin.apps.length) return next(); // Skip if admin not init

      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).send("Invalid Token");
    }
  };

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Reports API (Professional Level)
  app.post("/api/reports/generate", async (req, res) => {
    if (!db) return res.status(500).send("Database not initialized");
    const { startDate, endDate, type, adminId } = req.body;

    try {
      const ordersSnap = await db.collection("bookings")
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

      const docRef = await db.collection("reports").add(reportData);
      res.json({ id: docRef.id, ...reportData });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Driver Approval API
  app.put("/api/drivers/:id/approve", async (req, res) => {
    if (!db) return res.status(500).send("Database not initialized");
    try {
      await db.collection("drivers").doc(req.params.id).update({
        status: "approved",
        adminStatus: "active",
        registrationStatus: "approved",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await db.collection("users").doc(req.params.id).update({
        role: "driver",
        driverApplicationStatus: "approved"
      });

      res.send("Driver Approved");
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Order Lifecycle endpoints as requested
  app.put("/api/orders/:id/status", async (req, res) => {
    if (!db) return res.status(500).send("Database not initialized");
    const { status, driverId } = req.body;
    try {
      const updateData: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      if (driverId) updateData.driverId = driverId;

      await db.collection("bookings").doc(req.params.id).update(updateData);
      res.send(`Order status updated to ${status}`);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Create Trip API (used by frontend)
  app.post("/api/trips", async (req, res) => {
    if (!db) return res.status(500).send("Database not initialized");
    try {
      const tripData = {
        ...req.body,
        serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection("trips").add(tripData);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Error creating trip:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create Realtime Booking API
  app.post("/api/create-booking", async (req, res) => {
    console.log("[BOOKING] Received new booking request:", req.body);
    
    if (!db) {
      console.error("[BOOKING] Error: Firestore database not initialized");
      return res.status(500).send("Database not initialized");
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
      
      const docRef = await db.collection("bookings").add(bookingData);
      console.log("[BOOKING] Successfully saved with ID:", docRef.id);

      // 3. Send Email Notification
      // We don't await this to keep the response fast, but it runs in background
      sendBookingEmail({ 
        ...req.body, 
        bookingId: docRef.id 
      }).catch(err => console.error("[BOOKING] Background email error:", err));

      // 4. Send Success Response
      res.json({ 
        success: true, 
        bookingId: docRef.id,
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
