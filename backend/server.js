import express from 'express';
import cors from 'cors';
import authRoutes from "./routes/auth.routes.js";
import drugRoutes from "./routes/drug.routes.js";
import predictionRoutes from "./routes/prediction.routes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { predictions } from "./services/ai.service.js";
import orderRoutes from "./routes/order.routes.js";
import organizationRoutes from "./routes/organization.routes.js"; 

dotenv.config();
const app = express();
const PORT = 5000;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/organizations", organizationRoutes);
app.post("/test-ai", async (req, res) => {
  return predictions(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});