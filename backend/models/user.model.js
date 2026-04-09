// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Healthcare Provider", "Pharmaceutical Supplier", "admin"],
    required: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  }
}, { timestamps: true });

// userSchema.index({ email: 1 });

export default mongoose.model("User", userSchema);