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

// Query Helpers
(tournamentSlotSchema.query as any).withTeam = function (this: any) {
  return this.populate({ path: "teamId", populate: { path: "members" } });
};
(tournamentSlotSchema.query as any).forTournament = function (this: any, tournamentId: string) {
  return this.where({ tournamentId });
};
(tournamentSlotSchema.query as any).occupied = function (this: any) {
  return this.where({ teamId: { $ne: null } });
};
(tournamentSlotSchema.query as any).vacant = function (this: any) {
  return this.where({ teamId: null });
};

tournamentSlotSchema.index({ tournamentId: 1, slotNumber: 1 }, { unique: true });
tournamentSlotSchema.set("toJSON", { virtuals: true });
tournamentSlotSchema.set("toObject", { virtuals: true });

export const TournamentSlot = mongoose.model("TournamentSlot", tournamentSlotSchema);
