import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// client/dist is two levels up from server/dist/index.js
const CLIENT_DIST = join(__dirname, "../../client/dist");

import authRoutes from "./routes/auth.js";
import peopleRoutes from "./routes/people.js";
import teamsRoutes from "./routes/teams.js";
import tournamentsRoutes from "./routes/tournaments.js";
import assignmentsRoutes from "./routes/assignments.js";
import dashboardRoutes from "./routes/dashboard.js";
import adminRoutes from "./routes/admin.js";
import teamLeadRoutes from "./routes/teamLead.js";
import registrationsRoutes from "./routes/registrations.js";
import dynamicZonesRoutes from "./routes/dynamicZones.js";
import dynamicAreasRoutes from "./routes/dynamicAreas.js";
import searchAssistantRoutes from "./routes/searchAssistant.js";
import hotelRoomsRoutes from "./routes/hotelRooms.js";

const app = express();
// Behind Render's TLS-terminating proxy, trust the first hop's X-Forwarded-*
// so req.protocol reports "https" (needed to build correct OAuth redirect URIs).
// A specific hop count (not `true`) keeps express-rate-limit happy.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hp-team-management";

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const writeLimiter = rateLimit({ windowMs: 60_000, max: 30 });
const bulkLimiter = rateLimit({ windowMs: 60_000, max: 5 });
const exportLimiter = rateLimit({ windowMs: 60_000, max: 3 });

// ── Serve React frontend static files (before any other middleware) ────────────
const clientIndex = join(CLIENT_DIST, "index.html");
const hasClientBuild = fs.existsSync(clientIndex);
if (hasClientBuild) {
  app.use(express.static(CLIENT_DIST));
}

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/api", generalLimiter);

// ── Bulk rate limiter for specific endpoints ────────────────────────────────
app.post("/api/people/bulk-delete", bulkLimiter);
app.patch("/api/people/bulk-toggle-aco", bulkLimiter);
app.patch("/api/people/bulk-check-in", bulkLimiter);
app.post("/api/tournaments/:id/bulk-assign", bulkLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/people", writeLimiter, peopleRoutes);
app.use("/api/teams", writeLimiter, teamsRoutes);
app.use("/api/tournaments", writeLimiter, tournamentsRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/team-lead", teamLeadRoutes);
app.use("/api/registrations", registrationsRoutes);
app.use("/api/dynamic-zones", dynamicZonesRoutes);
app.use("/api/dynamic-areas", dynamicAreasRoutes);
app.use("/api/search-assistant", searchAssistantRoutes);
app.use("/api/hotel-rooms", hotelRoomsRoutes);

// ── PDF Export ────────────────────────────────────────────────────────────────
app.get("/api/export/assignments-pdf", exportLimiter, async (req, res) => {
  try {
    const { exportAssignmentsPdf } = await import("./pdfExport.js");
    return exportAssignmentsPdf(req as any, res as any);
  } catch {
    res.status(500).json({ error: "PDF export unavailable" });
  }
});

// ── API 404 handler ────────────────────────────────────────────────────────────
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(400).json({ error: `Duplicate value: ${field} already exists` });
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

// ── SPA fallback (production) ──────────────────────────────────────────────────
if (hasClientBuild) {
  app.get("*", (_req, res) => {
    res.sendFile(clientIndex, (err) => {
      if (err) res.status(404).send("Not found");
    });
  });
} else {
  console.warn(`⚠️  client/dist not found at ${CLIENT_DIST} — frontend not served`);
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 HP Team Management server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

start();
