import { Router, Request, Response } from "express";
import { DynamicZone } from "../models/DynamicZone.js";
import { DynamicZoneRule } from "../models/DynamicZoneRule.js";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { User } from "../models/User.js";
import { LeadCredential } from "../models/LeadCredential.js";
import { Person } from "../models/Person.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { reapplyAllZoneRules } from "../helpers/zoneClassifier.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/dynamic-zones — with rules
router.get("/", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await DynamicZone.find().sort({ name: 1 });
    const rules = await DynamicZoneRule.find().sort({ priority: -1 });
    const zonesWithRules = zones.map((z) => ({
      ...z.toObject(),
      rules: rules.filter((r) => r.zoneId.toString() === z._id.toString()),
    }));
    res.json(zonesWithRules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-zones/names
router.get("/names", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const zones = await DynamicZone.find().select("name").sort({ name: 1 });
    res.json(zones.map((z) => z.name));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-zones
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await DynamicZone.create(req.body);
    res.status(201).json(zone);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dynamic-zones/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = await DynamicZone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) { res.status(404).json({ error: "Not found" }); return; }
    res.json(zone);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-zones/:id
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await DynamicZone.findByIdAndDelete(req.params.id);
    await DynamicZoneRule.deleteMany({ zoneId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-zones/:id/rules — add rule
router.post("/:id/rules", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await DynamicZoneRule.create({ ...req.body, zoneId: req.params.id });
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dynamic-zones/rules/:ruleId
router.put("/rules/:ruleId", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await DynamicZoneRule.findByIdAndUpdate(req.params.ruleId, req.body, { new: true });
    if (!rule) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-zones/rules/:ruleId
router.delete("/rules/:ruleId", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await DynamicZoneRule.findByIdAndDelete(req.params.ruleId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-zones/reapply — re-evaluate all people
router.post("/reapply", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await reapplyAllZoneRules();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-zones/people-counts
router.get("/people-counts", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const counts = await Person.aggregate([
      { $group: { _id: "$zone", count: { $sum: 1 } } },
    ]);
    res.json(counts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-zones/leads
router.get("/leads", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find().populate("userId");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-zones/leads
router.post("/leads", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, zone } = req.body;
    const assignment = await ZoneAssignment.create({ userId, zone });
    await User.findByIdAndUpdate(userId, { role: "zone_lead" });
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-zones/leads/:id
router.delete("/leads/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await ZoneAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: assignment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-zones/available-users
router.get("/available-users", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: { $in: ["admin", "zone_lead"] } });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-zones/credentials
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

export default router;
