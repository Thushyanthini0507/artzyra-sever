import mongoose from "mongoose";
import Category from "./Category.js";
import { isValidSriLankanPhone } from "../utils/phoneValidation.js";

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
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty (optional field)
          return isValidSriLankanPhone(v);
        },
        message:
          "Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)",
      },
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
      ref: "Category",
    },
    artistType: {
      type: String,
      enum: ["physical", "remote"],
      required: true, // Should be derived from category
    },
    subscription: {
      status: {
        type: String,
        enum: ["active", "inactive", "expired"],
        default: "inactive",
      },
      expiresAt: Date,
      plan: String,
    },
    pricing: {
      amount: { type: Number, default: 0 },
      unit: {
        type: String,
        enum: ["hour", "day", "project"],
        default: "project",
      },
      currency: { type: String, default: "LKR" },
    },
    deliveryTime: {
      type: Number, // Days (for Remote)
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
    // Additional profile fields
    portfolio: [
      {
        type: String,
        trim: true,
      },
    ],
    website: {
      type: String,
      trim: true,
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      youtube: { type: String, trim: true },
    },
    experience: {
      years: {
        type: Number,
        default: 0,
        min: 0,
      },
      description: {
        type: String,
        trim: true,
      },
    },
    education: [
      {
        degree: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    certifications: [
      {
        name: { type: String, trim: true },
        issuer: { type: String, trim: true },
        year: { type: Number },
      },
    ],
    languages: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
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
    stripeAccountId: {
      type: String,
      trim: true,
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
  } else if (
    !this.availability ||
    (typeof this.availability === "object" &&
      Object.keys(this.availability).length === 0)
  ) {
    // Ensure empty object if null/undefined
    this.availability = {};
  }
  next();
});

// Indexes for better query performance
artistSchema.index({ status: 1 });
artistSchema.index({ bio: "text", skills: "text" });

export default mongoose.model("Artist", artistSchema);
