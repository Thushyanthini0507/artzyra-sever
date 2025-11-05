import mongoose from "mongoose";
import Customer from "./Customer.js";

const saleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer.name",
    required: true,
  },

  items: {
    type: [
      {
        item: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    required: true,
  },

  total: {
    type: Number,
    // required: true,
  },

  status: {
    type: String,
    enum: ["pending", "accept", "decline"],
    default: "pending",
    trim: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

saleSchema.pre("save", function (next) {
  this.total = this.items.reduce((acc, item) => acc + item.quantity, 0);
  next();
});
export default mongoose.model("Sale", saleSchema);
