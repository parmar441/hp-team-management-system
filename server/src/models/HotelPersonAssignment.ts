import mongoose from "mongoose";

const hotelPersonAssignmentSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

hotelPersonAssignmentSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

export const HotelPersonAssignment = mongoose.model("HotelPersonAssignment", hotelPersonAssignmentSchema);
