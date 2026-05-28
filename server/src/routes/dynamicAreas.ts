import { Router, Request, Response } from "express";
import { DynamicArea } from "../models/DynamicArea.js";
import { DynamicAreaRule } from "../models/DynamicAreaRule.js";
import { DynamicZone } from "../models/DynamicZone.js";
import { AreaAssignment } from "../models/AreaAssignment.js";
import { User } from "../models/User.js";
import { LeadCredential } from "../models/LeadCredential.js";
import { Person } from "../models/Person.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { reapplyAllAreaRules } from "../helpers/zoneClassifier.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Resolve zoneId: accepts either an ObjectId string or a zone name string
async function resolveZoneId(zoneId: any): Promise<mongoose.Types.ObjectId | undefined> {
  if (!zoneId || zoneId === "") return undefined;
  if (mongoose.Types.ObjectId.isValid(zoneId)) return new mongoose.Types.ObjectId(zoneId);
  // It's a zone name — look up the ID
  const zone = await DynamicZone.findOne({ name: zoneId });
  return zone ? zone._id as mongoose.Types.ObjectId : undefined;
}

const router = Router();

// GET /api/dynamic-areas — with rules
router.get("/", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const areas = await DynamicArea.find().populate("zoneId").sort({ name: 1 });
    const rules = await DynamicAreaRule.find().sort({ priority: -1 });
    const areasWithRules = areas.map((a) => ({
      ...a.toObject(),
      rules: rules.filter((r) => r.areaId.toString() === a._id.toString()),
    }));
    res.json(areasWithRules);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-areas
router.post("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, zoneId } = req.body;
    const resolvedZoneId = await resolveZoneId(zoneId);
    const area = await DynamicArea.create({ name, zoneId: resolvedZoneId });
    const populated = await DynamicArea.findById(area._id).populate("zoneId");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dynamic-areas/:id
router.put("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, zoneId } = req.body;
    const resolvedZoneId = await resolveZoneId(zoneId);
    const update: Record<string, any> = { name };
    if (resolvedZoneId !== undefined) update.zoneId = resolvedZoneId;
    const area = await DynamicArea.findByIdAndUpdate(req.params.id, update, { new: true }).populate("zoneId");
    if (!area) { res.status(404).json({ error: "Not found" }); return; }
    res.json(area);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-areas/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await DynamicArea.findByIdAndDelete(req.params.id);
    await DynamicAreaRule.deleteMany({ areaId: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-areas/:id/rules
router.post("/:id/rules", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await DynamicAreaRule.create({ ...req.body, areaId: req.params.id });
    res.status(201).json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/dynamic-areas/rules/:ruleId
router.put("/rules/:ruleId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await DynamicAreaRule.findByIdAndUpdate(req.params.ruleId, req.body, { new: true });
    if (!rule) { res.status(404).json({ error: "Not found" }); return; }
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-areas/rules/:ruleId
router.delete("/rules/:ruleId", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await DynamicAreaRule.findByIdAndDelete(req.params.ruleId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-areas/reapply
router.post("/reapply", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await reapplyAllAreaRules();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-areas/people-counts
router.get("/people-counts", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const counts = await Person.aggregate([
      { $group: { _id: "$area", count: { $sum: 1 } } },
    ]);
    res.json(counts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-areas/leads
router.get("/leads", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await AreaAssignment.find().populate("userId");
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-areas/leads
router.post("/leads", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, zone, area } = req.body;
    const assignment = await AreaAssignment.create({ userId, zone, area });
    await User.findByIdAndUpdate(userId, { role: "area_lead" });
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/dynamic-areas/leads/:id
router.delete("/leads/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await AreaAssignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: assignment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dynamic-areas/available-users
router.get("/available-users", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: { $in: ["admin", "area_lead", "zone_lead"] } });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dynamic-areas/credentials
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
