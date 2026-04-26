// models/drug.model.js
import mongoose from "mongoose";

const drugSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  dailyUsage: { type: Number, required: true },
  usageHistory: [Number], // AI benefits from 7-14 days of history [cite: 40]
  hospitalType: { type: String, enum: ["rural", "urban"], default: "rural" }, // [cite: 41]
  region: String,
  coldChainIntact: { type: Boolean, default: true },
  batches: [{
    batch_no: String,
    expiry_date: String,
    qty: Number
  }],
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }
}, { timestamps: true });

drugSchema.index({ organizationId: 1 });
export default mongoose.model("Drug", drugSchema);