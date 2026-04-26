//routes/organization.routes.js
import express from "express";
import { getSuppliers } from "../controllers/organization.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Assuming you have auth middleware

const router = express.Router();

// This matches the path: /api/organizations/suppliers
router.get("/suppliers", protect, getSuppliers);

export default router;