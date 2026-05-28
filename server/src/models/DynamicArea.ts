import mongoose from "mongoose";

const dynamicAreaSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, maxlength: 255 },
    zoneId: { type: mongoose.Schema.Types.ObjectId, ref: "DynamicZone" },
  },
  { timestamps: true }
);

dynamicAreaSchema.index({ zoneId: 1 });

export const DynamicArea = mongoose.model("DynamicArea", dynamicAreaSchema);
