import express from "express";
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: import("./schema.js").User;
  }
}
import session from "express-session";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers/index.js";
import { createContext } from "./trpc.js";
import { exportAssignmentsPdf } from "./pdfExport.js";
import {
  getUserByOpenId,
  createUser,
  listUsers,
} from "./helpers.js";
import { db } from "./db.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";

const app = express();
const PORT = process.env.PORT ?? 4500;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "accommodation-seva-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { name, email } = req.body as { name: string; email: string };

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const openId = `local:${email.toLowerCase().trim()}`;
    let user = await getUserByOpenId(openId);

    if (!user) {
      // Check if this is the first user — make them admin
      const allUsers = await listUsers();
      const isFirst = allUsers.length === 0;
      user = await createUser({
        openId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        loginMethod: "local",
      });
      if (isFirst && user) {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
        user = { ...user, role: "admin" };
      }
    } else {
      // Update last signed in
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      // Refresh from DB
      const fresh = await getUserByOpenId(openId);
      if (fresh) user = fresh;
    }

    req.session.user = user ?? undefined;
    res.json({ user });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user });
});

// ── PDF Export ────────────────────────────────────────────────────────────────
app.get("/api/export/assignments-pdf", exportAssignmentsPdf);

// ── tRPC ──────────────────────────────────────────────────────────────────────
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Accommodation Seva server running on port ${PORT}`);
});

export type { AppRouter } from "./routers/index.js";
