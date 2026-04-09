// models/Drug.js
import mongoose from "mongoose";

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  dailyUsage: {
    type: Number,
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  }
}, { timestamps: true });

drugSchema.index({ organizationId: 1 });

export default mongoose.model("Drug", drugSchema);