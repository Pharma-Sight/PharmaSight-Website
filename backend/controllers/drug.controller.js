import Drug from "../models/drug.model.js";
import { predictions } from "../services/ai.service.js";
import { savePrediction } from "./prediction.controller.js";

export const addDrug = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized user"
      });
}
    // Map frontend payload to DB schema
    const drugData = {
      name: req.body.drug || req.body.name,
      stock: req.body.counted_stock || req.body.stock,
      dailyUsage:
        req.body.daily_usage?.[0] ||
        req.body.dailyUsage ||
        0,
      usageHistory:
        req.body.daily_usage ||
        req.body.usageHistory ||
        [],
      hospitalType:
        req.body.hospital_type ||
        req.body.hospitalType ||
        "rural",
      coldChainIntact:
        req.body.cold_chain_intact ??
        req.body.coldChainIntact ??
        true,
      batches: req.body.batches || [],
      region: req.body.region || "Koraput",

      organizationId:
        req.user?.organizationId || req.user?.id
    };

    // Save drug
    const drug = await Drug.create(drugData);

    // Call AI service
    const fakeRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        return data;
      }
    };

    const aiResult = await predictions(req, fakeRes);

    // If AI failed, stop here
    if (aiResult.error) {
      return res.status(500).json({
        message: "Drug saved but AI prediction failed",
        drug,
        aiError: aiResult.detail
      });
    }

    // Save prediction
    const prediction = await savePrediction(drug, aiResult);

    return res.status(201).json({
      message: "Drug added successfully",
      drug,
      prediction
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error adding drug",
      error: error.message
    });
  }
};

export const getDrugs = async (req, res) => {
  try {
    const drugs = await Drug.find({
      organizationId:
        req.user.organizationId || req.user.id
    }).sort({ createdAt: -1 });

    return res.status(200).json(drugs);

  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch drugs",
      error: error.message
    });
  }
};