import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Category from "./Category.js";

const pendingArtistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty (optional field)
          // Accept any phone number with 7-15 digits (international standard)
          const digitsOnly = v.replace(/\D/g, "");
          return digitsOnly.length >= 7 && digitsOnly.length <= 15;
        },
        message: "Please provide a valid phone number (7-15 digits)"
      }
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    // Artist-specific fields
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
      required: [true, "Please provide a category"],
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
    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Transform availability field before validation
// This handles string values and converts them to proper Map format
pendingArtistSchema.pre("validate", function (next) {
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

// Hash password before saving
pendingArtistSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Index for search (email already has unique: true which creates an index)
pendingArtistSchema.index({ name: "text", bio: "text", skills: "text" });

export default mongoose.model("PendingArtist", pendingArtistSchema);

