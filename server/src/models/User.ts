import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    openId:      { type: String, required: true, unique: true, maxlength: 64 },
    name:        { type: String },
    email:       { type: String, maxlength: 320 },
    loginMethod: { type: String, maxlength: 64 },
    role:        { type: String, enum: ["user", "admin", "zone_lead", "area_lead"], default: "user" },
    lastSignedIn: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);

userSchema.virtual("displayName").get(function () {
  return this.name || this.email || this.openId;
});

userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

userSchema.virtual("isLead").get(function () {
  return ["zone_lead", "area_lead"].includes(this.role);
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = mongoose.model("User", userSchema);
