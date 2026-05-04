
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// In a real production environment, you would use a service account key
// Here we initialize with environment variables or default if available
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // databaseURL: "https://your-project-id.firebaseio.com"
    });
  } catch (error) {
    console.warn("Firebase Admin could not initialize with applicationDefault. Ensure GOOGLE_APPLICATION_CREDENTIALS is set in production.");
    // Fallback for development if keys are provided in .env
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
  }
}

const db = admin.firestore?.() || null;

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
