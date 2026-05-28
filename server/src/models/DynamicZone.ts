import mongoose from "mongoose";

const dynamicZoneSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, unique: true, maxlength: 255 },
    isDefault: { type: Boolean, default: false, required: true },
  },
  { timestamps: true }
);

export const DynamicZone = mongoose.model("DynamicZone", dynamicZoneSchema);
