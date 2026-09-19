import express from "express";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";
import { Vehicle } from "../models/Vehicle.js";
import { OwnershipHistory } from "../models/OwnershipHistory.js";
import { User } from "../models/User.js";

const router = express.Router();

router.get("/my", authRequired, requireRole("owner"), async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ currentOwner: req.user.id });
        res.json(vehicles);
    } catch (err) {
        console.error("get my vehicles error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Advanced Search API - Search vehicles by multiple criteria
router.get("/search", authRequired, requireRole("rto", "police"), async (req, res) => {
    try {
        const {
            query,
            status,
            dateFrom,
            dateTo,
            make,
            year,
            ownerName,
            page = 1,
            limit = 20
        } = req.query;

        const searchCriteria = {};

        // Text search across multiple fields
        if (query) {
            const searchRegex = new RegExp(query, "i");
            searchCriteria.$or = [
                { regNumber: searchRegex },
                { chassisNumber: searchRegex },
                { engineNumber: searchRegex },
                { make: searchRegex },
                { model: searchRegex }
            ];
        }

        // Status filter
        if (status && status !== "all") {
            searchCriteria.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            searchCriteria.createdAt = {};
            if (dateFrom) {
                searchCriteria.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                searchCriteria.createdAt.$lte = new Date(dateTo);
            }
        }

        // Make filter
        if (make) {
            searchCriteria.make = new RegExp(make, "i");
        }

        // Year filter
        if (year) {
            searchCriteria.year = parseInt(year);
        }

        // Owner name search (requires population)
        let ownerIds = [];
        if (ownerName) {
            const owners = await User.find({
                name: new RegExp(ownerName, "i")
            }).select("_id");
            ownerIds = owners.map(o => o._id);
            searchCriteria.currentOwner = { $in: ownerIds };
        }

        // Execute search with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [vehicles, totalCount] = await Promise.all([
            Vehicle.find(searchCriteria)
                .populate("currentOwner", "name email phone aadhaarNumber")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Vehicle.countDocuments(searchCriteria)
        ]);

        res.json({
            vehicles,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error("Search error:", err.message);
        res.status(500).json({ message: "Server error during search" });
    }
});

// Get all unique vehicle makes for filter dropdown
router.get("/makes", authRequired, async (req, res) => {
    try {
        const makes = await Vehicle.distinct("make");
        res.json(makes.sort());
    } catch (err) {
        console.error("Get makes error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get single vehicle by ID
router.get("/:id", authRequired, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 Fetching vehicle ${id} with populated currentOwner...`);

        const vehicle = await Vehicle.findById(id).populate("currentOwner", "name email address aadhaarNumber dlNumber phone");

        if (!vehicle) {
            console.error(`❌ Vehicle ${id} not found`);
            return res.status(404).json({ message: "Vehicle not found" });
        }

        console.log(`✅ Vehicle found: ${vehicle.regNumber}`);
        console.log(`📋 currentOwner populated:`, vehicle.currentOwner ? {
            _id: vehicle.currentOwner._id,
            name: vehicle.currentOwner.name,
            email: vehicle.currentOwner.email,
            address: vehicle.currentOwner.address,
        } : 'null');
        console.log(`🔗 blockchainTxHash:`, vehicle.blockchainTxHash || 'not set');

        // Check if user owns this vehicle or has permission
        const isOwner = String(vehicle.currentOwner?._id || vehicle.currentOwner) === String(req.user.id);
        const isAdmin = req.user.role === "rto" || req.user.role === "police";

        if (!isOwner && !isAdmin) {
            console.warn(`⚠️ User ${req.user.id} not authorized to view vehicle ${id}`);
            return res.status(403).json({ message: "Not authorized to view this vehicle" });
        }

        console.log(`✅ Sending vehicle data for ${vehicle.regNumber}`);
        res.json(vehicle);
    } catch (err) {
        console.error("❌ get vehicle by id error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/history/:regNumber", authRequired, async (req, res) => {
    try {
        const { regNumber } = req.params;
        const vehicle = await Vehicle.findOne({ regNumber });
        if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

        const history = await OwnershipHistory.find({ vehicle: vehicle._id })
            .populate("fromOwner", "name")
            .populate("toOwner", "name")
            .sort({ createdAt: 1 });

        res.json(history);
    } catch (err) {
        console.error("get history error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Re-sync vehicle to blockchain (for vehicles approved before contract fix)
router.post("/:id/sync-blockchain", authRequired, requireRole("rto"), async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id).populate("currentOwner");

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        console.log(`\n🔄 SYNCING VEHICLE TO BLOCKCHAIN: ${vehicle.regNumber}`);
        console.log(`   Owner: ${vehicle.currentOwner?.name}`);

        // Import blockchain service
        const { registerVehicleOnChain } = await import("../services/blockchainService.js");

        // Get owner address
        let ownerAddress;
        if (vehicle.currentOwner?.blockchainWalletAddress) {
            ownerAddress = vehicle.currentOwner.blockchainWalletAddress;
        } else {
            // Use admin wallet as fallback for now
            ownerAddress = "0xF7167C4089CA6e6374D9B42dE09b97DC416cF725";
        }

        console.log(`   Owner Address: ${ownerAddress}`);
        console.log(`   Registering on blockchain...`);

        // Register on blockchain
        const txHash = await registerVehicleOnChain(
            vehicle.regNumber,
            vehicle.chassisNumber,
            vehicle.engineNumber,
            vehicle.make,
            vehicle.model,
            parseInt(vehicle.year) || 2024,
            ownerAddress
        );

        console.log(`   ✅ Transaction successful: ${txHash}`);

        // Update vehicle with blockchain TX hash
        vehicle.blockchainTxHash = txHash;
        await vehicle.save();

        res.json({
            message: "Vehicle synced to blockchain successfully",
            blockchainTxHash: txHash
        });
    } catch (err) {
        console.error("Sync blockchain error:", err.message);
        res.status(500).json({
            message: "Failed to sync to blockchain",
            error: err.message
        });
    }
});

export default router;
