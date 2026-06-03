import { Router, Request, Response } from "express";
import { Tournament } from "../models/Tournament.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { Team } from "../models/Team.js";
import { HotelPersonAssignment } from "../models/HotelPersonAssignment.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/tournaments — scoped for hotel_person to assigned hotels only
router.get("/", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role === "hotel_person") {
      const hotelIds = await HotelPersonAssignment.find({ userId: req.user.id }).distinct("hotelId");
      const tournaments = await Tournament.find({ _id: { $in: hotelIds } }).sort({ name: 1 });
      res.json(tournaments);
      return;
    }
    const tournaments = await Tournament.find().sort({ name: 1 });
    res.json(tournaments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tournaments/:id — with slots
router.get("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) { res.status(404).json({ error: "Not found" }); return; }
    const slots = await TournamentSlot.find({ tournamentId: tournament._id })
      .sort({ slotNumber: 1 })
      .populate({ path: "teamId", populate: { path: "members" } });
    res.json({ tournament, slots });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tournaments
router.post("/", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, totalSlots = 8, status } = req.body;
    const tournament = await Tournament.create({ name, address, totalSlots, status });
    // Bulk-insert slots
    const slotDocs = Array.from({ length: totalSlots }, (_, i) => ({
      tournamentId: tournament._id,
      slotNumber: i + 1,
      teamId: null,
    }));
    await TournamentSlot.insertMany(slotDocs);
    res.status(201).json(tournament);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tournaments/:id
router.put("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tournament) { res.status(404).json({ error: "Not found" }); return; }
    res.json(tournament);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tournaments/:id — cascades slots
router.delete("/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    if (!tournament) { res.status(404).json({ error: "Not found" }); return; }
    await TournamentSlot.deleteMany({ tournamentId: tournament._id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tournaments/:id/assign-team — assign a team to a slot
router.patch("/:id/assign-team", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { slotId, teamId } = req.body;
    const slot = await TournamentSlot.findOneAndUpdate(
      { _id: slotId, tournamentId: req.params.id },
      { teamId },
      { new: true }
    );
    if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
    res.json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tournaments/:id/unassign-team
router.patch("/:id/unassign-team", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { slotId } = req.body;
    const slot = await TournamentSlot.findOneAndUpdate(
      { _id: slotId, tournamentId: req.params.id },
      { teamId: null },
      { new: true }
    );
    if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
    res.json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tournaments/:id/bulk-assign — auto-assign multiple teams to slots
router.post("/:id/bulk-assign", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamIds } = req.body as { teamIds: string[] };
    const slots = await TournamentSlot.find({ tournamentId: req.params.id, teamId: null })
      .sort({ slotNumber: 1 })
      .limit(teamIds.length);
    const updates = teamIds.slice(0, slots.length).map((teamId, i) =>
      TournamentSlot.findByIdAndUpdate(slots[i]._id, { teamId })
    );
    await Promise.all(updates);
    res.json({ assigned: updates.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tournaments/:id/available-teams — teams not assigned to this tournament
router.get("/:id/available-teams", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const occupiedSlots = await TournamentSlot.find({ tournamentId: req.params.id, teamId: { $ne: null } });
    const assignedTeamIds = occupiedSlots.map((s) => s.teamId?.toString()).filter(Boolean);
    const teams = await Team.find({ _id: { $nin: assignedTeamIds } }).populate("members");
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tournaments/slots/:slotId/room — update room number
router.patch("/slots/:slotId/room", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.body;
    const slot = await TournamentSlot.findByIdAndUpdate(req.params.slotId, { roomNumber }, { new: true });
    if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
    res.json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tournaments/:id/bulk-rooms — bulk update room numbers
router.patch("/:id/bulk-rooms", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rooms } = req.body as { rooms: Array<{ slotId: string; roomNumber: string }> };
    const updates = rooms.map(({ slotId, roomNumber }) =>
      TournamentSlot.findByIdAndUpdate(slotId, { roomNumber })
    );
    await Promise.all(updates);
    res.json({ updated: rooms.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
