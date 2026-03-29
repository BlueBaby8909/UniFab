import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import healthCheckRoutes from "./src/routes/healthcheck.routes.js";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/v1/healthcheck", healthCheckRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
