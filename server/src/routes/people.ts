import { Router, Request, Response } from "express";
import multer from "multer";
import { Person } from "../models/Person.js";
import { Team } from "../models/Team.js";
import { requireAdmin, scopeByRole } from "../middleware/auth.js";
import { logAudit } from "../helpers/auditLog.js";
import { classifyPersonZone, classifyPersonArea } from "../helpers/zoneClassifier.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/people
router.get("/", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, zone, area, gender, country, acoNeeded, page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const query: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ firstName: regex }, { lastName: regex }, { name: regex }, { email: regex }];
    }

    const scope = req.scope ?? {};
    if (scope.zones && scope.zones.length > 0) {
      query.zone = { $in: scope.zones };
    } else if (zone) {
      const zones = zone.split(",").filter(Boolean);
      if (zones.length > 0) query.zone = { $in: zones };
    }

    if (scope.areas && scope.areas.length > 0) {
      query.area = { $in: scope.areas };
    } else if (area) {
      const areas = area.split(",").filter(Boolean);
      if (areas.length > 0) query.area = { $in: areas };
    }

    if (gender) query.gender = gender;
    if (country) query.country = new RegExp(country, "i");
    if (acoNeeded) query.acoNeeded = acoNeeded;

    const pageNum = parseInt(page, 10);
    const pageSizeNum = Math.min(parseInt(pageSize, 10), 200);
    const skip = (pageNum - 1) * pageSizeNum;

    const [people, total] = await Promise.all([
      Person.find(query).sort({ firstName: 1, lastName: 1 }).skip(skip).limit(pageSizeNum),
      Person.countDocuments(query),
    ]);

    res.json({ people, total, page: pageNum, pageSize: pageSizeNum });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/people
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const zone = await classifyPersonZone(data);
    const area = zone ? await classifyPersonArea(data, zone) : null;
    const person = await Person.create({ ...data, zone: zone ?? undefined, area: area ?? undefined });
    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name || req.user!.email || req.user!.openId,
      userRole: req.user!.role,
      action: "create",
      targetId: person._id.toString(),
      targetName: `${person.firstName} ${person.lastName || ""}`.trim(),
    });
    res.status(201).json(person);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/people/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const old = await Person.findById(req.params.id);
    if (!old) { res.status(404).json({ error: "Not found" }); return; }

    const data = req.body;
    const zone = await classifyPersonZone({ ...old.toObject(), ...data });
    const area = zone ? await classifyPersonArea({ ...old.toObject(), ...data }, zone) : null;
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      { ...data, zone: zone ?? undefined, area: area ?? undefined },
      { new: true, runValidators: true }
    );

    const fields = Object.keys(data);
    for (const field of fields) {
      const oldVal = (old as any)[field];
      const newVal = (data as any)[field];
      if (String(oldVal) !== String(newVal)) {
        await logAudit({
          userId: req.user!.id,
          userName: req.user!.name || req.user!.email || req.user!.openId,
          userRole: req.user!.role,
          action: "update",
          targetId: old._id.toString(),
          targetName: `${old.firstName} ${old.lastName || ""}`.trim(),
          field,
          oldValue: String(oldVal ?? ""),
          newValue: String(newVal ?? ""),
        });
      }
    }

    res.json(person);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/people/:id
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    if (!person) { res.status(404).json({ error: "Not found" }); return; }
    // Remove from teams
    await Team.updateMany({ members: person._id }, { $pull: { members: person._id } });
    await logAudit({
      userId: req.user!.id,
      userName: req.user!.name || req.user!.email || req.user!.openId,
      userRole: req.user!.role,
      action: "delete",
      targetId: person._id.toString(),
      targetName: `${person.firstName} ${person.lastName || ""}`.trim(),
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/people/bulk — bulk import from CSV
router.post("/bulk", requireAdmin, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    const rows: any[] = req.body.people || [];
    const results = [];
    for (const row of rows) {
      const zone = await classifyPersonZone(row);
      const area = zone ? await classifyPersonArea(row, zone) : null;
      const person = await Person.create({ ...row, zone: zone ?? undefined, area: area ?? undefined });
      results.push(person);
    }
    res.status(201).json({ created: results.length, people: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/people/bulk-delete
router.post("/bulk-delete", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body as { ids: string[] };
    await Team.updateMany({ members: { $in: ids } }, { $pull: { members: { $in: ids } } });
    const result = await Person.deleteMany({ _id: { $in: ids } });
    res.json({ deleted: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/people/:id/toggle-aco
router.patch("/:id/toggle-aco", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { acoNeeded } = req.body as { acoNeeded: "Yes" | "No" };
    const person = await Person.findByIdAndUpdate(req.params.id, { acoNeeded }, { new: true });
    if (!person) { res.status(404).json({ error: "Not found" }); return; }
    if (acoNeeded === "No") {
      await Team.updateMany({ members: person._id }, { $pull: { members: person._id } });
    }
    res.json(person);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/people/bulk-toggle-aco
router.patch("/bulk-toggle-aco", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids, acoNeeded } = req.body as { ids: string[]; acoNeeded: "Yes" | "No" };
    await Person.updateMany({ _id: { $in: ids } }, { acoNeeded });
    if (acoNeeded === "No") {
      await Team.updateMany({ members: { $in: ids } }, { $pull: { members: { $in: ids } } });
    }
    res.json({ updated: ids.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/people/:id/move — move to another team
router.patch("/:id/move", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { fromTeamId, toTeamId } = req.body;
    const person = await Person.findById(req.params.id);
    if (!person) { res.status(404).json({ error: "Not found" }); return; }
    if (fromTeamId) {
      await Team.updateOne({ _id: fromTeamId }, { $pull: { members: person._id } });
    }
    if (toTeamId) {
      const toTeam = await Team.findById(toTeamId);
      if (!toTeam) { res.status(404).json({ error: "Target team not found" }); return; }
      if (toTeam.members.length >= 8) {
        res.status(400).json({ error: "Team is full (max 8 members)" });
        return;
      }
      await Team.updateOne({ _id: toTeamId }, { $addToSet: { members: person._id } });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
