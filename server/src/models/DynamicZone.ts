import mongoose from "mongoose";

const dynamicZoneSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, unique: true, maxlength: 255 },
    isDefault: { type: Boolean, default: false, required: true },
    // Higher priority is evaluated first; first zone whose conditions ALL match wins.
    priority:  { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

export const DynamicZone = mongoose.model("DynamicZone", dynamicZoneSchema);
