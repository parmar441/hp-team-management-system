import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { TournamentSlot } from "./models/TournamentSlot.js";
import { ZoneAssignment } from "./models/ZoneAssignment.js";
import { AreaAssignment } from "./models/AreaAssignment.js";
import { requireAuth } from "./middleware/auth.js";

export async function exportAssignmentsPdf(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Fetch all occupied slots
    let slots = await TournamentSlot.find({ teamId: { $ne: null } })
      .populate("tournamentId")
      .populate({ path: "teamId", populate: { path: "members" } })
      .sort({ slotNumber: 1 });

    // GDPR role-based scoping
    if (user.role === "zone_lead") {
      const zoneAssignments = await ZoneAssignment.find({ userId: user.id }).distinct("zone");
      slots = slots.filter((s) => {
        const team = s.teamId as any;
        return team && zoneAssignments.includes(team.zone);
      });
    } else if (user.role === "area_lead") {
      const areaAssignments = await AreaAssignment.find({ userId: user.id });
      const zones = [...new Set(areaAssignments.map((a) => a.zone))];
      slots = slots.filter((s) => {
        const team = s.teamId as any;
        return team && zones.includes(team.zone);
      });
    } else if (user.role === "user") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=assignments.pdf");
    doc.pipe(res);

    doc.fontSize(20).font("Helvetica-Bold").text("Team Assignments", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").text(`Generated: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown(1);

    // Group by hotel
    const byHotel: Record<string, any[]> = {};
    slots.forEach((s) => {
      const hotel = (s.tournamentId as any)?.name || "Unknown Hotel";
      if (!byHotel[hotel]) byHotel[hotel] = [];
      byHotel[hotel].push(s);
    });

    for (const [hotelName, hotelSlots] of Object.entries(byHotel)) {
      doc.fontSize(14).font("Helvetica-Bold").text(hotelName, { underline: true });
      doc.moveDown(0.3);

      for (const slot of hotelSlots) {
        const team = slot.teamId as any;
        if (!team) continue;
        const members = team.members?.map((m: any) => `${m.firstName} ${m.lastName || ""}`.trim()).join(", ") || "";
        doc.fontSize(11).font("Helvetica-Bold").text(`${team.name}  —  Room: ${slot.roomNumber || "TBD"}`);
        doc.fontSize(9).font("Helvetica").fillColor("#666").text(`Zone: ${team.zone || "—"} | Members: ${members}`);
        doc.fillColor("#000").moveDown(0.3);
      }
      doc.moveDown(0.5);
    }

    doc.end();
  } catch (err: any) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: err.message });
  }
}
