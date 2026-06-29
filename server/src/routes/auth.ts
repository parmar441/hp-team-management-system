import { Router, Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/User.js";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { AreaAssignment } from "../models/AreaAssignment.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Base URL the browser uses to reach this app (prod = app domain, dev = vite origin). */
function baseUrl(req: Request) {
  return process.env.APP_BASE_URL || `${req.protocol}://${req.get("host")}`;
}
function redirectUri(req: Request) {
  return `${baseUrl(req)}/api/auth/google/callback`;
}

// GET /api/auth/me — current user with zone/area assignments
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
  res.clearCookie("session", { httpOnly: true, sameSite: "lax", secure: true });
  res.json({ success: true });
});

// ── Google OAuth (the only sign-in method) ──────────────────────────────────

// GET /api/auth/google — start the OAuth consent flow
router.get("/google", (req: Request, res: Response): void => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    res.redirect("/login?error=google_not_configured");
    return;
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    include_granted_scopes: "true",
    state,
  });
  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

// GET /api/auth/google/callback — exchange code, upsert user, set session
router.get("/google/callback", async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query as { code?: string; state?: string; error?: string };
    if (req.query.error || !code) {
      res.redirect("/login?error=google_failed");
      return;
    }
    if (!state || state !== req.cookies?.oauth_state) {
      res.redirect("/login?error=state_mismatch");
      return;
    }
    res.clearCookie("oauth_state");

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    // Exchange authorization code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      res.redirect("/login?error=token_exchange");
      return;
    }
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      res.redirect("/login?error=no_access_token");
      return;
    }

    // Fetch the verified Google profile
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
      res.redirect("/login?error=userinfo");
      return;
    }
    const profile = (await profileRes.json()) as {
      sub: string; email?: string; name?: string; email_verified?: boolean;
    };
    if (!profile.sub) {
      res.redirect("/login?error=no_profile");
      return;
    }

    const googleOpenId = `google:${profile.sub}`;
    const email = profile.email?.toLowerCase().trim();

    // 1) Already linked to this Google account
    let user = await User.findOne({ openId: googleOpenId });

    // 2) Match an existing account by email → keep its role, link Google
    if (!user && email) {
      user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
      if (user) {
        user.openId = googleOpenId;
        user.loginMethod = "google";
        if (!user.name && profile.name) user.name = profile.name;
      }
    }

    // 3) Brand-new user — first ever becomes admin
    if (!user) {
      const count = await User.countDocuments();
      user = await User.create({
        openId: googleOpenId,
        name: profile.name,
        email,
        loginMethod: "google",
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
    res.cookie("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect("/");
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    res.redirect("/login?error=oauth_error");
  }
});

export default router;
