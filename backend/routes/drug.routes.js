import express from "express";
import { addDrug } from "../controllers/drug.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, addDrug);

export default router;