import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { Resend } from 'resend';
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getDistance } from "geolib";

dotenv.config();

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: "gen-lang-client-0407670768",
  databaseId: "ai-studio-95f65e66-4b93-41d7-b06a-f978275c5d9e"
};

const adminApp = admin.initializeApp({
  projectId: firebaseConfig.projectId
});

const adminDb = getFirestore(adminApp, firebaseConfig.databaseId);

// Environment Variable Validation
const requiredEnvVars = ['RESEND_API_KEY'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in environment variables.`);
  }
});

// Helper to validate API keys
const isPlaceholderKey = (key: string | undefined) => !key || key === '0' || key.length < 5;

const resend = process.env.RESEND_API_KEY && !isPlaceholderKey(process.env.RESEND_API_KEY)
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting (needed behind Nginx/Cloud Run)
  app.set('trust proxy', 1);

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite's inline scripts in dev
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());
  
  // Performance Middlewares
  app.use(compression());
  app.use(morgan('dev')); // Logging
  
  app.use(express.json({ limit: '10kb' })); // Body limit to prevent large payload attacks

  // Rate Limiting for API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: "Too many requests, please try again later." }
  });

  // Track Analytics Events
  app.post("/api/analytics", async (req, res) => {
    try {
      const { event, category, label, value, metadata } = req.body;
      await adminDb.collection("analytics_events").add({
        event,
        category,
        label,
        value,
        metadata,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Analytics Error:", error);
      res.status(500).json({ error: "Failed to log event" });
    }
  });

  // Endpoint to create a trip (Stage 1 & 2 Custom Bookings)
  app.post("/api/trips", async (req, res, next) => {
    try {
      const tripData = req.body;
      
      // Basic validation
      if (!tripData.customerName || !tripData.phone) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Add server-side metadata
      const finalTripData = {
        ...tripData,
        source: 'web_api',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: tripData.status || 'Requested'
      };

      const docRef = await adminDb.collection("trips").add(finalTripData);
      res.json({ success: true, id: docRef.id });
    } catch (error) {
      next(error);
    }
  });

  // Apply rate limiter to sensitive endpoints
  app.use("/api/", apiLimiter);

  // --- Ride Hailing Logic (Stages 2 & 3) ---

  const isNearby = (driverLoc: { lat: number, lng: number }, pickupLoc: { lat: number, lng: number }, radius = 5000) => {
    try {
      const distance = getDistance(
        { latitude: driverLoc.lat, longitude: driverLoc.lng },
        { latitude: pickupLoc.lat, longitude: pickupLoc.lng }
      );
      return distance <= radius;
    } catch (e) {
      return false;
    }
  };

  const findNearbyDrivers = async (pickupLocation: { lat: number, lng: number }, carType: string) => {
    const snapshot = await adminDb.collection("drivers")
      .where("status", "==", "online")
      .where("carType", "==", carType)
      .get();
  
    const drivers: any[] = [];
    snapshot.forEach(doc => {
      const driver = doc.data();
      if (isNearby(driver.location, pickupLocation)) {
        drivers.push({ id: doc.id, ...driver });
      }
    });
    return drivers;
  };

  // Endpoint to create a real-time booking (Stage 3)
  app.post("/api/create-booking", async (req, res, next) => {
    try {
      const { customerName, phone, pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, carType } = req.body;

      // Fetch Site Settings for Commission and Pricing
      const settingsDoc = await adminDb.collection("settings").doc("site").get();
      const settings = settingsDoc.data() || {};
      const commissionRate = settings.commissionRate || 10;
      const baseFee = settings.baseFee || 2;
      const pricePerKm = settings.pricePerKm || 0.5;
      
      // Calculate Price (Rough estimate for now if not provided, or trust admin settings)
      // For now we'll use a fixed price logic or improve it later if geocoding is added
      const mockPrice = 15; 
      const commission = (mockPrice * commissionRate) / 100;

      // Add booking to Firestore
      const bookingRef = await adminDb.collection("bookings").add({
        customerName,
        phone,
        pickupLocation,
        dropoffLocation,
        pickupAddress,
        dropoffAddress,
        carType,
        price: mockPrice,
        commission: commission,
        status: "searching_driver",
        assignedDriverId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const drivers = await findNearbyDrivers(pickupLocation, carType);

      // Smart Dispatch: Sort by distance and take top 5
      const candidates = drivers
        .map(d => {
          const distance = getDistance(
            { latitude: d.location.lat, longitude: d.location.lng },
            { latitude: pickupLocation.lat, longitude: pickupLocation.lng }
          );
          return { ...d, distance };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      // Create requests for each candidate driver
      const batch = adminDb.batch();
      for (const driver of candidates) {
        const requestRef = adminDb.collection("driver_requests").doc();
        batch.set(requestRef, {
          driverId: driver.id,
          bookingId: bookingRef.id,
          status: "pending",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: Date.now() + 60000 // 1 minute expiry
        });
      }
      await batch.commit();

      res.json({ success: true, bookingId: bookingRef.id, driversCount: candidates.length });
    } catch (error) {
      next(error);
    }
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Email Notification - New Booking
  app.post("/api/notify-booking", async (req, res, next) => {
    try {
      if (!resend) {
        console.warn("Resend is not configured. Skipping email notification.");
        return res.json({ success: false, message: "Resend not configured" });
      }

      // Fetch dynamic settings from Firestore for admin emails
      const settingsDoc = await adminDb.collection("settings").doc("site").get();
      const settings = settingsDoc.data() || {};
      
      // Handle adminEmails robustly (ensure it's a non-empty array)
      let adminEmails: string[] = ['ahjm91@gmail.com'];
      if (Array.isArray(settings.adminEmails) && settings.adminEmails.length > 0) {
        adminEmails = settings.adminEmails;
      } else if (typeof settings.adminEmails === 'string' && settings.adminEmails.includes('@')) {
        adminEmails = [settings.adminEmails];
      }
      
      const displayCompanyName = settings.companyName || 'GCC TAXI';

      const { customerName, email, phone, pickup, dropoff, date, time, passengers, amount, notes, carType, bookingType, hours } = req.body;

      // 1. Email to Admin
      console.log(`[Email] Attempting to send notification to: ${adminEmails.join(', ')}`);
      
      const emailPayload = {
        from: `${displayCompanyName} <onboarding@resend.dev>`,
        to: adminEmails,
        subject: `🔔 حجز جديد: ${customerName}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #D4AF37;">إشعار حجز جديد</h2>
            <p><strong>العميل:</strong> ${customerName}</p>
            <p><strong>الهاتف:</strong> ${phone}</p>
            <p><strong>المسار:</strong> ${pickup} ← ${dropoff}</p>
            <p><strong>التاريخ:</strong> ${date}</p>
            <p><strong>الوقت:</strong> ${time}</p>
            <p><strong>الإجمالي:</strong> ${amount > 0 ? `${amount} BHD` : 'بانتظار التسعير'}</p>
          </div>
        `,
      };

      try {
        const adminEmail = await resend.emails.send(emailPayload);

        if (adminEmail.error) {
          console.error("🔴 [Email] Resend API Error:", adminEmail.error);
          
          // Critical fallback: try sending a plain text email to the primary admin only
          console.log("[Email] Attempting plain text fallback to ahjm91@gmail.com...");
          await resend.emails.send({
            from: `Booking System <onboarding@resend.dev>`,
            to: ['ahjm91@gmail.com'],
            subject: `🔔 New Booking: ${customerName}`,
            text: `New booking from ${customerName} (${phone}) for ${pickup} to ${dropoff} on ${date} at ${time}. Amount: ${amount} BHD.`,
          }).catch(e => console.error("[Email] Final fallback failed:", e));
        } else {
          console.log("🟢 [Email] Notification sent successfully:", adminEmail.data?.id);
        }
      } catch (err) {
        console.error("🔴 [Email] Unexpected error during send:", err);
      }

      // 2. Email to Customer (if email exists)
      if (email && email.includes('@')) {
        console.log(`Sending customer confirmation to ${email}`);
        const customerResult = await resend.emails.send({
          from: `${displayCompanyName} <onboarding@resend.dev>`,
          to: [email],
          subject: `تم استلام طلب حجزك - ${displayCompanyName}`,
          html: `
            <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #D4AF37;">شكراً لثقتك بنا!</h1>
                <p style="font-size: 1.1em; color: #333;">لقد تلقينا طلب حجزك بنجاح في <strong>${displayCompanyName}</strong>.</p>
              </div>
              
              <div style="background: #fdfaf0; padding: 20px; border-radius: 12px; margin: 20px 0; border-right: 5px solid #D4AF37;">
                <h3 style="margin-top: 0; color: #D4AF37;">تفاصيل الحجز:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li style="margin-bottom: 8px;"><strong>المسار:</strong> ${pickup} ← ${dropoff}</li>
                  <li style="margin-bottom: 8px;"><strong>التاريخ والوقت:</strong> ${date} في ${time}</li>
                  <li style="margin-bottom: 8px;"><strong>نوع السيارة:</strong> ${carType}</li>
                  <li style="margin-bottom: 8px;"><strong>إجمالي المبلغ:</strong> ${amount > 0 ? `${amount} BHD` : 'سيتم التواصل معك لتحديد السعر'}</li>
                </ul>
              </div>

              <p>سنقوم بالتواصل معك قريباً لتأكيد كافة التفاصيل.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
                <p>إذا كان لديك أي استفسار، يسعدنا تواصلك معنا عبر الواتساب.</p>
                <p><strong>${displayCompanyName} - فخامة وراحة في كل رحلة</strong></p>
              </div>
            </div>
          `,
        });

        if (customerResult.error) {
          // If we're using onboarding@resend.dev, we might get an error sending to unverified addresses
          if (customerResult.error.name === 'validation_error' || customerResult.error.message?.includes('unverified')) {
            console.warn("⚠️ Resend restriction: Cannot send confirm email to unverified customer addresses on Free Tier.");
          } else {
            console.error("🔴 Customer Email Error:", customerResult.error);
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Email Notification - Status Update (e.g., Accepted/Confirmed)
  app.post("/api/notify-status-update", async (req, res, next) => {
    try {
      if (!resend) return res.json({ success: false });

      const { email, customerName, status, pickup, dropoff, date, time, companyName } = req.body;
      if (!email || !email.includes('@')) return res.json({ success: false });

      const displayCompanyName = companyName || 'GCC TAXI';
      const isConfirmed = status === 'Confirmed';

      console.log(`Sending status update (${status}) to ${email}`);
      const { data, error } = await resend.emails.send({
        from: `${displayCompanyName} <onboarding@resend.dev>`,
        to: [email],
        subject: isConfirmed ? `تم قبول طلب رحلتك ✅ - ${displayCompanyName}` : `تحديث حالة رحلتك - ${displayCompanyName}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #22c55e;">${isConfirmed ? 'تم قبول طلبك بنجاح!' : 'تحديث جديد لرحلتك'}</h2>
            <p>عزيزي ${customerName}،</p>
            <p>يسعدنا إبلاغك بأن طلب رحلتك قد تم تحديث حالته إلى: <strong>${isConfirmed ? 'مؤكدة ✅' : status}</strong></p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>تفاصيل الرحلة:</strong></p>
              <p>المسار: ${pickup} ← ${dropoff}</p>
              <p>التاريخ: ${date}</p>
              <p>الوقت: ${time}</p>
            </div>

            <p>نتمنى لك رحلة سعيدة مع ${displayCompanyName}.</p>
            <p style="font-size: 12px; color: #666;">شكراً لاختيارك خدماتنا.</p>
          </div>
        `,
      });

      if (error) console.error("Status Update Email Error:", error);
      res.json({ success: !error });
    } catch (error) {
      next(error);
    }
  });

  // Full Schedule Email Notification
  app.post("/api/send-full-schedule", async (req, res, next) => {
    try {
      if (!resend) {
        throw new Error("Resend is not configured");
      }

      const { trips, companyName } = req.body;
      const displayCompanyName = companyName || 'GCC TAXI';
      
      if (!trips || !Array.isArray(trips)) {
        return res.status(400).json({ error: "Invalid trips data" });
      }

      const sortedTrips = [...trips].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      const groupedTrips: { [key: string]: any[] } = {};
      sortedTrips.forEach(trip => {
        if (!groupedTrips[trip.date]) groupedTrips[trip.date] = [];
        groupedTrips[trip.date].push(trip);
      });

      let htmlContent = `
        <div dir="rtl" style="font-family: sans-serif; padding: 20px;">
          <h1 style="color: #D4AF37; text-align: center;">📅 جدول الرحلات القادمة</h1>
          <p style="text-align: center; color: #666;">تم استخراج هذا التقرير بتاريخ: ${new Date().toLocaleDateString('ar-BH')}</p>
      `;

      for (const date in groupedTrips) {
        htmlContent += `
          <div style="margin-top: 30px;">
            <h3 style="background: #f8f9fa; padding: 10px; border-right: 5px solid #D4AF37;">📅 رحلات يوم: ${date}</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #eee; text-align: right;">
                  <th style="padding: 10px; border: 1px solid #ddd;">الوقت</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">العميل</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">المسار</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">السعر</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">الحالة</th>
                </tr>
              </thead>
              <tbody>
        `;

        groupedTrips[date].forEach(trip => {
          htmlContent += `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${trip.time}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${trip.customerName}<br/><small>${trip.phone}</small></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${trip.direction}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${trip.amount} BHD</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${trip.paymentStatus === 'Paid' ? '✅ مدفوع' : '❌ غير مدفوع'}</td>
            </tr>
          `;
        });

        htmlContent += `
              </tbody>
            </table>
          </div>
        `;
      }

      htmlContent += `
          <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; text-align: center;">نظام ${displayCompanyName} - إدارة الرحلات</p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: `${displayCompanyName} <onboarding@resend.dev>`,
        to: ['ahjm91@gmail.com'],
        subject: `📅 جدول الرحلات القادمة - تحديث ${new Date().toLocaleDateString('ar-BH')}`,
        html: htmlContent,
      });

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });

  // Test Email
  app.post("/api/send-test-email", async (req, res, next) => {
    try {
      if (!resend) throw new Error("Resend is not configured");
      const { email, companyName } = req.body;
      const displayCompanyName = companyName || 'GCC TAXI';

      const { data, error } = await resend.emails.send({
        from: `${displayCompanyName} <onboarding@resend.dev>`,
        to: [email || 'ahjm91@gmail.com'],
        subject: '🚀 اختبار نظام البريد الإلكتروني',
        html: `
          <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 2px solid #D4AF37; border-radius: 15px; text-align: center;">
            <h1 style="color: #D4AF37;">تم بنجاح!</h1>
            <p style="font-size: 1.2em;">نظام البريد الإلكتروني الخاص بـ <strong>${displayCompanyName}</strong> يعمل بشكل مثالي.</p>
            <div style="margin: 20px; padding: 20px; background: #f9f9f9; border-radius: 10px;">
              <p>هذا الإيميل هو لاختبار الربط مع منصة Resend.</p>
              <p>وقت الاختبار: ${new Date().toLocaleString('ar-BH')}</p>
            </div>
          </div>
        `,
      });

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });

  // Centralized Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`🔴 Backend Error: ${err.message}`);
    const status = err.status || 500;
    res.status(status).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      status
    });
  });

  // Vite middleware for development
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
