import express from "express";
import { authRequired, requireRole, biometricRequired } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";
import { Vehicle } from "../models/Vehicle.js";
import { OwnershipHistory } from "../models/OwnershipHistory.js";
import { verifyFingerprint } from "../services/biometricService.js";

const router = express.Router();

router.post("/lookup", authRequired, requireRole("police"), async (req, res) => {
    try {
        const { userId } = req.body;

        const verification = await verifyFingerprint(userId);
        if (!verification.success) {
            return res.status(401).json({ message: "Biometric verification failed" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "Person not found" });

        const vehicles = await Vehicle.find({ currentOwner: user._id });
        const history = await OwnershipHistory.find({ toOwner: user._id })
            .populate("vehicle")
            .populate("fromOwner", "name")
            .populate("toOwner", "name");

        res.json({
            person: {
                name: user.name,
                aadhaarNumber: user.aadhaarNumber,
                dlNumber: user.dlNumber
            },
            vehicles,
            history
        });
    } catch (err) {
        console.error("lookup error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
