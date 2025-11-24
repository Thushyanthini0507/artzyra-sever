/**
 * CategoryUser Model
 * Stores category-based user profiles
 * References the central Users collection
 */
import mongoose from "mongoose";
import Category from "./Category.js";

const categoryUserSchema = new mongoose.Schema(
  {
    // Reference to Users collection
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Category information
    categoryName: {
      type: String,
      required: [true, "Please provide category name"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    // Skills and expertise
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    // Pricing
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Experience
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
    // Portfolio
    portfolio: [
      {
        type: String,
        trim: true,
      },
    ],
    // Availability
    availability: {
      type: Map,
      of: {
        start: String,
        end: String,
        available: Boolean,
      },
      default: {},
    },
    // Additional fields
    bio: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
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
    isApproved: {
      type: Boolean,
      default: false, // Requires admin approval
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (userId already has unique: true which creates an index)
categoryUserSchema.index({ category: 1 });
categoryUserSchema.index({ categoryName: "text", skills: "text", bio: "text" });

export default mongoose.model("CategoryUser", categoryUserSchema);





