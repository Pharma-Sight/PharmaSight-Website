// controllers/drugController.js
import Drug from "../models/drug.model.js";
import { getPrediction } from "../services/ai.service.js";

export const addDrug = async (req, res) => {
  const drug = await Drug.create({
    ...req.body,
    organizationId: req.user.id
  });

  // Call AI immediately
  const prediction = await getPrediction(drug);

  res.json({ drug, prediction });
};