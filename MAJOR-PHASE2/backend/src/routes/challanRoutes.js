import express from "express";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";
import { Challan } from "../models/Challan.js";
import { Vehicle } from "../models/Vehicle.js";
import { User } from "../models/User.js";

const router = express.Router();

// ============================================
// POLICE ROUTES - Create & Manage Challans
// ============================================

// Create new challan (Police only)
router.post(
    "/create",
    authRequired,
    requireRole("police"),
    async (req, res) => {
        try {
            console.log("=== CREATE CHALLAN REQUEST ===");
            console.log("User:", req.user);
            console.log("Body:", req.body);

            const {
                vehicleId,
                regNumber,
                violationType,
                violationDescription,
                location,
                violationDate,
                fineAmount,
                penaltyPoints,
                evidencePhotos,
                remarks
            } = req.body;

            // Validate required fields
            if (!regNumber) {
                return res.status(400).json({ message: "Vehicle registration number is required" });
            }

            if (!violationType || !violationDescription || !location) {
                return res.status(400).json({ message: "Violation details are required" });
            }

            if (!fineAmount || fineAmount <= 0) {
                return res.status(400).json({ message: "Fine amount must be greater than 0" });
            }

            // Verify vehicle exists - use regNumber by default, or vehicleId if valid
            let vehicle = null;

            // First try to find by registration number (most reliable)
            if (regNumber) {
                vehicle = await Vehicle.findOne({ regNumber });
            }

            // If not found and vehicleId is valid (non-empty 24-char hex string), try by ID
            if (!vehicle && vehicleId && vehicleId.length === 24 && /^[0-9a-fA-F]{24}$/.test(vehicleId)) {
                vehicle = await Vehicle.findById(vehicleId);
            }

            if (!vehicle) {
                return res.status(404).json({ message: `Vehicle with registration '${regNumber}' not found` });
            }

            // Get officer details
            const officer = await User.findById(req.user.id);
            if (!officer) {
                return res.status(404).json({ message: "Officer not found" });
            }

            console.log("Creating challan for vehicle:", vehicle._id);
            console.log("Officer:", officer.name, officer._id);

            const challan = new Challan({
                vehicle: vehicle._id,
                regNumber: vehicle.regNumber || regNumber,
                violationType,
                violationDescription,
                location,
                violationDate: violationDate ? new Date(violationDate) : new Date(),
                fineAmount,
                penaltyPoints: penaltyPoints || 0,
                issuingOfficer: req.user.id,
                officerName: officer.name,
                officerBadgeNumber: officer.badgeNumber || `POLICE-${officer._id.toString().substring(0, 6)}`,
                evidencePhotos: evidencePhotos || [],
                remarks,
                status: "active",
                paymentStatus: "pending"
            });

            await challan.save();
            console.log("Challan created successfully:", challan._id);

            res.status(201).json({
                message: "Challan created successfully",
                challanId: challan._id,
                challan
            });
        } catch (err) {
            console.error("Create challan error:", err);
            console.error("Error stack:", err.stack);
            res.status(500).json({
                message: "Server error while creating challan",
                error: err.message
            });
        }
    }
);

