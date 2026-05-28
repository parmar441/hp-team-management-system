import { Router, Request, Response } from "express";
import { Team } from "../models/Team.js";
import { Person } from "../models/Person.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { ZoneAssignment } from "../models/ZoneAssignment.js";
import { requireAuth, requireLead } from "../middleware/auth.js";

const router = Router();

// GET /api/team-lead/my-zones
router.get("/my-zones", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team-lead/people — list people in assigned zones
router.get("/people", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const zones = assignments.map((a) => a.zone);
    const people = await Person.find({ zone: { $in: zones } }).sort({ firstName: 1 });
    res.json(people);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team-lead/teams
router.get("/teams", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const zones = assignments.map((a) => a.zone);
    const teams = await Team.find({ zone: { $in: zones } }).populate("members").sort({ name: 1 });
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team-lead/teams
router.post("/teams", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const { members, zone } = req.body as { members: string[]; zone?: string };
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const allowedZones = assignments.map((a) => a.zone);

    if (zone && !allowedZones.includes(zone)) {
      res.status(403).json({ error: "Not authorized for this zone" });
      return;
    }
    if (!members || members.length < 2 || members.length > 8) {
      res.status(400).json({ error: "Team requires 2-8 members" });
      return;
    }

    const count = await Team.countDocuments();
    const team = await Team.create({
      name: `Team ${count + 1}`,
      members,
      zone,
      createdByUserId: req.user!.id,
    });
    const populated = await Team.findById(team._id).populate("members");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/team-lead/teams/:id
router.put("/teams/:id", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const allowedZones = assignments.map((a) => a.zone);
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    if (team.zone && !allowedZones.includes(team.zone)) {
      res.status(403).json({ error: "Not authorized for this zone" });
      return;
    }
    const updated = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("members");
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/team-lead/teams/:id
router.delete("/teams/:id", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const allowedZones = assignments.map((a) => a.zone);
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    if (team.zone && !allowedZones.includes(team.zone)) {
      res.status(403).json({ error: "Not authorized for this zone" });
      return;
    }
    await Team.findByIdAndDelete(req.params.id);
    await TournamentSlot.updateMany({ teamId: team._id }, { $set: { teamId: null } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team-lead/stats
router.get("/stats", requireLead, async (req: Request, res: Response): Promise<void> => {
  try {
    const assignments = await ZoneAssignment.find({ userId: req.user!.id });
    const zones = assignments.map((a) => a.zone);
    const [totalPeople, acoPlayers, totalTeams] = await Promise.all([
      Person.countDocuments({ zone: { $in: zones } }),
      Person.countDocuments({ zone: { $in: zones }, acoNeeded: "Yes" }),
      Team.countDocuments({ zone: { $in: zones } }),
    ]);
    res.json({ totalPeople, acoPlayers, totalTeams, zones });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
