import { Router, Request, Response } from "express";
import { Person } from "../models/Person.js";
import { requireAdmin } from "../middleware/auth.js";
import { classifyPersonZone, classifyPersonArea } from "../helpers/zoneClassifier.js";

const router = Router();

// Strip empty strings from optional fields to avoid unique sparse index violations
function sanitizePerson(data: Record<string, any>) {
  const optionalFields = ["memberId", "familyId", "email", "phone", "city", "state", "country", "mandal", "category", "note", "lastName"];
  const cleaned = { ...data };
  for (const field of optionalFields) {
    if (cleaned[field] === "" || cleaned[field] === null) {
      delete cleaned[field];
    }
  }
  return cleaned;
}

// GET /api/registrations
router.get("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = "1", pageSize = "50" } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const size = Math.min(parseInt(pageSize, 10), 200);
    const [people, total] = await Promise.all([
      Person.find().sort({ createdAt: -1 }).skip((pageNum - 1) * size).limit(size),
      Person.countDocuments(),
    ]);
    res.json({ people, total, page: pageNum, pageSize: size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/registrations
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = sanitizePerson(req.body);
    const zone = await classifyPersonZone(data as any);
    const area = zone ? await classifyPersonArea(data as any, zone) : null;
    const person = await Person.create({ ...data, zone: zone ?? undefined, area: area ?? undefined });
    res.status(201).json(person);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/registrations/bulk
router.post("/bulk", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { people } = req.body as { people: any[] };
    const withZones = await Promise.all(
      people.map(async (p) => {
        const clean = sanitizePerson(p);
        const zone = await classifyPersonZone(clean as any);
        const area = zone ? await classifyPersonArea(clean as any, zone) : null;
        return { ...clean, zone: zone ?? undefined, area: area ?? undefined };
      })
    );
    const created = await Person.insertMany(withZones, { ordered: false });
    res.status(201).json({ created: created.length, people: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/registrations/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const old = await Person.findById(req.params.id);
    if (!old) { res.status(404).json({ error: "Not found" }); return; }
    const data = sanitizePerson(req.body);
    const merged = { ...old.toObject(), ...data };
    const zone = await classifyPersonZone(merged as any);
    const area = zone ? await classifyPersonArea(merged as any, zone) : null;
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      { ...data, zone: zone ?? undefined, area: area ?? undefined },
      { new: true, runValidators: true }
    );
    res.json(person);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/registrations/:id
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    if (!person) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
