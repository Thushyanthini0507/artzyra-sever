import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "lkr",
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    stripeChargeId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", paymentSchema);
