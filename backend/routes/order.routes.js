// routes/order.routes.js (Example)
import express from "express";
import { createOrder, getMyOrders, getSupplierOrders, dispatchOrder } from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Your existing auth middleware

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/supplier", protect, getSupplierOrders);
router.patch("/:orderId/dispatch", protect, dispatchOrder);

export default router;