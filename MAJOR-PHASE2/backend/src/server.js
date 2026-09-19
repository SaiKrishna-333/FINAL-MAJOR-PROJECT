import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import { initializeSocket } from "./services/socketService.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket server ready for real-time notifications`);
    });
};

startServer();
