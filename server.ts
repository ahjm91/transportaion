
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
import { getFirestore as getClientFirestore, collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs, limit, setDoc, getDoc } from 'firebase/firestore';

// Initialize Firebase (Client SDK for Server-side to bypass IAM)
const initializeFirebase = () => {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Initialize Admin for Auth and potentially other things
  if (admin.apps.length === 0) {
    console.log(`[FIREBASE] Initializing Admin SDK for Project: ${config.projectId}`);
    admin.initializeApp({
      projectId: config.projectId
    });
    console.log(`[FIREBASE] Admin SDK Initialized.`);
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
        const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const dbId = config.firestoreDatabaseId;
        
        console.log(`[FIREBASE] Starting seeding/repair checks for database: ${dbId}`);
        const adminDb = admin.firestore(dbId);

        // --- REPAIR & SEED: FIXED ROUTES ---
        const routesSnap = await adminDb.collection("fixed_routes").get();
        
        const routeTranslations: Record<string, string> = {
            "Airport": "المطار",
            "Bahrain Airport": "مطار البحرين",
            "Bahrain International Airport": "مطار البحرين الدولي",
            "Manama": "المنامة",
            "Riffa": "الرفاع",
            "Muharraq": "المحرق",
            "Zallaq": "الزلاق",
            "Seef": "السيف",
            "Seef District": "ضاحية السيف",
            "Juffair": "الجفير",
            "Adliya": "العدلية",
            "Hidd": "الحد",
            "Budaiya": "البديع",
            "Isa Town": "مدينة عيسى",
            "Hamad Town": "مدينة حمد",
            "Saar": "سار",
            "Amwaj": "أمواج",
            "Amwaj Islands": "جزر أمواج",
            "Durrat Al Bahrain": "درة البحرين",
            "Sitra": "سترة",
            "Janabiya": "الجنبية",
            "Tubli": "توبلي",
            "Salmabad": "سلماباد",
            "Busaiteen": "البسيتين",
            "Galali": "قلالي",
            "Diyar Al Muharraq": "ديار المحرق",
            "Asry": "أسري",
            "Alba": "ألبا",
            "Bapco": "بابكو",
            "Khalifa Port": "ميناء خليفة",
            "King Fahd Causeway": "جسر الملك فهد",
            "Saudi Arabia": "المملكة العربية السعودية",
            "Khobar": "الخبر",
            "Dammam": "الدمام",
            "DMM": "مطار الدمام",
            "DMM Airport": "مطار الدمام",
            "Dhahran": "الظهران",
            "Jubail": "الجبيل",
            "Riyadh": "الرياض",
            "Dubai": "دبي",
            "Abu Dhabi": "أبو ظبي",
            "Qassim": "القصيم",
            "Hail": "حائل",
            "Medina": "المدينة المنورة",
            "Mecca": "مكة المكرمة",
            "Jeddah": "جدة",
            "Taif": "الطائف",
            "Abha": "أبها",
            "Jizan": "جيزان",
            "Najran": "نجران",
            "Tabuk": "تبوك",
            "Arar": "عرعر",
            "Sakaka": "سكاكا",
            "Hafr Al Batin": "حفر الباطن",
            "Khafji": "الخفجي",
            "Nariyah": "النعيرية",
            "Qatif": "القطيف",
            "Ras Tanura": "رأس تنورة",
            "Al Ahsa": "الأحساء",
            "Hofuf": "الهفوف",
            "Mubarraz": "المبرز",
            "Abqaiq": "بقيق"
        };

        const standardizeName = (name: string, toAr: boolean) => {
            const trimmed = name.trim();
            if (toAr) {
                // If it's already Arabic, return it
                if (/[\u0600-\u06FF]/.test(trimmed)) return trimmed;
                // Try translate common English names
                for (const [en, ar] of Object.entries(routeTranslations)) {
                    if (trimmed.toLowerCase() === en.toLowerCase()) return ar;
                    if (trimmed.toLowerCase().includes(en.toLowerCase())) {
                        return trimmed.replace(new RegExp(en, 'gi'), ar).replace(' - ', ' - ').replace(' (', ' (');
                    }
                }
                return trimmed;
            } else {
                // Return English version if not Arabic
                if (!/[\u0600-\u06FF]/.test(trimmed)) return trimmed;
                // Try reverse translate
                for (const [en, ar] of Object.entries(routeTranslations)) {
                    if (trimmed === ar) return en;
                    if (trimmed.includes(ar)) {
                        return trimmed.replace(ar, en);
                    }
                }
                return trimmed;
            }
        };

        if (routesSnap.empty) {
            console.log("[FIREBASE] Seeding Master Destinations...");
            const defaultRoutes = [
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "المنامة", dropoff_en: "Manama", price: 10 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "الرفاع", dropoff_en: "Riffa", price: 12 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "المحرق", dropoff_en: "Muharraq", price: 5 },
                { pickup: "مطار البحرين", pickup_en: "Bahrain Airport", dropoff: "الزلاق", dropoff_en: "Zallaq", price: 15 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "جسر الملك فهد", dropoff_en: "King Fahd Causeway", price: 15 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الخبر", dropoff_en: "Khobar", price: 35 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الدمام", dropoff_en: "Dammam", price: 40 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "مطار الدمام", dropoff_en: "Dammam Airport (DMM)", price: 50 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "الرياض", dropoff_en: "Riyadh", price: 150 },
                { pickup: "الخبر", pickup_en: "Khobar", dropoff: "المنامة", dropoff_en: "Manama", price: 35 },
                { pickup: "الدمام", pickup_en: "Dammam", dropoff: "مطار البحرين", dropoff_en: "Bahrain Airport", price: 45 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "دبي", dropoff_en: "Dubai", price: 250 },
                { pickup: "المنامة", pickup_en: "Manama", dropoff: "أبو ظبي", dropoff_en: "Abu Dhabi", price: 240 }
            ];
            for (const route of defaultRoutes) await adminDb.collection("fixed_routes").add(route);
        } else {
            console.log("[FIREBASE] Auditing existing routes for language mixing...");
            for (const doc of routesSnap.docs) {
                const data = doc.data();
                let needsUpdate = false;
                const updates: any = {};

                // 1. If pickup is English, move to pickup_en and find Arabic translation
                if (!/[\u0600-\u06FF]/.test(data.pickup)) {
                    updates.pickup_en = data.pickup;
                    updates.pickup = standardizeName(data.pickup, true);
                    if (updates.pickup !== data.pickup) needsUpdate = true;
                } else if (!data.pickup_en) {
                    updates.pickup_en = standardizeName(data.pickup, false);
                    if (updates.pickup_en !== data.pickup) needsUpdate = true;
                }

                // 2. If dropoff is English, move to dropoff_en and find Arabic translation
                if (!/[\u0600-\u06FF]/.test(data.dropoff)) {
                    updates.dropoff_en = data.dropoff;
                    updates.dropoff = standardizeName(data.dropoff, true);
                    if (updates.dropoff !== data.dropoff) needsUpdate = true;
                } else if (!data.dropoff_en) {
                    updates.dropoff_en = standardizeName(data.dropoff, false);
                    if (updates.dropoff_en !== data.dropoff) needsUpdate = true;
                }

                if (needsUpdate) {
                    console.log(`[FIREBASE] Repairing route ${doc.id}: ${data.pickup} -> ${updates.pickup || data.pickup}`);
                    await doc.ref.update(updates);
                }
            }
        }

        // --- REPAIR: SITE SETTINGS ---
        const settingsRef = adminDb.collection("settings").doc("site");
        const settingsSnap = await settingsRef.get();
        if (!settingsSnap.exists) {
            console.log("[FIREBASE] Seeding Master Site Settings...");
            await settingsRef.set({
                companyName: 'GCC TAXI',
                companyName_en: 'GCC TAXI',
                heroTitle: 'GCC TAXI',
                heroSubtitle: 'فخامة التنقل',
                heroSubtitle_en: 'Luxury Travel',
                heroDescription: 'نقدم لك أرقى خدمات التوصيل واللوميزين في مملكة البحرين وجميع دول الخليج.',
                heroDescription_en: 'We provide the finest transportation and limousine services in the Kingdom of Bahrain and all GCC countries.',
                phone: '+973 33138113',
                whatsapp: '97333138113',
                pricePerKm: 0.5,
                baseFee: 2,
                adminEmails: ['ahjm91@gmail.com', 'ali@gcctaxi.net'],
                primaryColor: '#D4AF37',
                secondaryColor: '#1A1A1A',
                showServicesSection: true,
                showSpecializedSection: true,
                showHeroSection: true,
                showBookingSection: true,
                layoutDensity: 'comfortable',
                sectionOrder: ['hero', 'booking', 'services', 'specialized', 'about', 'cta']
            });
        } else {
            const data = settingsSnap.data();
            if (!data?.heroSubtitle_en || !data?.heroDescription_en) {
                await settingsRef.update({
                    heroSubtitle_en: data?.heroSubtitle_en || 'Luxury Travel',
                    heroDescription_en: data?.heroDescription_en || 'We provide the finest transportation and limousine services in the Kingdom of Bahrain and all GCC countries.'
                });
            }
        }

        // --- REPAIR/SEED: ADMINS COLLECTION ---
        const adminEmailsToSeed = ['ahjm91@gmail.com', 'ali@gcctaxi.net'];
        for (const email of adminEmailsToSeed) {
            try {
                const userRecord = await admin.auth().getUserByEmail(email);
                console.log(`[FIREBASE] Seeding admin role for: ${email} (${userRecord.uid})`);
                await adminDb.collection("admins").doc(userRecord.uid).set({ 
                    isAdmin: true, 
                    email: email,
                    updatedAt: new Date().toISOString() 
                }, { merge: true });
            } catch (authErr: any) {
                if (authErr.code === 'auth/user-not-found') {
                    console.log(`[FIREBASE] Admin user not found in Auth, skipping role seed for now: ${email}`);
                } else {
                    console.error(`[FIREBASE] Error seeking admin UID:`, authErr);
                }
            }
        }

        // --- REPAIR/SEED: SERVICES ---
        const servicesSnap = await adminDb.collection("services").get();
        if (servicesSnap.empty) {
            const defaultServices = [
                { 
                    name: "Luxury Sedan", 
                    name_en: "Luxury Sedan", 
                    description: "فئة الرفاهية للنقل الفاخر والسريع", 
                    description_en: "Luxury class for high-end rapid transport",
                    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800", 
                    features: ["VIP", "WiFi", "Water"],
                    features_en: ["VIP Support", "Fast WiFi", "Refreshments"]
                },
                { 
                    name: "Family Van", 
                    name_en: "Family Van", 
                    description: "توصيل عائلي وجماعي يتسع لأكثر من 7 أشخاص", 
                    description_en: "Family and group transport for 7+ people",
                    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800", 
                    features: ["Spacious", "WiFi"],
                    features_en: ["Extra Space", "In-car WiFi"]
                }
            ];
            for (const s of defaultServices) await adminDb.collection("services").add(s);
        } else {
            for (const doc of servicesSnap.docs) {
                const data = doc.data();
                if (!data.name_en || !data.description_en) {
                    await doc.ref.update({
                        name_en: data.name_en || data.name,
                        description_en: data.description_en || data.description
                    });
                }
            }
        }

        // --- REPAIR/SEED: SPECIALIZED SERVICES ---
        const specializedSnap = await adminDb.collection("specialized_services").get();
        if (specializedSnap.empty) {
            const defaultSpec = [
                { 
                    title: "توصيل واستقبال المطار", 
                    title_en: "Airport Transfer", 
                    desc: "خدمة راقية من وإلى جميع مطارات دول الخليج العربي، مع استقبال خاص في صالات الانتظار ومتابعة دقيقة لمواعيد الرحلات.", 
                    desc_en: "VIP service to all GCC airports with personalized meet & greet and flight tracking.",
                    image: "https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&q=80&w=800", 
                    order: 1 
                },
                { 
                    title: "رحلات جسر الملك فهد", 
                    title_en: "King Fahd Causeway Trips", 
                    desc: "تنقل يومي سلس وآمن بين مملكة البحرين والمملكة العربية السعودية (الخبر، الدمام، الجبيل، الرياض) بأفضل الأسعار.", 
                    desc_en: "Safe daily travel between Bahrain and Saudi Arabia (Khobar, Dammam, Riyadh) at best rates.",
                    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800", 
                    order: 2 
                },
                { 
                    title: "خدمة كبار الشخصيات VIP", 
                    title_en: "VIP Chauffeur Service", 
                    desc: "سيارات فاخرة من أحدث الطرازات مع سائقين محترفين بزي رسمي لخدمة وفود الشركات والمناسبات الخاصة والأعراس.", 
                    desc_en: "Luxury fleet with professional suited drivers for corporate delegations and special events.",
                    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800", 
                    order: 3 
                }
            ];
            for (const s of defaultSpec) await adminDb.collection("specialized_services").add(s);
        } else {
            for (const doc of specializedSnap.docs) {
                const data = doc.data();
                if (!data.title_en || !data.desc_en) {
                    await doc.ref.update({
                        title_en: data.title_en || data.title,
                        desc_en: data.desc_en || data.desc
                    });
                }
            }
        }

        // Seed Admin Users
        const adminEmails = ['ahjm91@gmail.com', 'ali@gcctaxi.net'];
        const adminPassword = process.env.ADMIN_PASSWORD || 'gcc1425taxi*';
        for (const email of adminEmails) {
            try {
                const user = await admin.auth().getUserByEmail(email);
                await admin.auth().updateUser(user.uid, { password: adminPassword, emailVerified: true });
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    await admin.auth().createUser({ email, password: adminPassword, emailVerified: true, displayName: 'Admin' });
                }
            }
        }
    } catch (err) {
        console.error("[FIREBASE] Seed error:", err);
    }
};

