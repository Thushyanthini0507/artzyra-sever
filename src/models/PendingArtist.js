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

