// services/aiService.js
import axios from "axios";

export const getPrediction = async (drug) => {
  try {
    const res = await axios.post("http://localhost:8000/predict", {
      stock: drug.stock,
      dailyUsage: drug.dailyUsage
    });

    return res.data;
  } catch (err) {
    console.log("AI service failed, fallback used");

    const daysLeft = drug.stock / drug.dailyUsage;

    return {
      daysLeft,
      riskLevel: daysLeft < 5 ? "HIGH" : "LOW",
      confidence: 0.5
    };
  }
};