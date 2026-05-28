import mongoose from "mongoose";

export const GENDERS = ["M", "F"] as const;
export const ACO_OPTIONS = ["Yes", "No"] as const;
export const AGE_RANGES = ["0-6", "7-14", "15-45", "46-65", "65+"] as const;

const personSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true, maxlength: 255 },
    lastName:   { type: String, maxlength: 255 },
    email:      { type: String, maxlength: 320 },
    phone:      { type: String, maxlength: 50 },
    city:       { type: String, maxlength: 255 },
    state:      { type: String, maxlength: 255 },
    country:    { type: String, maxlength: 255 },
    gender:     { type: String, enum: GENDERS, required: true },
    mandal:     { type: String, maxlength: 255 },
    familyId:   { type: String, maxlength: 100 },
    ageRange:   { type: String, maxlength: 20 },
    memberId:   { type: String, maxlength: 100 },
    acoNeeded:  { type: String, enum: ACO_OPTIONS, default: "No", required: true },
    zone:       { type: String, maxlength: 255 },
    area:       { type: String, maxlength: 255 },
    name:       { type: String, maxlength: 255 },
    category:   { type: String, maxlength: 255 },
    note:       { type: String },
  },
  { timestamps: true }
);

// Virtuals
personSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});

personSchema.virtual("isAcoPlayer").get(function () {
  return this.acoNeeded === "Yes";
});

personSchema.virtual("displayLabel").get(function () {
  return `${[this.firstName, this.lastName].filter(Boolean).join(" ")} (${this.zone || "Unassigned"})`;
});

// Indexes
personSchema.index({ zone: 1 });
personSchema.index({ area: 1 });
personSchema.index({ acoNeeded: 1 });
personSchema.index({ memberId: 1 }, { unique: true, sparse: true });
personSchema.index({ firstName: "text", lastName: "text", name: "text" });

personSchema.set("toJSON", { virtuals: true });
personSchema.set("toObject", { virtuals: true });

export const Person = mongoose.model("Person", personSchema);
