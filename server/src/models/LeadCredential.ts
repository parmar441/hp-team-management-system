import mongoose from "mongoose";

const leadCredentialSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username:     { type: String, required: true, unique: true, maxlength: 255 },
    passwordHash: { type: String, required: true, maxlength: 255 },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const LeadCredential = mongoose.model("LeadCredential", leadCredentialSchema);
