import axios from "axios";
import Drug from "../models/drug.model.js";
// Standardized to your deployed Render URL [cite: 3]
const AI_URL = process.env.AI_SERVICE_URL || "https://pharma-site-ai.onrender.com";

/**
 * Endpoint: POST /predict
 * Dynamically handles input from Postman or Frontend 
 */
export const predictions = async (req, res) => {
  try {
    // If drugId is provided in the URL, we can fetch defaults from DB, 
    // but the req.body will override them for full flexibility.
    const { drugId } = req.params;
    let dbStock = {};
    
    if (drugId) {
      dbStock = await Drug.findById(drugId) || {};
    }

    // Constructing the payload using data from req.body (Postman/Frontend)
    // with fallbacks to database values or guide-standard defaults.
    const payload = {
      drug: req.body.drug || dbStock.name || "Unknown Drug",
      counted_stock: Number(req.body.counted_stock ?? dbStock.stock ?? 0),
      usable_stock: Number(req.body.usable_stock ?? dbStock.usableStock ?? 0),
      verified_stock: Number(req.body.verified_stock ?? dbStock.verifiedStock ?? 0),
      
      // AI needs at least 1 entry; 7-14 is best for predictions [cite: 40]
      daily_usage: (req.body.daily_usage || dbStock.dailyUsage || [0]).map(Number),
      
      // Must be exactly "rural" or "urban" [cite: 41]
      hospital_type: req.body.hospital_type || dbStock.hospitalType || "rural",
      
      cold_chain_intact: req.body.cold_chain_intact !== undefined 
        ? !!req.body.cold_chain_intact 
        : !!dbStock.coldChainIntact,
      
      // Mapping batches to ensure correct JSON structure 
      // If the backend still gives 'not subscriptable', the teammate MUST 
      // fix the Python loop to use dot notation (batch.batch_no).
      batches: (req.body.batches || dbStock.batches || []).map(b => ({
        batch_no: String(b.batch_no || "B-NEW"),
        expiry_date: b.expiry_date ? new Date(b.expiry_date).toISOString().split('T')[0] : "2026-12-31",
        qty: Number(b.qty || 0)
      })),

      hospital_id: req.body.hospital_id || dbStock.hospitalId || "KRC-001",
      region: req.body.region || dbStock.region || "Koraput",
      last_log_timestamp: new Date().toISOString().split("Z")[0]
    };

    // Forward the dynamic payload to the AI service [cite: 18, 19]
    const response = await axios.post(`${AI_URL}/predict`, payload);
    
    // Returns 200 OK with full AI analysis [cite: 42, 43]
    return res.status(200).json(response.data);

  } catch (err) {
    // Detailed error logging for debugging 500/422 errors [cite: 314, 315]
    const errorDetail = err.response?.data?.detail || err.message;
    console.error("AI Integration Error:", errorDetail);
    
    return res.status(err.response?.status || 500).json({ 
      error: "AI Service Failure", 
      detail: errorDetail 
    });
  }
};