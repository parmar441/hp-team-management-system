import { Router, Request, Response } from "express";
import { Person } from "../models/Person.js";
import { Team } from "../models/Team.js";
import { Tournament } from "../models/Tournament.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { DynamicZone } from "../models/DynamicZone.js";
import { HotelRoom } from "../models/HotelRoom.js";
import { scopeByRole } from "../middleware/auth.js";

const router = Router();

// GET /api/dashboard/overview?zone=&area= — status counts + hotel overview (role + filter aware)
router.get("/overview", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const { zone, area } = req.query as Record<string, string>;

    // People/ACO query: role scope first, then explicit zone/area filters
    const pq: Record<string, any> = {};
    if (scope.zones && scope.zones.length > 0) pq.zone = { $in: scope.zones };
    if (scope.areas && scope.areas.length > 0) pq.area = { $in: scope.areas };
    if (zone) pq.zone = zone;
    if (area) pq.area = area;

    // Teams are zoned (not area'd)
    const tq: Record<string, any> = {};
    if (scope.zones && scope.zones.length > 0) tq.zone = { $in: scope.zones };
    if (zone) tq.zone = zone;

    const [peopleTotal, peopleChecked, acoTotal, acoChecked, teams, hotels, rooms, roomsAssigned, tournaments] =
      await Promise.all([
        Person.countDocuments(pq),
        Person.countDocuments({ ...pq, checkedIn: "Yes" }),
        Person.countDocuments({ ...pq, acoNeeded: "Yes" }),
        Person.countDocuments({ ...pq, acoNeeded: "Yes", checkedIn: "Yes" }),
        Team.countDocuments(tq),
        Tournament.countDocuments(),
        HotelRoom.countDocuments(),
        TournamentSlot.countDocuments({ roomNumber: { $nin: [null, ""] } }),
        Tournament.find(),
      ]);

    // Hotel overview: remaining slots + zone → slots breakdown
    const hotelOverview = await Promise.all(
      tournaments.map(async (t) => {
        const slots = await TournamentSlot.find({ tournamentId: t._id })
          .populate({ path: "teamId", select: "zone name" });
        const occupied = slots.filter((s) => s.teamId != null);
        const zoneMap = new Map<string, number>();
        for (const s of occupied) {
          const z = ((s.teamId as any)?.zone as string) || "Unassigned";
          zoneMap.set(z, (zoneMap.get(z) ?? 0) + 1);
        }
        return {
          id: t._id.toString(),
          name: t.name,
          totalSlots: (t as any).totalSlots ?? slots.length,
          occupied: occupied.length,
          remaining: Math.max(0, ((t as any).totalSlots ?? slots.length) - occupied.length),
          zones: [...zoneMap.entries()].map(([zoneName, n]) => ({ zone: zoneName, slots: n })),
        };
      })
    );

    res.json({
      counts: {
        people: { count: peopleTotal, checkedIn: peopleChecked },
        aco:    { count: acoTotal,    checkedIn: acoChecked },
        teams:  { count: teams,       checkedIn: 0 },
        hotels: { count: hotels,      checkedIn: 0 },
        rooms:  { count: rooms,       checkedIn: roomsAssigned },
      },
      checkedInTotal: peopleChecked,
      peopleTotal,
      hotels: hotelOverview,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
