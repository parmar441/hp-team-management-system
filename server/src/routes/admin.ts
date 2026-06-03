import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { AreaAssignment } from "../models/AreaAssignment.js";
import { AuditLog } from "../models/AuditLog.js";
import { LeadCredential } from "../models/LeadCredential.js";
import { HotelPersonAssignment } from "../models/HotelPersonAssignment.js";
import { DynamicZone } from "../models/DynamicZone.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/admin/users
router.get("/users", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/zone-assignments
router.get("/zone-assignments", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find().populate("userId");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/zone-assignments
router.post("/zone-assignments", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, zone } = req.body;
    const assignment = await ZoneAssignment.create({ userId, zone });
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/zone-assignments/:id
router.delete("/zone-assignments/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await ZoneAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/zone-summary
router.get("/zone-summary", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await DynamicZone.find();
    const summary = await Promise.all(
      zones.map(async (z) => {
        const assignments = await ZoneAssignment.countDocuments({ zone: z.name });
        return { zone: z.name, userCount: assignments };
      })
    );
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/area-assignments
router.get("/area-assignments", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await AreaAssignment.find().populate("userId");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/area-assignments
router.post("/area-assignments", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, zone, area } = req.body;
    const assignment = await AreaAssignment.create({ userId, zone, area });
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/area-assignments/:id
router.delete("/area-assignments/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await AreaAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/bulk-assign — bulk assign users to zone+area
router.post("/bulk-assign", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignments } = req.body as { assignments: Array<{ userId: string; zone: string; area?: string }> };
    for (const a of assignments) {
      await ZoneAssignment.findOneAndUpdate({ userId: a.userId, zone: a.zone }, { userId: a.userId, zone: a.zone }, { upsert: true });
      if (a.area) {
        await AreaAssignment.findOneAndUpdate({ userId: a.userId, zone: a.zone, area: a.area }, { userId: a.userId, zone: a.zone, area: a.area }, { upsert: true });
      }
    }
    res.json({ assigned: assignments.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/admin/audit-log
router.get("/audit-log", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, action, targetName, page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const query: Record<string, any> = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (targetName) query.targetName = new RegExp(targetName, "i");
    const pageNum = parseInt(page, 10);
    const size = Math.min(parseInt(pageSize, 10), 200);
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * size).limit(size),
      AuditLog.countDocuments(query),
    ]);
    res.json({ logs, total, page: pageNum, pageSize: size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/credentials — create username/password for a lead
router.post("/credentials", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const credential = await LeadCredential.create({ userId, username, passwordHash, createdBy: req.user!.id });
    res.status(201).json({ id: credential._id, username });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/credentials/:id
router.delete("/credentials/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await LeadCredential.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Hotel Person Credential Management ──────────────────────────────────────

// POST /api/admin/hotel-person/credentials — create hotel person user with credentials
router.post("/hotel-person/credentials", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const openId = `hp_${username}_${Date.now()}`;
    const user = await User.create({ openId, name: username, role: "hotel_person", loginMethod: "credential" });
    const credential = await LeadCredential.create({ userId: user._id, username, passwordHash, createdBy: req.user!.id });
    res.status(201).json({ id: credential._id, userId: user._id, username });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/hotel-person/credentials/:id — delete hotel person credentials and user
router.delete("/hotel-person/credentials/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const credential = await LeadCredential.findById(req.params.id);
    if (!credential) { res.status(404).json({ error: "Not found" }); return; }
    await HotelPersonAssignment.deleteMany({ userId: credential.userId });
    await LeadCredential.findByIdAndDelete(req.params.id);
    await User.findByIdAndDelete(credential.userId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/hotel-person/credentials/:id/regenerate — regenerate password
router.patch("/hotel-person/credentials/:id/regenerate", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const credential = await LeadCredential.findByIdAndUpdate(req.params.id, { passwordHash }, { new: true });
    if (!credential) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ success: true, username: credential.username });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── Hotel Person Assignment Management ──────────────────────────────────────

// GET /api/admin/hotel-person/assignments — list all hotel-person-to-hotel assignments
router.get("/hotel-person/assignments", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await HotelPersonAssignment.find().populate("userId").populate("hotelId");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/hotel-person/assignments — assign a hotel to a hotel person
router.post("/hotel-person/assignments", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, hotelId } = req.body;
    const assignment = await HotelPersonAssignment.create({ userId, hotelId });
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/hotel-person/assignments/:id — remove hotel assignment from hotel person
router.delete("/hotel-person/assignments/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await HotelPersonAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
