import mongoose from "mongoose";

const zoneAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    zone:   { type: String, required: true, maxlength: 255 },
  },
  { timestamps: true }
);

zoneAssignmentSchema.index({ userId: 1, zone: 1 }, { unique: true });

export const ZoneAssignment = mongoose.model("ZoneAssignment", zoneAssignmentSchema);
