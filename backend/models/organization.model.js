// models/Organization.js
import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["Healthcare Provider", "Pharmaceutical Supplier", "admin"],
      required: true
    },

    location: {
      country: { type: String, trim: true },
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true },
      pincode: { type: String, trim: true }
    },

    // Contact details
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      trim: true
    },

    // Supplier intelligence fields
    isVerified: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    suppliedDrugs: [
      {
        type: String,
        trim: true
      }
    ],

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    fulfillmentRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },

    avgResponseHours: {
      type: Number,
      default: 0,
      min: 0
    },

    deliveryRadiusKm: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Better uniqueness constraint
organizationSchema.index(
  {
    name: 1,
    type: 1,
    "location.pincode": 1
  },
  { unique: true }
);

// Useful for supplier dropdown search
organizationSchema.index({
  type: 1,
  isVerified: 1,
  isActive: 1,
  rating: -1
});

export default mongoose.model("Organization", organizationSchema);