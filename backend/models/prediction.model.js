// models/prediction.model.js
import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  drugId: { type: mongoose.Schema.Types.ObjectId, ref: "Drug", required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  days_left: Number, // [cite: 49]
  risk_level: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] }, // [cite: 50]
  wastage_value_inr: Number, // [cite: 85]
  procurement_suggestion: {
    supplier: String,
    quantity: Number,
    cost_inr: Number
  }, // Only populated on HIGH risk [cite: 87-94]
  confidence_score: Number // [cite: 53]
}, { timestamps: true });

export default mongoose.model("Prediction", predictionSchema);