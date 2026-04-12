import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import { Resend } from 'resend';

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

if (resend) {
  console.log("Resend initialized successfully.");
} else {
  console.warn("Resend NOT initialized. RESEND_API_KEY is missing.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe Payment Intent
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }

      const { amount, currency = "bhd", metadata } = req.body;

      // Stripe expects amount in cents/fils
      // BHD has 3 decimal places, so 1.000 BHD = 1000 fils
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 1000),
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ clientSecret: intent.client_secret });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Email Notification
  app.post("/api/notify-booking", async (req, res) => {
    console.log("Received booking notification request:", req.body.customerName);
    try {
      if (!resend) {
        console.warn("Resend is not configured (RESEND_API_KEY missing). Skipping email notification.");
        return res.json({ success: false, message: "Resend not configured" });
      }

      const { customerName, phone, pickup, dropoff, date, time, passengers, amount, notes } = req.body;

      const { data, error } = await resend.emails.send({
        from: 'Alhatab VIP Taxi <onboarding@resend.dev>',
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
            <p style="font-size: 12px; color: #666;">تم إرسال هذا التنبيه تلقائياً من نظام الحطاب VIP.</p>
          </div>
        `,
      });

      if (error) {
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Full Schedule Email Notification
  app.post("/api/send-full-schedule", async (req, res) => {
    try {
      if (!resend) {
        return res.status(500).json({ error: "Resend is not configured" });
      }

      const { trips } = req.body;
      
      if (!trips || !Array.isArray(trips)) {
        return res.status(400).json({ error: "Invalid trips data" });
      }

      // Sort trips by date and time
      const sortedTrips = [...trips].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      // Group by date
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
          <p style="font-size: 12px; color: #999; text-align: center;">نظام الحطاب VIP - إدارة الرحلات</p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: 'Alhatab VIP Taxi <onboarding@resend.dev>',
        to: ['ahjm91@gmail.com'],
        subject: `📅 جدول الرحلات القادمة - تحديث ${new Date().toLocaleDateString('ar-BH')}`,
        html: htmlContent,
      });

      if (error) return res.status(400).json({ error });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // MyFatoorah Payment
  app.post("/api/myfatoorah/execute-payment", async (req, res) => {
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
    } catch (error: any) {
      console.error("MyFatoorah Error:", error);
      res.status(500).json({ error: error.message });
    }
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
