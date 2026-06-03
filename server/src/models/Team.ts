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

// Query Helpers
(teamSchema.query as any).withMembers = function (this: any) {
  return this.populate("members");
};
(teamSchema.query as any).inZone = function (this: any, zone: string) {
  return this.where({ zone });
};
(teamSchema.query as any).nonEmpty = function (this: any) {
  return this.where({ "members.0": { $exists: true } });
};

teamSchema.index({ zone: 1 });
teamSchema.set("toJSON", { virtuals: true });
teamSchema.set("toObject", { virtuals: true });

export const Team = mongoose.model("Team", teamSchema);
