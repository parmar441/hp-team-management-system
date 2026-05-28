import { Router, Request, Response } from "express";
import { Person } from "../models/Person.js";
import { Team } from "../models/Team.js";
import { Tournament } from "../models/Tournament.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { DynamicZone } from "../models/DynamicZone.js";
import { scopeByRole } from "../middleware/auth.js";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const personQuery: Record<string, any> = {};
    if (scope.zones && scope.zones.length > 0) personQuery.zone = { $in: scope.zones };

    const [totalPeople, acoPlayers, totalTeams, totalHotels, assignedSlots] = await Promise.all([
      Person.countDocuments(personQuery),
      Person.countDocuments({ ...personQuery, acoNeeded: "Yes" }),
      Team.countDocuments(scope.zones && scope.zones.length > 0 ? { zone: { $in: scope.zones } } : {}),
      Tournament.countDocuments(),
      TournamentSlot.countDocuments({ teamId: { $ne: null } }),
    ]);

    res.json({
      totalPeople,
      acoPlayers,
      nonAcoPlayers: totalPeople - acoPlayers,
      totalTeams,
      totalHotels,
      assignedSlots,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/enhanced-stats
router.get("/enhanced-stats", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const personQuery: Record<string, any> = {};
    if (scope.zones && scope.zones.length > 0) personQuery.zone = { $in: scope.zones };

    const zones = await DynamicZone.find();
    const zoneBreakdown = await Promise.all(
      zones.map(async (z) => {
        const zq = { ...personQuery, zone: z.name };
        const count = await Person.countDocuments(zq);
        const aco = await Person.countDocuments({ ...zq, acoNeeded: "Yes" });
        const teams = await Team.countDocuments({ zone: z.name });
        return { zone: z.name, count, aco, teams };
      })
    );

    res.json({ zoneBreakdown });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/tree-stats — hierarchical zone-to-area tree
router.get("/tree-stats", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const zones = await DynamicZone.find();

    const tree = await Promise.all(
      zones.map(async (z) => {
        if (scope.zones && scope.zones.length > 0 && !scope.zones.includes(z.name)) return null;
        const people = await Person.aggregate([
          { $match: { zone: z.name } },
          { $group: { _id: "$area", count: { $sum: 1 }, aco: { $sum: { $cond: [{ $eq: ["$acoNeeded", "Yes"] }, 1, 0] } } } },
        ]);
        return { zone: z.name, isDefault: z.isDefault, areas: people };
      })
    );

    res.json({ tree: tree.filter(Boolean) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