// Get all challans issued by logged-in police officer
router.get(
    "/my-challans",
    authRequired,
    requireRole("police"),
    async (req, res) => {
        try {
            const challans = await Challan.find({ issuingOfficer: req.user.id })
                .populate("vehicle", "regNumber make model")
                .sort({ createdAt: -1 });

            res.json(challans);
        } catch (err) {
            console.error("Get my challans error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Update challan status (cancel/dispute)
router.put(
    "/:id/status",
    authRequired,
    requireRole("police"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status, disputeReason } = req.body;

            const challan = await Challan.findById(id);
            if (!challan) {
                return res.status(404).json({ message: "Challan not found" });
            }

            if (status === "disputed") {
                challan.disputeReason = disputeReason;
                challan.disputeDate = new Date();
            }

            challan.status = status;
            await challan.save();

            res.json({ message: "Challan status updated", challan });
        } catch (err) {
            console.error("Update challan status error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ============================================
// OWNER ROUTES - View & Pay Challans
// ============================================

// Get all pending challans for current user's vehicles
router.get(
    "/pending",
    authRequired,
    requireRole("owner"),
    async (req, res) => {
        try {
            // Get all vehicles owned by user
            const userVehicles = await Vehicle.find({
                currentOwner: req.user.id
            }).select("_id regNumber");

            const vehicleIds = userVehicles.map(v => v._id);

            // Get all pending challans for these vehicles
            const pendingChallans = await Challan.find({
                vehicle: { $in: vehicleIds },
                paymentStatus: "pending",
                status: "active"
            })
                .populate("vehicle", "regNumber make model")
                .populate("issuingOfficer", "name badgeNumber")
                .sort({ violationDate: -1 });

            // Calculate total pending amount
            const totalPending = pendingChallans.reduce((sum, c) => sum + (c.fineAmount - c.paidAmount), 0);

            res.json({
                challans: pendingChallans,
                totalPending,
                count: pendingChallans.length
            });
        } catch (err) {
            console.error("Get pending challans error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Get all challans (paid + pending) for current user's vehicles
router.get(
    "/all",
    authRequired,
    requireRole("owner"),
    async (req, res) => {
        try {
            const userVehicles = await Vehicle.find({
                currentOwner: req.user.id
            }).select("_id regNumber");

            const vehicleIds = userVehicles.map(v => v._id);

            const allChallans = await Challan.find({
                vehicle: { $in: vehicleIds }
            })
                .populate("vehicle", "regNumber make model")
                .populate("issuingOfficer", "name badgeNumber")
                .sort({ createdAt: -1 });

            res.json(allChallans);
        } catch (err) {
            console.error("Get all challans error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Mark challan as paid
router.put(
    "/:id/pay",
    authRequired,
    requireRole("owner"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { paymentMethod, paidAmount } = req.body;

            const challan = await Challan.findById(id);
            if (!challan) {
                return res.status(404).json({ message: "Challan not found" });
            }

            // Verify this challan belongs to user's vehicle
            const vehicle = await Vehicle.findById(challan.vehicle);
            if (!vehicle || String(vehicle.currentOwner) !== String(req.user.id)) {
                return res.status(403).json({ message: "Not authorized to pay this challan" });
            }

            challan.paymentStatus = "paid";
            challan.paidAmount = paidAmount || challan.fineAmount;
            challan.paymentDate = new Date();
            challan.paymentMethod = paymentMethod || "online";

            await challan.save();

            res.json({
                message: "Challan paid successfully",
                challan
            });
        } catch (err) {
            console.error("Pay challan error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ============================================
// RTO ROUTES - Check Challans Before Transfer
// ============================================

// Check pending challans for a vehicle (RTO use)
router.get(
    "/check/:vehicleId",
    authRequired,
    requireRole("rto"),
    async (req, res) => {
        try {
            const { vehicleId } = req.params;

            const pendingChallans = await Challan.find({
                vehicle: vehicleId,
                paymentStatus: { $in: ["pending", "partial"] },
                status: "active"
            })
                .populate("issuingOfficer", "name badgeNumber")
                .sort({ violationDate: -1 });

            const totalPending = pendingChallans.reduce((sum, c) => sum + (c.fineAmount - c.paidAmount), 0);

            res.json({
                hasPendingChallans: pendingChallans.length > 0,
                count: pendingChallans.length,
                totalPending,
                challans: pendingChallans
            });
        } catch (err) {
            console.error("Check challans error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Get challan history for a vehicle
router.get(
    "/history/:vehicleId",
    authRequired,
    async (req, res) => {
        try {
            const { vehicleId } = req.params;

            const allChallans = await Challan.find({
                vehicle: vehicleId
            })
                .populate("issuingOfficer", "name badgeNumber")
                .sort({ violationDate: -1 });

            const paidCount = allChallans.filter(c => c.paymentStatus === "paid").length;
            const pendingCount = allChallans.filter(c => c.paymentStatus === "pending").length;
            const totalPaid = allChallans
                .filter(c => c.paymentStatus === "paid")
                .reduce((sum, c) => sum + c.paidAmount, 0);
            const totalPending = allChallans
                .filter(c => c.paymentStatus === "pending")
                .reduce((sum, c) => sum + (c.fineAmount - c.paidAmount), 0);

            res.json({
                total: allChallans.length,
                paidCount,
                pendingCount,
                totalPaid,
                totalPending,
                challans: allChallans
            });
        } catch (err) {
            console.error("Get challan history error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

export default router;
