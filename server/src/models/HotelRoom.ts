import mongoose from "mongoose";

const hotelRoomSchema = new mongoose.Schema(
  {
    hotelId:    { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    roomNumber: { type: String, required: true, maxlength: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Virtuals
hotelRoomSchema.virtual("isAssigned").get(function () {
  return false; // Resolved via aggregation at query time
});

// Query Helpers
(hotelRoomSchema.query as any).forHotel = function (this: any, hotelId: string) {
  return this.where({ hotelId });
};

hotelRoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });
hotelRoomSchema.set("toJSON", { virtuals: true });
hotelRoomSchema.set("toObject", { virtuals: true });

export const HotelRoom = mongoose.model("HotelRoom", hotelRoomSchema);
