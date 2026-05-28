import mongoose from "mongoose";

const areaAssignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    zone:   { type: String, required: true, maxlength: 255 },
    area:   { type: String, required: true, maxlength: 255 },
  },
  { timestamps: true }
);

areaAssignmentSchema.index({ userId: 1, zone: 1, area: 1 }, { unique: true });

export const AreaAssignment = mongoose.model("AreaAssignment", areaAssignmentSchema);
