//controller to fetch active pharmaceutical suppliers sorted by rating
//controllers/organization.controller.js
import Organization from "../models/organization.model.js";

export const getSuppliers = async (req, res) => {
  try {
    // Filter by type "Pharmaceutical Supplier" and ensure they are active
    const suppliers = await Organization.find({
      type: "Pharmaceutical Supplier",
      isActive: true
    }).sort({ rating: -1 }); // Optional: sort by highest rating

    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch suppliers", error: error.message });
  }
};