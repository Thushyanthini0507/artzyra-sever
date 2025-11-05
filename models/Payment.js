import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    payment_id: {
      type: String,
      unique: true,
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    service_type: {
      type: String,
      enum: ["Design Order", "Talent Booking"],
      required: true,
    },
    service_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["Card", "Cash", "Online"],
      required: true,
    },
    payment_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Success", "Failed", "Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
); // adds createdAt & updatedAt automatically

module.exports = mongoose.model("Payment", paymentSchema);

