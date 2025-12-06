import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    // Reference to Users collection (REQUIRED)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Profile fields
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty (optional field)
          const {
            isValidSriLankanPhone,
          } = require("../utils/phoneValidation.js");
          return isValidSriLankanPhone(v);
        },
        message:
          "Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)",
      },
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    // Admin-specific fields
    permissions: {
      type: [String],
      default: [],
    },
    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Admin", adminSchema);
