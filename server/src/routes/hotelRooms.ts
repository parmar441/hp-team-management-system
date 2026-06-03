import { Router, Request, Response } from "express";
import multer from "multer";
import { HotelRoom } from "../models/HotelRoom.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { requireAuth, requireHotelAccess } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function ensureHotelAccess(req: Request, hotelId: string): boolean {
  if (req.user?.role === "admin") return true;
  return req.scope?.hotelIds?.includes(hotelId) ?? false;
}

// GET /api/hotel-rooms/:hotelId — list pre-defined rooms for a hotel
router.get("/:hotelId", requireHotelAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureHotelAccess(req, req.params.hotelId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rooms = await HotelRoom.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 });
    res.json(rooms);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hotel-rooms/:hotelId/with-status — rooms with assignment status
router.get("/:hotelId/with-status", requireHotelAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureHotelAccess(req, req.params.hotelId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rooms = await HotelRoom.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 });
    const assignedSlots = await TournamentSlot.find({
      tournamentId: req.params.hotelId,
      roomNumber: { $nin: [null, ""] },
    });
    const assignedRoomNumbers = new Set(assignedSlots.map((s) => s.roomNumber));

    const roomsWithStatus = rooms.map((r) => ({
      ...r.toObject(),
      isAssigned: assignedRoomNumbers.has(r.roomNumber),
    }));

    res.json(roomsWithStatus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hotel-rooms/:hotelId/available — only unassigned rooms
router.get("/:hotelId/available", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await HotelRoom.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 });
    const assignedSlots = await TournamentSlot.find({
      tournamentId: req.params.hotelId,
      roomNumber: { $nin: [null, ""] },
    });
    const assignedRoomNumbers = new Set(assignedSlots.map((s) => s.roomNumber));
    const available = rooms.filter((r) => !assignedRoomNumbers.has(r.roomNumber));
    res.json(available);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hotel-rooms/:hotelId — add room numbers (single or bulk, comma/newline separated)
router.post("/:hotelId", requireHotelAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureHotelAccess(req, req.params.hotelId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { roomNumbers } = req.body as { roomNumbers: string };
    const numbers = roomNumbers
      .split(/[,\n]+/)
      .map((n: string) => n.trim())
      .filter(Boolean);
    const unique = [...new Set(numbers)];

    const docs = unique.map((roomNumber) => ({
      hotelId: req.params.hotelId,
      roomNumber,
    }));
    const created = await HotelRoom.insertMany(docs, { ordered: false }).catch((err) => {
      if (err.insertedDocs) return err.insertedDocs;
      throw err;
    });
    res.status(201).json({ created: Array.isArray(created) ? created.length : 0, rooms: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/hotel-rooms/:roomId — delete a single pre-defined room
router.delete("/:roomId", requireHotelAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await HotelRoom.findById(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    if (!ensureHotelAccess(req, room.hotelId.toString())) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await room.deleteOne();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hotel-rooms/:hotelId/all — delete all pre-defined rooms for a hotel
router.delete("/:hotelId/all", requireHotelAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureHotelAccess(req, req.params.hotelId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const result = await HotelRoom.deleteMany({ hotelId: req.params.hotelId });
    res.json({ deleted: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/hotel-rooms/:hotelId/import — bulk import room numbers from CSV/Excel
router.post("/:hotelId/import", requireHotelAccess, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!ensureHotelAccess(req, req.params.hotelId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const text = file.buffer.toString("utf-8");
    const numbers = text
      .split(/[\r\n,]+/)
      .map((n: string) => n.trim())
      .filter(Boolean);
    const unique = [...new Set(numbers)];

    const docs = unique.map((roomNumber) => ({
      hotelId: req.params.hotelId,
      roomNumber,
    }));
    const created = await HotelRoom.insertMany(docs, { ordered: false }).catch((err) => {
      if (err.insertedDocs) return err.insertedDocs;
      throw err;
    });
    res.status(201).json({ imported: Array.isArray(created) ? created.length : 0 });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
