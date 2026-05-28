import mongoose from "mongoose";

export const AREA_RULE_FIELDS = ["gender", "mandal", "ageRange"] as const;

const dynamicAreaRuleSchema = new mongoose.Schema(
  {
    areaId:     { type: mongoose.Schema.Types.ObjectId, ref: "DynamicArea", required: true },
    field:      { type: String, enum: AREA_RULE_FIELDS, required: true },
    matchValue: { type: String, required: true, maxlength: 255 },
    priority:   { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

dynamicAreaRuleSchema.index({ areaId: 1 });

export const DynamicAreaRule = mongoose.model("DynamicAreaRule", dynamicAreaRuleSchema);
