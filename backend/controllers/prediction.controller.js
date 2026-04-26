// prediction.controller.js
import Prediction from "../models/prediction.model.js";

export const savePrediction = async (drug, aiData) => {
  return await Prediction.create({
    drugId: drug._id,
    organizationId: drug.organizationId,
    days_left: aiData.days_left,
    risk_level: aiData.risk_level,
    wastage_value_inr: aiData.wastage_value_inr,
    procurement_suggestion: aiData.procurement_suggestion,
    confidence_score: aiData.data_quality?.confidence_score
  });
};

// export const getPredictions = async (req, res) => {
//   try {
//     // Finds all predictions for the logged-in user's organization
//     const predictions = await Prediction.find({ organizationId: req.user.id })
//       .populate('drugId') // Optional: brings in full drug details if needed
//       .sort({ createdAt: -1 });

//     res.status(200).json(predictions);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching predictions", error: error.message });
//   }
// };

export const getPredictions = async (req, res) => {
  try {
    // Use organizationId from JWT if present,
    // otherwise fallback to user id
    const orgId = req.user.organizationId || req.user.id;

    const predictions = await Prediction.find({
      organizationId: orgId
    })
      .populate("drugId")
      .sort({ createdAt: -1 });

    res.status(200).json(predictions);

  } catch (error) {
    console.error("Prediction fetch error:", error);

    res.status(500).json({
      message: "Error fetching predictions",
      error: error.message
    });
  }
};