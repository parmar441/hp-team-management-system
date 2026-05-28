import { Router, Request, Response } from "express";
import { Team } from "../models/Team.js";
import { Person } from "../models/Person.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { scopeByRole, requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/teams
router.get("/", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const query: Record<string, any> = {};
    if (scope.zones && scope.zones.length > 0) {
      query.zone = { $in: scope.zones };
    }
    const teams = await Team.find(query).populate("members").sort({ name: 1 });
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/available-people — people with acoNeeded=Yes not on a team
router.get("/available-people", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find();
    const assignedIds = teams.flatMap((t) => t.members.map((m) => m.toString()));
    const scope = req.scope ?? {};
    const query: Record<string, any> = { acoNeeded: "Yes", _id: { $nin: assignedIds } };
    if (scope.zones && scope.zones.length > 0) query.zone = { $in: scope.zones };
    const people = await Person.find(query).sort({ firstName: 1 });
    res.json(people);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:id
router.get("/:id", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await Team.findById(req.params.id).populate("members");
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teams
router.post("/", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { members, zone } = req.body as { members: string[]; zone?: string };
    if (!members || members.length < 2 || members.length > 8) {
      res.status(400).json({ error: "Team requires 2-8 members" });
      return;
    }
    // Check all members have acoNeeded=Yes and are not on any team
    const existingTeams = await Team.find();
    const assignedIds = new Set(existingTeams.flatMap((t) => t.members.map((m) => m.toString())));
    for (const id of members) {
      if (assignedIds.has(id)) {
        res.status(400).json({ error: `Person ${id} is already on a team` });
        return;
      }
    }
    const firstPerson = await Person.findById(members[0]);
    const teamZone = zone || firstPerson?.zone || undefined;
    // Auto-generate team name
    const count = await Team.countDocuments();
    const team = await Team.create({
      name: `Team ${count + 1}`,
      members,
      zone: teamZone,
      createdByUserId: req.user!.id,
    });
    const populated = await Team.findById(team._id).populate("members");
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/teams/:id — update team members
router.put("/:id", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { members, name, zone } = req.body;
    const update: Record<string, any> = {};
    if (members !== undefined) update.members = members;
    if (name !== undefined) update.name = name;
    if (zone !== undefined) update.zone = zone;
    const team = await Team.findByIdAndUpdate(req.params.id, update, { new: true }).populate("members");
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    res.json(team);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/teams/:id — cascades: releases tournament slot
router.delete("/:id", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    await TournamentSlot.updateMany({ teamId: team._id }, { $set: { teamId: null } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/teams/:id/add-members
router.patch("/:id/add-members", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { members } = req.body as { members: string[] };
    const team = await Team.findById(req.params.id);
    if (!team) { res.status(404).json({ error: "Not found" }); return; }
    if ((team.members.length + members.length) > 8) {
      res.status(400).json({ error: "Exceeds max team size of 8" });
      return;
    }
    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: { $each: members } } },
      { new: true }
    ).populate("members");
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/teams/:id/remove-members
router.patch("/:id/remove-members", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { members } = req.body as { members: string[] };
    const updated = await Team.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: { $in: members } } },
      { new: true }
    ).populate("members");
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
