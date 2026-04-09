// models/Organization.js
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["Healthcare Provider", "Pharmaceutical Supplier"],
    required: true
  },
  location: {
    country: String,
    state: String,
    district: String,
    city: String,
    pincode: String
  }
}, { timestamps: true });

organizationSchema.index({
  name: 1,
  "location.pincode": 1
}, { unique: true });

export default mongoose.model("Organization", organizationSchema);