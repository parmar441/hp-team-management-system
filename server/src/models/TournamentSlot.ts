import mongoose from "mongoose";

const tournamentSlotSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    slotNumber:   { type: Number, required: true },
    teamId:       { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    roomNumber:   { type: String, maxlength: 255 },
  },
  { timestamps: true }
);

// Virtuals
tournamentSlotSchema.virtual("isOccupied").get(function () {
  return this.teamId != null;
});

tournamentSlotSchema.virtual("hasRoom").get(function () {
  return this.roomNumber != null && this.roomNumber !== "";
});

tournamentSlotSchema.index({ tournamentId: 1, slotNumber: 1 }, { unique: true });
tournamentSlotSchema.set("toJSON", { virtuals: true });
tournamentSlotSchema.set("toObject", { virtuals: true });

export const TournamentSlot = mongoose.model("TournamentSlot", tournamentSlotSchema);
