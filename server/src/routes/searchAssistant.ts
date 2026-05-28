import { Router, Request, Response } from "express";
import OpenAI from "openai";
import { Person } from "../models/Person.js";
import { Team } from "../models/Team.js";
import { TournamentSlot } from "../models/TournamentSlot.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/search-assistant/query
router.post("/query", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body as { question: string };
    if (!question) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Step 1: Extract search parameters via LLM (structured JSON schema)
    const extraction = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Extract the person name and intent from the question. Return JSON with searchName (string) and intent (one of: status, details, team, hotel, list, count).",
        },
        { role: "user", content: question },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "search_params",
          schema: {
            type: "object",
            properties: {
              searchName: { type: "string" },
              intent: { type: "string", enum: ["status", "details", "team", "hotel", "list", "count"] },
            },
            required: ["searchName", "intent"],
          },
        },
      },
    } as any);

    const params = JSON.parse(extraction.choices[0].message.content || "{}");

    // Step 2: Query database
    const regex = new RegExp(params.searchName, "i");
    const people = await Person.find({ $or: [{ firstName: regex }, { lastName: regex }, { name: regex }] }).limit(10);

    // Step 3: Enrich with team/hotel data
    const teamDocs = await Team.find({ members: { $in: people.map((p) => p._id) } }).populate("members");
    const slots = await TournamentSlot.find({
      teamId: { $in: teamDocs.map((t) => t._id) },
    }).populate("tournamentId");

    // Step 4: Build enriched data (GDPR: minimal fields only)
    const enrichedPeople = people.map((p) => {
      const team = teamDocs.find((t) =>
        t.members.some((m: any) => m._id.toString() === p._id.toString())
      );
      const slot = team ? slots.find((s) => s.teamId?.toString() === team._id.toString()) : null;
      const tournament = slot?.tournamentId as any;

      return {
        name: (`${p.firstName} ${p.lastName || ""}`).trim() || p.name,
        zone: p.zone,
        area: p.area,
        acoNeeded: p.acoNeeded,
        team: team?.name,
        hotel: tournament?.name,
        roomNumber: slot?.roomNumber,
      };
    });

    // Step 5: Generate natural language answer
    const answer = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Answer the user's question based on the provided data. Be concise and helpful.",
        },
        {
          role: "user",
          content: `Question: ${question}\nData: ${JSON.stringify(enrichedPeople, null, 2)}`,
        },
      ],
    });

    res.json({
      answer: answer.choices[0].message.content,
      people: enrichedPeople,
    });
  } catch (err: any) {
    console.error("Search assistant error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
