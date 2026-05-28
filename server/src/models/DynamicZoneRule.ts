import mongoose from "mongoose";

export const ZONE_RULE_FIELDS = ["gender", "mandal", "country", "ageRange"] as const;

const dynamicZoneRuleSchema = new mongoose.Schema(
  {
    zoneId:     { type: mongoose.Schema.Types.ObjectId, ref: "DynamicZone", required: true },
    field:      { type: String, enum: ZONE_RULE_FIELDS, required: true },
    matchValue: { type: String, required: true, maxlength: 255 },
    priority:   { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

dynamicZoneRuleSchema.index({ zoneId: 1 });

export const DynamicZoneRule = mongoose.model("DynamicZoneRule", dynamicZoneRuleSchema);
