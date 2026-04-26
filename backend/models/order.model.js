// models/order.model.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  drugName: String,
  quantity: Number,
  cost_inr: Number, // [cite: 94]
  reliability_score: Number, // [cite: 96]
  status: { 
    type: String, 
    enum: ["PENDING", "APPROVED", "DISPATCHED", "DELIVERED"], 
    default: "PENDING" 
  },
  trackingId: { type: String },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);