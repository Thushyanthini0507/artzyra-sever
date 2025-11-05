import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    talent_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
    },
    experience: {
      type: String,
    },
    portfolio_link: {
      type: String,
    },
    price_per_service: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Artist", artistSchema);
