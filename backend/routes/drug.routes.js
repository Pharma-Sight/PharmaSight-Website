import express from "express";
import { addDrug, getDrugs} from "../controllers/drug.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",protect, addDrug);
router.get("/", protect, getDrugs);

export default router;