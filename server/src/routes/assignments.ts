import { Router, Request, Response } from "express";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { scopeByRole } from "../middleware/auth.js";

const router = Router();

// GET /api/assignments — list filled slots with team/member/hotel details
router.get("/", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = req.scope ?? {};
    const query: Record<string, any> = { teamId: { $ne: null } };

    let slots = await TournamentSlot.find(query)
      .populate("tournamentId")
      .populate({ path: "teamId", populate: { path: "members" } })
      .sort({ slotNumber: 1 });

    if (scope.zones && scope.zones.length > 0) {
      slots = slots.filter((s) => {
        const team = s.teamId as any;
        return team && scope.zones!.includes(team.zone);
      });
    }

    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/assignments/:slotId/room — update room number
router.patch("/:slotId/room", scopeByRole, async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber } = req.body;
    const slot = await TournamentSlot.findByIdAndUpdate(req.params.slotId, { roomNumber }, { new: true });
    if (!slot) { res.status(404).json({ error: "Slot not found" }); return; }
    res.json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
