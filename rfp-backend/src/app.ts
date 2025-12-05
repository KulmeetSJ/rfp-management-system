// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vendorRoutes from "./routes/vendorRoutes";
import rfpRoutes from "./routes/rfpRoutes";

dotenv.config();

const app = express();

// Read port from env or default
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/vendors", vendorRoutes);
app.use("/rfps", rfpRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});