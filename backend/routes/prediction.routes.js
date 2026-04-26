// routes/prediction.routes.js
import express from "express";
import { getPredictions, savePrediction } from "../controllers/prediction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Route: GET /api/predictions
// Description: Fetch all AI predictions for the organization
router.get("/", protect, getPredictions);
router.post("/", protect, savePrediction);
export default router;