import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import policeRoutes from "./routes/policeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import documentManagementRoutes from "./routes/documentManagementRoutes.js";
import theftRoutes from "./routes/theftRoutes.js";
import inheritanceRoutes from "./routes/inheritanceRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import didRoutes from "./routes/didRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import challanRoutes from "./routes/challanRoutes.js";
import patentFeaturesRoutes from "./routes/patentFeaturesRoutes.js";
import interStateTransferRoutes from "./routes/interStateTransferRoutes.js";

const app = express();

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    next();
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/documents-mgmt", documentManagementRoutes);
app.use("/api/theft", theftRoutes);
app.use("/api/inheritance", inheritanceRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/did", didRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/patent-features", patentFeaturesRoutes);
app.use("/api/inter-state", interStateTransferRoutes);

app.get("/", (req, res) => {
    res.json({ message: "BioChain RTO API is running" });
});

export default app;