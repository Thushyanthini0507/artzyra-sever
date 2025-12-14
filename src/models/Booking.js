import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
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
    service: {
      type: String, // Can be a specific service name or ID if you have a Service model
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in hours
      required: true,
    },
    deliveryDays: {
      type: Number, // Snapshot from Artist service at time of booking
    },
    endTime: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "declined"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  },
  {
    timestamps: true,
  }
);

// Calculate end time before saving if not provided
bookingSchema.pre("save", function (next) {
  if (this.startTime && this.duration && !this.endTime) {
    // Simple calculation assuming HH:mm format
    const [hours, minutes] = this.startTime.split(":").map(Number);
    const endHour = hours + this.duration;
    this.endTime = `${endHour.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
