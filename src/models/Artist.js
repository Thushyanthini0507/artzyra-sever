import mongoose from "mongoose";
import Category from "./Category.js";

const artistSchema = new mongoose.Schema(
  {
    // Reference to Users collection (REQUIRED)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Profile-specific fields
    bio: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Category,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    hourlyRate: {
      type: Number,
      default: 0,
    },
    availability: {
      type: Map,
      of: {
        start: String,
        end: String,
        available: Boolean,
      },
      default: {},
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Approval status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    reason: {
      type: String,
      trim: true,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Transform availability field before validation
// This handles string values and converts them to proper Map format
artistSchema.pre("validate", function (next) {
  if (this.availability && typeof this.availability === "string") {
    // Convert string to default weekday schedule
    this.availability = {
      monday: { start: "09:00", end: "18:00", available: true },
      tuesday: { start: "09:00", end: "18:00", available: true },
      wednesday: { start: "09:00", end: "18:00", available: true },
      thursday: { start: "09:00", end: "18:00", available: true },
      friday: { start: "09:00", end: "18:00", available: true },
      saturday: { start: "09:00", end: "18:00", available: false },
      sunday: { start: "09:00", end: "18:00", available: false },
    };
  } else if (this.availability instanceof Map) {
    // Convert Map to plain object
    this.availability = Object.fromEntries(this.availability);
  } else if (!this.availability || (typeof this.availability === "object" && Object.keys(this.availability).length === 0)) {
    // Ensure empty object if null/undefined
    this.availability = {};
  }
  next();
});

// Indexes for better query performance
artistSchema.index({ status: 1 });
artistSchema.index({ bio: "text", skills: "text" });

export default mongoose.model("Artist", artistSchema);
