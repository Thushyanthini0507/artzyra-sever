import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    review_id: {
      type: String,
      unique: true,
      required: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    talent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Talent",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
); // adds createdAt & updatedAt automatically

export default mongoose.model("Review", reviewSchema);
