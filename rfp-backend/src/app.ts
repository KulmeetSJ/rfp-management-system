// src/app.ts
import express, {Request, Response} from "express";
import cors from "cors";
import vendorRoutes from "./routes/vendorRoutes";
import rfpRoutes from "./routes/rfpRoutes";
import {ENV} from "./utils/config";

const app = express();
const PORT = ENV.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.use("/vendors", vendorRoutes);
app.use("/rfps", rfpRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on PORT : ${PORT}`);
});