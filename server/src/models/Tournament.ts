import mongoose from "mongoose";

export const TOURNAMENT_STATUSES = ["upcoming", "not_available", "available"] as const;

const tournamentSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, maxlength: 255 },
    address:    { type: String },
    totalSlots: { type: Number, required: true, default: 8 },
    status:     { type: String, enum: TOURNAMENT_STATUSES, default: "upcoming", required: true },
  },
  { timestamps: true }
);

export const Tournament = mongoose.model("Tournament", tournamentSchema);
