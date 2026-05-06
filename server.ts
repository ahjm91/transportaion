
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

import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, limit, setDoc } from 'firebase/firestore';

// Initialize Firebase (Client SDK for Server-side to bypass IAM)
const initializeFirebase = () => {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Initialize Admin for Auth and potentially other things
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: config.projectId
    });
  }

  // Initialize Client SDK
  const clientApp = initializeClientApp(config);
  return getClientFirestore(clientApp, config.firestoreDatabaseId);
};

const db = initializeFirebase();

// =====================
// DB Seeding (Internal)
// =====================
// =============================================================================
// MASTER SYSTEM SETTINGS & CORE DATA SEEDING
// These configurations are the "Source of Truth" for the application.
// Do NOT delete or modify these unless explicitly commanded by the user.
// See /AGENTS.md for persistent instructions.
// =============================================================================
const seedDestinations = async () => {
    try {
        const routesCol = collection(db, "fixed_routes");
        const snapshot = await getDocs(routesCol);
        
        if (snapshot.empty) {
            console.log("[FIREBASE] Seeding Master Destinations...");
            const defaultRoutes = [
                // Bahrain Local/Airport
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "المنامة", dropoff_en: "Manama", price: 10 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "الرفاع", dropoff_en: "Riffa", price: 12 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "المحرق", dropoff_en: "Muharraq", price: 5 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "الزلاق", dropoff_en: "Zallaq", price: 15 },
                
                // Cross-Border KSA
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "جسر الملك فهد", dropoff_en: "King Fahd Causeway", price: 15 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الخبر", dropoff_en: "Khobar", price: 35 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الدمام", dropoff_en: "Dammam", price: 40 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "مطار الدمام", dropoff_en: "Dammam Airport (DMM)", price: 50 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الرياض", dropoff_en: "Riyadh", price: 150 },
                
                // From KSA to Bahrain
                { pickup: "الخبر", pickup_en: "Khobar", dropoff: "المنامة", dropoff_en: "Manama", price: 35 },
                { pickup: "الدمام", pickup_en: "Dammam", dropoff: "مطار البحرين", dropoff_en: "Bahrain Airport", price: 45 },
                
                // UAE Routes
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "دبي", dropoff_en: "Dubai", price: 250 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "أبو ظبي", dropoff_en: "Abu Dhabi", price: 240 }
            ];
            
            for (const route of defaultRoutes) {
                await addDoc(routesCol, route);
            }
            console.log("[FIREBASE] Destinations Seeded Successfully.");
        }

        // Seed site settings (Master Config)
        const settingsRef = doc(db, "settings", "site");
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists()) {
            console.log("[FIREBASE] Seeding Master Site Settings...");
            await setDoc(settingsRef, {
                companyName: 'GCC TAXI',
                companyName_en: 'GCC TAXI',
                heroTitle: 'GCC TAXI',
                heroSubtitle: 'فخامة التنقل',
                heroDescription: 'نقدم لك أرقى خدمات التوصيل واللوميزين في مملكة البحرين وجميع دول الخليج.',
                phone: '+973 33138113',
                whatsapp: '97333138113',
                pricePerKm: 0.5,
                baseFee: 2,
                adminEmails: ['ahjm91@gmail.com'],
                primaryColor: '#D4AF37',
                secondaryColor: '#1A1A1A'
            });
        }

        // Seed Services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        if (servicesSnapshot.empty) {
            console.log("[FIREBASE] Seeding services...");
            const defaultServices = [
                { name: "Luxury Sedan", name_en: "Luxury Sedan", description: "S-Class or similar", image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2", features: ["VIP", "WiFi", "Water"] },
                { name: "Family Van", name_en: "Family Van", description: "Large van for 7+ people", image: "https://images.unsplash.com/photo-1542296332-2e4473faf563", features: ["Spacious", "WiFi"] }
            ];
            for (const s of defaultServices) await addDoc(collection(db, "services"), s);
        }

        // Seed Specialized Services (Landing Page Content)
        const specSnapshot = await getDocs(collection(db, "specialized_services"));
        if (specSnapshot.empty) {
            console.log("[FIREBASE] Seeding Master Specialized Services...");
            const defaultSpec = [
                { 
                    title: "توصيل واستقبال المطار", 
                    title_en: "Airport Transfer", 
                    desc: "خدمة راقية من وإلى جميع مطارات دول الخليج العربي، مع استقبال خاص في صالات الانتظار ومتابعة دقيقة لمواعيد الرحلات.", 
                    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800", 
                    order: 1 
                },
                { 
                    title: "رحلات جسر الملك فهد", 
                    title_en: "King Fahd Causeway Trips", 
                    desc: "تنقل يومي سلس وآمن بين مملكة البحرين والمملكة العربية السعودية (الخبر، الدمام، الجبيل، الرياض) بأفضل الأسعار.", 
                    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800", 
                    order: 2 
                },
                { 
                    title: "خدمة كبار الشخصيات VIP", 
                    title_en: "VIP Chauffeur Service", 
                    desc: "سيارات فاخرة من أحدث الطرازات مع سائقين محترفين بزي رسمي لخدمة وفود الشركات والمناسبات الخاصة والأعراس.", 
                    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800", 
                    order: 3 
                }
            ];
            for (const s of defaultSpec) await addDoc(collection(db, "specialized_services"), s);
        }
    } catch (err) {
        console.error("[FIREBASE] Seed error:", err);
    }
};

seedDestinations();

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
    if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
    const { startDate, endDate, type, adminId } = req.body;

    try {
      const ordersSnap = await getDocs(query(
        collection(db, "bookings"),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate)
      ));

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
        createdAt: serverTimestamp(),
        createdBy: adminId
      };

      const docRef = await addDoc(collection(db, "reports"), reportData);
      res.json({ id: docRef.id, ...reportData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Driver Approval API
  app.put("/api/drivers/:id/approve", async (req, res) => {
    if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
    try {
      await updateDoc(doc(db, "drivers", req.params.id), {
        status: "approved",
        adminStatus: "active",
        registrationStatus: "approved",
        updatedAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, "users", req.params.id), {
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
    if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
    const { status, driverId } = req.body;
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };
      if (driverId) updateData.driverId = driverId;

      await updateDoc(doc(db, "bookings", req.params.id), updateData);
      res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create Trip API (used by frontend)
  app.post("/api/trips", async (req, res) => {
    if (!db) return res.status(500).json({ success: false, message: "Database not initialized" });
    try {
      const tripData = {
        ...req.body,
        serverTimestamp: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "trips"), tripData);
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
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "bookings"), bookingData);
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
