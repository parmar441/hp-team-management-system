import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { AreaAssignment } from "../models/AreaAssignment.js";

const JWT_SECRET = process.env.JWT_SECRET || "hp-team-management-secret-2024";

export interface JwtPayload {
  id: string;
  openId: string;
  name?: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      scope?: {
        zones?: string[];
        areas?: string[];
      };
    }
  }
}

// Verify JWT from cookie and attach req.user
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Require admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    if (payload.role !== "admin") {
      res.status(403).json({ error: "Forbidden: admin only" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Require zone_lead or area_lead or admin
export const requireLead = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    if (!["admin", "zone_lead", "area_lead"].includes(payload.role)) {
      res.status(403).json({ error: "Forbidden: lead access required" });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Attach scope filters based on role
export const scopeByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;

    if (payload.role === "admin") {
      req.scope = {}; // no filter
    } else if (payload.role === "zone_lead") {
      const assignments = await ZoneAssignment.find({ userId: payload.id }).distinct("zone");
      req.scope = { zones: assignments };
    } else if (payload.role === "area_lead") {
      const areaAssignments = await AreaAssignment.find({ userId: payload.id });
      const zones = [...new Set(areaAssignments.map((a) => a.zone))];
      const areas = areaAssignments.map((a) => a.area);
      req.scope = { zones, areas };
    } else {
      req.scope = {}; // regular user — no special filter applied here
    }

    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
