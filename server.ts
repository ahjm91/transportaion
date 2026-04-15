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

dotenv.config();

// Environment Variable Validation
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Warning: ${varName} is not set in environment variables.`);
  }
});

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  // Email Notification
  app.post("/api/notify-booking", async (req, res, next) => {
    try {
      if (!resend) {
        console.warn("Resend is not configured. Skipping email notification.");
        return res.json({ success: false, message: "Resend not configured" });
      }

      const { customerName, phone, pickup, dropoff, date, time, passengers, amount, notes } = req.body;

      const { data, error } = await resend.emails.send({
        from: 'GCC TAXI <onboarding@resend.dev>',
        to: ['ahjm91@gmail.com'],
        subject: `حجز جديد: ${customerName} - ${pickup} ← ${dropoff}`,
        html: `
          <div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #D4AF37;">🔔 حجز جديد من الموقع</h2>
            <p><strong>العميل:</strong> ${customerName}</p>
            <p><strong>الهاتف:</strong> ${phone}</p>
            <p><strong>المسار:</strong> ${pickup} ← ${dropoff}</p>
            <p><strong>التاريخ:</strong> ${date}</p>
            <p><strong>الوقت:</strong> ${time}</p>
            <p><strong>الركاب:</strong> ${passengers}</p>
            <p><strong>السعر:</strong> ${amount > 0 ? `${amount} BHD` : 'بانتظار التسعير'}</p>
            <p><strong>ملاحظات:</strong> ${notes || 'لا يوجد'}</p>
            <hr />
            <p style="font-size: 12px; color: #666;">تم إرسال هذا التنبيه تلقائياً من نظام GCC TAXI.</p>
          </div>
        `,
      });

      if (error) throw error;
      res.json({ success: true, data });
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

      const { trips } = req.body;
      
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
          <p style="font-size: 12px; color: #999; text-align: center;">نظام GCC TAXI - إدارة الرحلات</p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: 'GCC TAXI <onboarding@resend.dev>',
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
      
      if (!token) {
        return res.status(400).json({ error: "MyFatoorah token is missing" });
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
