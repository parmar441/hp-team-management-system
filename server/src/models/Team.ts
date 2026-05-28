import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, maxlength: 255 },
    zone:            { type: String, maxlength: 255 },
    members:         [{ type: mongoose.Schema.Types.ObjectId, ref: "Person" }],
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtuals
teamSchema.virtual("memberCount").get(function () {
  return this.members ? this.members.length : 0;
});

teamSchema.virtual("isFull").get(function () {
  const count = this.members ? this.members.length : 0;
  return count >= 8;
});

teamSchema.virtual("isEmpty").get(function () {
  const count = this.members ? this.members.length : 0;
  return count === 0;
});

teamSchema.index({ zone: 1 });
teamSchema.set("toJSON", { virtuals: true });
teamSchema.set("toObject", { virtuals: true });

export const Team = mongoose.model("Team", teamSchema);
