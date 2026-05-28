import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { AreaAssignment } from "../models/AreaAssignment.js";
import { LeadCredential } from "../models/LeadCredential.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

// GET /api/auth/me — get current user with zone/area assignments
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const jwt = await import("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "hp-team-management-secret-2024";
    const payload = jwt.default.verify(token, JWT_SECRET) as any;
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const zoneAssignments = await ZoneAssignment.find({ userId: user._id });
    const areaAssignments = await AreaAssignment.find({ userId: user._id });
    res.json({ user, zoneAssignments, areaAssignments });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// GET /api/auth/my-assignments
router.get("/my-assignments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const zoneAssignments = await ZoneAssignment.find({ userId: req.user!.id });
    const areaAssignments = await AreaAssignment.find({ userId: req.user!.id });
    res.json({ zoneAssignments, areaAssignments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req: Request, res: Response): void => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("session", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  });
  res.json({ success: true });
});

// POST /api/auth/login — username/password for leads
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password required" });
      return;
    }

    const credential = await LeadCredential.findOne({ username }).populate("userId");
    if (!credential) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, credential.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = credential.userId as any;
    await User.findByIdAndUpdate(user._id, { lastSignedIn: new Date() });

    const token = signToken({
      id: user._id.toString(),
      openId: user.openId,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/oauth/callback — OAuth callback
router.get("/oauth/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const { openId, name, email } = req.query as { openId: string; name: string; email: string };
    if (!openId) {
      res.status(400).json({ error: "Missing openId" });
      return;
    }

    let user = await User.findOne({ openId });
    if (!user) {
      const count = await User.countDocuments();
      user = await User.create({
        openId,
        name,
        email,
        loginMethod: "oauth",
        role: count === 0 ? "admin" : "user",
        lastSignedIn: new Date(),
      });
    } else {
      user.lastSignedIn = new Date();
      await user.save();
    }

    const token = signToken({
      id: user._id.toString(),
      openId: user.openId,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
    });

    const isProdOAuth = process.env.NODE_ENV === "production";
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: isProdOAuth ? "none" : "lax",
      secure: isProdOAuth,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/");
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simple local login for development (name + email → auto-create user)
router.post("/local-login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body as { name: string; email: string };
    if (!name || !email) {
      res.status(400).json({ error: "Name and email required" });
      return;
    }
    const openId = `local:${email.toLowerCase().trim()}`;
    let user = await User.findOne({ openId });
    if (!user) {
      const count = await User.countDocuments();
      user = await User.create({
        openId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        loginMethod: "local",
        role: count === 0 ? "admin" : "user",
        lastSignedIn: new Date(),
      });
    } else {
      user.lastSignedIn = new Date();
      await user.save();
    }

    const token = signToken({
      id: user._id.toString(),
      openId: user.openId,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      role: user.role,
    });

    const isProdLocal = process.env.NODE_ENV === "production";
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: isProdLocal ? "none" : "lax",
      secure: isProdLocal,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
