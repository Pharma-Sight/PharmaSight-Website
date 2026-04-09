// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  drugName: String,
  quantity: Number,
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "DELIVERED"],
    default: "PENDING"
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);