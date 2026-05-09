import { type Request, type Response } from "express";
import "express-session";

declare module "express-session" {
  interface SessionData {
    user?: import("./schema.js").User;
  }
}
import PDFDocument from "pdfkit";
import { listAssignments } from "./helpers.js";

export async function exportAssignmentsPdf(req: Request, res: Response) {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const assignments = await listAssignments();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="assignments.pdf"');

  const doc = new PDFDocument({ size: "A4", margin: 40, autoFirstPage: true });
  doc.pipe(res);

  const pageWidth = doc.page.width - 80;
  const cols = { slot: 40, team: 120, members: 200, room: 80, zone: pageWidth - 440 };
  const rowH = 20;
  let totalAssignments = 0;
  let hotelCount = 0;

  function drawTableHeader(y: number) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#374151");

    let x = 40;
    doc.text("Slot", x, y, { width: cols.slot });
    x += cols.slot;
    doc.text("Team", x, y, { width: cols.team });
    x += cols.team;
    doc.text("Members", x, y, { width: cols.members });
    x += cols.members;
    doc.text("Room", x, y, { width: cols.room });
    x += cols.room;
    doc.text("Zone", x, y, { width: cols.zone });

    doc
      .moveTo(40, y + rowH - 2)
      .lineTo(40 + pageWidth, y + rowH - 2)
      .strokeColor("#d1d5db")
      .stroke();
  }

  // Title
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#1e293b")
    .text("Accommodation Seva — Assignments", 40, 40);

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#6b7280")
    .text(`Generated: ${new Date().toLocaleString()}`, 40, 65);

  let y = 90;

  for (const hotel of assignments) {
    const filledSlots = hotel.slots.filter((s: any) => s.teamId !== null);
    if (filledSlots.length === 0) continue;

    hotelCount++;

    // Check if we need a new page
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 40;
    }

    // Hotel header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1e40af")
      .text(hotel.name, 40, y);
    y += 18;

    if (hotel.address) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6b7280")
        .text(hotel.address, 40, y);
      y += 14;
    }

    drawTableHeader(y);
    y += rowH;

    for (let i = 0; i < filledSlots.length; i++) {
      const slot = filledSlots[i] as any;
      if (!slot.team) continue;

      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
        drawTableHeader(y);
        y += rowH;
      }

      // Alternating row background
      if (i % 2 === 0) {
        doc
          .rect(40, y - 3, pageWidth, rowH)
          .fillColor("#f8fafc")
          .fill();
      }

      doc.font("Helvetica").fontSize(9).fillColor("#1e293b");

      const members = (slot.team.members ?? [])
        .map((m: any) => m.name)
        .join(", ");

      let x = 40;
      doc.text(String(slot.slotNumber), x, y, { width: cols.slot });
      x += cols.slot;
      doc.text(slot.team.name ?? "", x, y, { width: cols.team, ellipsis: true });
      x += cols.team;
      doc.text(members, x, y, { width: cols.members, ellipsis: true });
      x += cols.members;
      doc.text(slot.roomNumber ?? "—", x, y, { width: cols.room });
      x += cols.room;
      doc.text(slot.team.zone ?? "", x, y, { width: cols.zone });

      y += rowH;
      totalAssignments++;
    }

    y += 10;
  }

  // Footer
  if (y > doc.page.height - 80) {
    doc.addPage();
    y = 40;
  }

  doc
    .moveTo(40, y)
    .lineTo(40 + pageWidth, y)
    .strokeColor("#e5e7eb")
    .stroke();

  y += 10;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#6b7280")
    .text(
      `Total assignments: ${totalAssignments} | Hotels: ${hotelCount}`,
      40,
      y
    );

  doc.end();
}
