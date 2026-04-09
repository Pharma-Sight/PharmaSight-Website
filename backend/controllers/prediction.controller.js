// controllers/predictionController.js
import Prediction from "../models/Prediction.js";

export const savePrediction = async (drug, prediction) => {
  return await Prediction.create({
    drugId: drug._id,
    organizationId: drug.organizationId,
    ...prediction
  });
};