import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import { Resend } from 'resend';
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

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
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in environment variables.`);
  }
});

// Helper to validate API keys
const isPlaceholderKey = (key: string | undefined) => !key || key === '0' || key.length < 5;

const stripe = process.env.STRIPE_SECRET_KEY && !isPlaceholderKey(process.env.STRIPE_SECRET_KEY)
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

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

  // Apply rate limiter to sensitive endpoints
  app.use("/api/", apiLimiter);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", async (req, res, next) => {
    try {
      if (!stripe) {
        throw new Error("Stripe is not configured");
      }

      const { amount, currency = "bhd", metadata } = req.body;

      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 1000),
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: intent.client_secret });
    } catch (error) {
      next(error);
    }
  });

  // Email Notification - New Booking
  app.post("/api/notify-booking", async (req, res, next) => {
    try {
      if (!resend) {
        console.warn("Resend is not configured. Skipping email notification.");
        return res.json({ success: false, message: "Resend not configured" });
      }

      const { customerName, email, phone, pickup, dropoff, date, time, passengers, amount, notes, companyName, carType, bookingType, hours } = req.body;
      const displayCompanyName = companyName || 'GCC TAXI';

      // 1. Email to Admin
      console.log(`Sending admin notification for booking from ${customerName}`);
      const adminEmail = await resend.emails.send({
        from: `${displayCompanyName} <onboarding@resend.dev>`,
        to: ['ahjm91@gmail.com'],
        subject: `🔔 حجز جديد: ${customerName} - ${pickup}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
            <h2 style="color: #D4AF37; text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">إشعار حجز جديد</h2>
            <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p><strong>العميل:</strong> ${customerName}</p>
              <p><strong>الإيميل:</strong> ${email || 'غير متوفر'}</p>
              <p><strong>الهاتف:</strong> ${phone}</p>
              <p><strong>نوع الخدمة:</strong> ${bookingType === 'hourly' ? 'بالساعة' : 'توصيل'}</p>
              <p><strong>المسار:</strong> ${pickup} ← ${dropoff}</p>
              <p><strong>نوع السيارة:</strong> ${carType}</p>
              <p><strong>التاريخ:</strong> ${date}</p>
              <p><strong>الوقت:</strong> ${time}</p>
              ${bookingType === 'hourly' ? `<p><strong>عدد الساعات:</strong> ${hours}</p>` : ''}
              <p><strong>الركاب:</strong> ${passengers}</p>
              <p><strong>الإجمالي:</strong> <span style="color: #D4AF37; font-weight: bold; font-size: 1.2em;">${amount > 0 ? `${amount} BHD` : 'بانتظار التسعير'}</span></p>
              <p><strong>ملاحظات:</strong> ${notes || 'لا يوجد'}</p>
            </div>
            <hr style="margin-top: 30px; border: 0; border-top: 1px solid #ddd;" />
            <p style="font-size: 12px; color: #666; text-align: center;">تم إرسال هذا التنبيه تلقائياً من نظام ${displayCompanyName}.</p>
          </div>
        `,
      });

      if (adminEmail.error) {
        // Handle Resend restrictions gracefully
        if (adminEmail.error.name === 'validation_error') {
          console.warn("⚠️ Resend Validation Error: Check your 'from' email and 'to' permissions.");
        } else {
          console.error("🔴 Admin Email Error:", adminEmail.error);
        }
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

  // MyFatoorah Payment
  app.post("/api/myfatoorah/execute-payment", async (req, res, next) => {
    try {
      const { amount, customerName, phone, tripId, isSandbox, token } = req.body;
      
      if (isPlaceholderKey(token)) {
        return res.status(400).json({ error: "MyFatoorah token is invalid or not set" });
      }

      const baseUrl = isSandbox 
        ? "https://apitest.myfatoorah.com" 
        : "https://api.myfatoorah.com";

      const payload = {
        CustomerName: customerName,
        DisplayCurrencyIso: "BHD",
        MobileCountryCode: "973",
        CustomerMobile: phone.replace(/[^0-9]/g, ''),
        CustomerEmail: "customer@example.com",
        InvoiceValue: amount,
        CallBackUrl: `${req.protocol}://${req.get('host')}/?pay_success=${tripId}`,
        ErrorUrl: `${req.protocol}://${req.get('host')}/?pay_error=${tripId}`,
        Language: "ar",
        CustomerReference: tripId,
        UserDefinedField: tripId,
        InvoiceItems: [
          {
            ItemName: `Trip Booking #${tripId}`,
            Quantity: 1,
            UnitPrice: amount
          }
        ]
      };

      const response = await fetch(`${baseUrl}/v2/ExecutePayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!data.IsSuccess) {
        throw new Error(data.Message || "MyFatoorah error");
      }

      res.json({ paymentUrl: data.Data.PaymentURL });
    } catch (error) {
      next(error);
    }
  });

  // Tap Payment
  app.post("/api/tap/execute-payment", async (req, res, next) => {
    try {
      const { amount, customerName, phone, tripId, secretKey } = req.body;
      
      if (isPlaceholderKey(secretKey)) {
        return res.status(400).json({ error: "Tap Secret Key is invalid or not set" });
      }

      const names = customerName.trim().split(/\s+/);
      const firstName = names[0] || 'Customer';
      const lastName = names.slice(1).join(' ') || 'User';

      const payload = {
        draft: false,
        due: Date.now() + 86400000,
        expiry: Date.now() + 172800000,
        description: `Trip Booking #${tripId}`,
        mode: "INVOICE",
        savecard: false,
        notifications: {
          channels: ["SMS", "EMAIL"],
          dispatch: true
        },
        currencies: ["BHD"],
        metadata: {
          tripId: tripId
        },
        reference: {
          order: tripId,
          invoice: `INV-${tripId.substring(0, 8).toUpperCase()}`
        },
        customer: {
          first_name: firstName,
          last_name: lastName,
          phone: {
            country_code: "973",
            number: phone.replace(/[^0-9]/g, '').slice(-8) // Take last 8 digits for Bahrain
          }
        },
        order: {
          amount: amount,
          currency: "BHD",
          items: [
            {
              amount: amount,
              currency: "BHD",
              description: `Trip Booking #${tripId}`,
              name: "Trip Booking",
              quantity: 1
            }
          ]
        },
        redirect: {
          url: `${req.protocol}://${req.get('host')}/?pay_success=${tripId}`
        },
        post: {
          url: `${req.protocol}://${req.get('host')}/api/tap/webhook`
        }
      };

      const response = await fetch("https://api.tap.company/v2/invoices", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.errors || !data.url) {
        const errorMsg = data.errors ? data.errors[0].description : (data.message || "Tap API Error");
        throw new Error(errorMsg);
      }

      res.json({ paymentUrl: data.url });
    } catch (error) {
      next(error);
    }
  });

  // Tap Webhook
  app.post("/api/tap/webhook", async (req, res) => {
    try {
      const payload = req.body;
      console.log("🔵 Tap Webhook received:", JSON.stringify(payload));

      const status = payload.status;
      const tripId = payload.metadata?.tripId || payload.metadata?.udf1 || payload.reference?.order;

      if ((status === 'PAID' || status === 'CAPTURED' || payload.track === 'PAYMENT_CAPTURED') && tripId) {
        console.log(`✅ Payment successful for Trip #${tripId} via Webhook`);
        
        await adminDb.collection('trips').doc(tripId).update({
          paymentStatus: 'Paid',
          status: 'Confirmed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error("🔴 Tap Webhook Error:", error.message);
      res.sendStatus(500);
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
