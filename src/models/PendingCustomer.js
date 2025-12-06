import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const pendingCustomerSchema = new mongoose.Schema(
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
          const { isValidSriLankanPhone } = require("../utils/phoneValidation.js");
          return isValidSriLankanPhone(v);
        },
        message: "Please provide a valid Sri Lankan phone number (e.g., 0712345678 or 712345678)"
      }
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false, // Don't return password by default
    },
    // Customer-specific fields
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    profileImage: {
      type: String,
      default: "",
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
pendingCustomerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Note: email already has unique: true which creates an index automatically

export default mongoose.model("PendingCustomer", pendingCustomerSchema);