// seedDestinations();

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

  // Debug Endpoint
  app.get('/api/debug/db-counts', async (req, res) => {
    try {
      const servicesSnap = await getDocs(collection(db, "services"));
      const specSnap = await getDocs(collection(db, "specialized_services"));
      const routesSnap = await getDocs(collection(db, "fixed_routes"));
      const settingsSnap = await getDocs(collection(db, "settings"));
      
      res.json({
        services: servicesSnap.size,
        specialized_services: specSnap.size,
        fixed_routes: routesSnap.size,
        settings_collections: settingsSnap.size,
        databaseId: (db as any).databaseId
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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

  // Administrative User Management
  app.post("/api/admin/users/update", async (req, res) => {
    const { targetUid, updates } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      // 1. Verify Requesting User is Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      const requesterEmail = decodedToken.email;

      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const adminDb = admin.firestore(config.firestoreDatabaseId);
      
      const settingsSnap = await adminDb.collection("settings").doc("site").get();
      const adminEmails = settingsSnap.data()?.adminEmails || [];

      if (!adminEmails.includes(requesterEmail)) {
        return res.status(403).json({ success: false, message: "Forbidden: Not an admin" });
      }

      // 2. Perform Auth Updates
      const authUpdates: any = {};
      if (updates.email) authUpdates.email = updates.email;
      if (updates.password) authUpdates.password = updates.password;
      if (updates.name) authUpdates.displayName = updates.name;

      if (Object.keys(authUpdates).length > 0) {
        await admin.auth().updateUser(targetUid, authUpdates);
      }

      // 3. Perform Firestore Updates
      const firestoreUpdates: any = {};
      if (updates.name) firestoreUpdates.name = updates.name;
      if (updates.email) firestoreUpdates.email = updates.email;
      if (updates.phone) firestoreUpdates.phone = updates.phone;

      if (Object.keys(firestoreUpdates).length > 0) {
        await adminDb.collection("users").doc(targetUid).update(firestoreUpdates);
        
        // If they are a driver, update driver doc too
        const driverSnap = await adminDb.collection("drivers").doc(targetUid).get();
        if (driverSnap.exists) {
          const driverUpdates: any = {};
          if (updates.name) driverUpdates.name = updates.name;
          if (updates.phone) driverUpdates.phone = updates.phone;
          await adminDb.collection("drivers").doc(targetUid).update(driverUpdates);
        }
      }

      res.json({ success: true, message: "User updated successfully" });
    } catch (error: any) {
      console.error("[ADMIN USER UPDATE ERROR]", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/admin/users/create", async (req, res) => {
    const { name, email, phone, password } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const requesterEmail = decodedToken.email;

      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const adminDb = admin.firestore(config.firestoreDatabaseId);
      
      const settingsSnap = await adminDb.collection("settings").doc("site").get();
      const adminEmails = settingsSnap.data()?.adminEmails || [];

      if (!adminEmails.includes(requesterEmail)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      // Create in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password: password || '12345678',
        displayName: name,
        phoneNumber: (phone?.startsWith('+') && phone.length >= 8) ? phone : undefined
      });

      // Initialize Profile
      const statsRef = adminDb.collection("settings").doc("stats");
      const statsSnap = await statsRef.get();
      let nextNum = 1250;
      if (statsSnap.exists) {
        nextNum = (statsSnap.data()?.lastMembershipNumber || 1249) + 1;
      }
      await statsRef.set({ lastMembershipNumber: nextNum }, { merge: true });

      const newProfile = {
        uid: userRecord.uid,
        name,
        email,
        phone: phone || '',
        role: 'customer',
        createdAt: new Date().toISOString(),
        membershipStatus: 'Bronze',
        membershipNumber: nextNum,
        isVerified: true,
        cashbackBalance: 0,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        wallet: { balance: 0, totalEarnings: 0, pendingPayouts: 0, lastUpdate: new Date().toISOString() }
      };

      await adminDb.collection("users").doc(userRecord.uid).set(newProfile);

      res.json({ success: true, user: newProfile });
    } catch (error: any) {
      console.error("[ADMIN USER CREATE ERROR]", error);
      res.status(500).json({ success: false, message: error.message });
    }
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

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Run seeding once server is up
    await seedDestinations();
  });
}

startServer();
