import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName:   { type: String, required: true, maxlength: 255 },
    userRole:   { type: String, required: true, maxlength: 50 },
    action:     { type: String, enum: ["create", "update", "delete"], required: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    targetName: { type: String, required: true, maxlength: 255 },
    field:      { type: String, maxlength: 100 },
    oldValue:   { type: String },
    newValue:   { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetId: 1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
