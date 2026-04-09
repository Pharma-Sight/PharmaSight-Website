// models/Prediction.js
import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  drugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Drug",
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  },
  daysLeft: Number,
  riskLevel: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"]
  },
  confidence: Number
}, { timestamps: true });

predictionSchema.index({ organizationId: 1 });

export default mongoose.model("Prediction", predictionSchema);