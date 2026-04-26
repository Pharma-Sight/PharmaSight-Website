// controllers/order.controller.js
import Order from "../models/order.model.js";
import Drug from "../models/drug.model.js";

// backend/controllers/order.controller.js
export const createOrder = async (req, res) => {
  try {
    const newOrder = new Order({
      ...req.body,
      // Automatically use the organizationId of the logged-in user
      hospitalId: req.user.organizationId 
    });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const createBulkOrders = async (req, res) => {
  try {
    const { orders } = req.body; // Expecting an array of order objects

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    // Map through the orders to attach the hospitalId (the logged-in user)
    const ordersWithHospital = orders.map(order => ({
      ...order,
      hospitalId: req.user.id, // [cite: 16]
      status: "PENDING" // [cite: 16]
    }));

    const newOrders = await Order.insertMany(ordersWithHospital);

    res.status(201).json({ 
      message: `${newOrders.length} orders placed successfully`, 
      orders: newOrders 
    });
  } catch (error) {
    res.status(500).json({ message: "Bulk order placement failed", error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ hospitalId: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getSupplierOrders = async (req, res) => {
  try {
    // Filter orders where supplierId matches the logged-in user's ID
    console.log(req.body);
    const orders = await Order.find({ supplierId: req.user.organizationId })
      .populate("hospitalId", "name location") // Get hospital details for the dashboard
      .sort({ createdAt: -1 });
      console.log("DEBUG ORDERS:", JSON.stringify(orders, null, 2));
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch supplier orders", error: error.message });
  }
};


export const dispatchOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingId, estimatedDelivery } = req.body;

    // 1. Find the order and ensure the logged-in user is the assigned supplier
    const order = await Order.findOne({ 
      _id: orderId, 
      supplierId: req.user.id // Security: Only the assigned supplier can dispatch
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found or unauthorized" });
    }

    // 2. Prevent dispatching if already dispatched or delivered
    if (order.status === "DISPATCHED" || order.status === "DELIVERED") {
      return res.status(400).json({ message: "Order is already processed" });
    }

    // 3. Update status and logistics info
    order.status = "DISPATCHED";
    order.trackingId = trackingId || `TRK-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    
    await order.save();

    res.status(200).json({
      message: "Order dispatched successfully",
      order
    });
  } catch (error) {
    res.status(500).json({ message: "Dispatch failed", error: error.message });
  }
};