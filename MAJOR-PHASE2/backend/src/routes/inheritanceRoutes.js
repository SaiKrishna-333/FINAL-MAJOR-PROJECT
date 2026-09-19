import express from "express";
import multer from "multer";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";
import { InheritanceTransfer } from "../models/InheritanceTransfer.js";
import { Vehicle } from "../models/Vehicle.js";
import { User } from "../models/User.js";
import { OwnershipHistory } from "../models/OwnershipHistory.js";
import {
    registerVehicleOnChain,
    transferVehicleOnChain,
    getCurrentOwnerFromChain
} from "../services/blockchainService.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Submit inheritance transfer request
router.post("/request", authRequired, upload.fields([
    { name: 'deathCertificate', maxCount: 1 },
    { name: 'successionCertificate', maxCount: 1 },
    { name: 'courtOrder', maxCount: 1 },
    { name: 'relationshipProof', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log("Inheritance request received");
        console.log("req.body:", req.body);
        console.log("req.files:", req.files);

        const vehicleRegNumber = req.body.vehicleRegNumber || req.body.vehicleId;
        const deceasedOwnerName = req.body.deceasedOwnerId; // This is actually the name now
        const deathCertificateNumber = req.body.deathCertificateNumber;
        const relationshipToDeceased = req.body.relationshipToDeceased;
        const successionCertificateNumber = req.body.successionCertificateNumber;
        const courtOrderNumber = req.body.courtOrderNumber;

        if (!vehicleRegNumber) {
            return res.status(400).json({ message: "Vehicle registration number is required" });
        }
        if (!deceasedOwnerName) {
            return res.status(400).json({ message: "Deceased owner name is required" });
        }
        if (!deathCertificateNumber) {
            return res.status(400).json({ message: "Death certificate number is required" });
        }
        if (!relationshipToDeceased) {
            return res.status(400).json({ message: "Relationship is required" });
        }

        // Verify the vehicle exists using registration number
        const vehicle = await Vehicle.findOne({ regNumber: vehicleRegNumber });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found with this registration number" });
        }

        // Get the current owner details from the vehicle record
        const currentOwnerId = vehicle.currentOwner;
        if (!currentOwnerId) {
            return res.status(400).json({ message: "Vehicle has no registered owner" });
        }

        // Verify current owner exists (this is the deceased owner)
        const deceasedOwner = await User.findById(currentOwnerId);
        if (!deceasedOwner) {
            return res.status(404).json({ message: "Vehicle owner not found in system" });
        }

        console.log(`Vehicle found: ${vehicleRegNumber}, Owner: ${deceasedOwner.name}`);
        console.log(`Submitted deceased name: ${deceasedOwnerName}`);

        // Note: We're not strictly validating the name match here since user might enter slightly different format
        // The RTO officer will verify during approval

        // Check if there's already an active inheritance request for this vehicle
        const existingRequest = await InheritanceTransfer.findOne({
            vehicle: vehicle._id,
            status: { $in: ["submitted", "documents_verified", "rto_review"] }
        });
        if (existingRequest) {
            return res.status(400).json({ message: "Inheritance transfer already in process for this vehicle" });
        }

        // Handle document uploads
        const documents = [];
        if (req.files) {
            const fileMapping = {
                'deathCertificate': 'death_certificate',
                'successionCertificate': 'succession_certificate',
                'courtOrder': 'court_order',
                'relationshipProof': 'identity_proof' // Using identity_proof for relationship proof
            };

            Object.keys(fileMapping).forEach(fieldName => {
                if (req.files[fieldName] && req.files[fieldName][0]) {
                    documents.push({
                        documentType: fileMapping[fieldName],
                        fileUrl: `/uploads/inheritance-${Date.now()}-${fieldName}.pdf`,
                        verified: false,
                        ipfsHash: null // Will be populated after IPFS upload
                    });
                }
            });
        }

        console.log("Documents to save:", documents);

        const inheritanceRequest = new InheritanceTransfer({
            vehicle: vehicle._id,
            deceasedOwner: currentOwnerId, // Use the actual owner ID from vehicle record
            legalHeir: req.user.id,
            deathCertificateNumber,
            relationshipToDeceased,
            successionCertificateNumber,
            courtOrderNumber,
            documents: documents
        });

        await inheritanceRequest.save();

        console.log("Inheritance request saved successfully:", inheritanceRequest._id);
        res.status(201).json({
            message: "Inheritance transfer request submitted successfully",
            requestId: inheritanceRequest._id
        });
    } catch (err) {
        console.error("inheritance request error:", err.message);
        console.error("Full error:", err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Get inheritance requests (legal heir/RTO/police)
router.get("/requests", authRequired, async (req, res) => {
    try {
        let query = {};

        // Legal heirs can only see their own requests
        if (req.user.role === "owner") {
            query.legalHeir = req.user.id;
        }
        // RTO can see all requests
        else if (req.user.role === "rto") {
            // No additional filtering needed
        }
        // Police can see all requests
        else if (req.user.role === "police") {
            // No additional filtering needed
        } else {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const requests = await InheritanceTransfer.find(query)
            .populate("vehicle", "regNumber make model year chassisNumber")
            .populate("deceasedOwner", "name email aadhaarNumber dlNumber")
            .populate("legalHeir", "name email aadhaarNumber dlNumber")
            .populate("rtoOfficer", "name")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error("get inheritance requests error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Verify documents (RTO)
router.put("/requests/:id/verify-documents", authRequired, requireRole("rto"), async (req, res) => {
    try {
        const { id } = req.params;
        const { documentVerifications, remarks } = req.body;

        const request = await InheritanceTransfer.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Inheritance request not found" });
        }

        if (request.status !== "submitted") {
            return res.status(400).json({ message: "Request is not in submitted status" });
        }

        // Update document verification status
        if (documentVerifications) {
            request.documents = request.documents.map(doc => {
                const verification = documentVerifications.find(v => v.documentType === doc.documentType);
                if (verification) {
                    doc.verified = verification.verified;
                }
                return doc;
            });
        }

        request.status = "documents_verified";
        request.rtoOfficer = req.user.id;
        if (remarks) request.remarks = remarks;

        await request.save();

        res.json({ message: "Documents verified successfully", request });
    } catch (err) {
        console.error("document verification error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Approve inheritance transfer (RTO)
router.put("/requests/:id/approve", authRequired, requireRole("rto"), async (req, res) => {
    try {
        const { id } = req.params;
        const { regNumber } = req.body;

        const request = await InheritanceTransfer.findById(id)
            .populate("vehicle")
            .populate("deceasedOwner")
            .populate("legalHeir");

        if (!request) {
            return res.status(404).json({ message: "Inheritance request not found" });
        }

        if (request.status !== "documents_verified") {
            return res.status(400).json({ message: "Documents must be verified first" });
        }

        // Update vehicle ownership
        const vehicle = await Vehicle.findById(request.vehicle._id);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        // Generate blockchain transaction
        let txHash;
        if (vehicle.regNumber) {
            // Get user's blockchain wallet addresses
            const deceasedUser = await User.findById(request.deceasedOwner._id);
            const heirUser = await User.findById(request.legalHeir._id);
            const deceasedAddress = deceasedUser.blockchainWalletAddress || `0x${deceasedUser._id}`;
            const heirAddress = heirUser.blockchainWalletAddress || `0x${heirUser._id}`;

            try {
                // First, try to transfer (vehicle should already be registered)
                txHash = await transferVehicleOnChain(vehicle.regNumber, deceasedAddress, heirAddress, "inheritance", "0x0000000000000000000000000000000000000000000000000000000000000000");
            } catch (transferError) {
                // If transfer fails because vehicle is not registered, register it first
                if (transferError.message.includes("Vehicle not registered")) {
                    console.log(`Vehicle ${vehicle.regNumber} not found on blockchain, registering first...`);

                    // Register the vehicle directly in the legal heir's name for inheritance
                    txHash = await registerVehicleOnChain(
                        vehicle.regNumber,
                        vehicle.chassisNumber || "N/A",
                        vehicle.engineNumber || "N/A",
                        vehicle.make || "Unknown",
                        vehicle.model || "Unknown",
                        parseInt(vehicle.year) || new Date().getFullYear(),
                        heirAddress  // Register directly to heir for inheritance
                    );

                    console.log(`Vehicle registered on blockchain with tx: ${txHash}`);
                } else if (transferError.message.includes("Only owner can transfer")) {
                    // Vehicle exists on chain but is owned by deceased
                    // For inheritance, we need RTO to have special access
                    // For now, update database and log that manual blockchain transfer needed
                    console.log(`Vehicle ${vehicle.regNumber} is owned by deceased. Inheritance transfer requires owner signature.`);
                    console.log(`Manual process required: Deceased owner's wallet must sign transfer OR use RTO admin function`);

                    // Update database ownership even though blockchain failed
                    vehicle.currentOwner = request.legalHeir._id;
                    await vehicle.save();

                    // Create ownership history record
                    await OwnershipHistory.create({
                        vehicle: vehicle._id,
                        fromOwner: request.deceasedOwner._id,
                        toOwner: request.legalHeir._id,
                        blockchainTxHash: null, // No blockchain transaction yet
                        transferType: "inheritance",
                        biometricVerification: null
                    });

                    // Update request status
                    request.status = "approved";
                    request.rtoOfficer = req.user.id;
                    await request.save();

                    return res.json({
                        message: "Inheritance transfer approved (database updated). Blockchain transfer requires deceased owner's wallet signature.",
                        warning: "Vehicle registered to deceased owner on blockchain. Manual transfer required."
                    });
                } else {
                    throw transferError; // Re-throw if it's a different error
                }
            }
        } else {
            if (!regNumber) {
                return res.status(400).json({ message: "Registration number required for new registration" });
            }
            vehicle.regNumber = regNumber;

            // Get user's blockchain wallet address
            const heirUser = await User.findById(request.legalHeir._id);
            const ownerAddress = heirUser.blockchainWalletAddress || `0x${heirUser._id}`;

            txHash = await registerVehicleOnChain(
                vehicle.regNumber,
                vehicle.chassisNumber,
                vehicle.engineNumber,
                vehicle.make,
                vehicle.model,
                vehicle.year,
                ownerAddress
            );
        }

        vehicle.currentOwner = request.legalHeir._id;
        await vehicle.save();

        // Create ownership history record
        await OwnershipHistory.create({
            vehicle: vehicle._id,
            fromOwner: request.deceasedOwner._id,
            toOwner: request.legalHeir._id,
            blockchainTxHash: txHash,
            transferType: "inheritance",
            biometricVerification: req.biometricVerification || null
        });

        // Update request status
        request.status = "approved";
        request.rtoOfficer = req.user.id;
        await request.save();

        res.json({
            message: "Inheritance transfer approved successfully",
            txHash,
            newOwnerId: request.legalHeir._id
        });
    } catch (err) {
        console.error("inheritance approval error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Reject inheritance transfer (RTO)
router.put("/requests/:id/reject", authRequired, requireRole("rto"), async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        const request = await InheritanceTransfer.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Inheritance request not found" });
        }

        request.status = "rejected";
        request.rtoOfficer = req.user.id;
        if (remarks) request.remarks = remarks;

        await request.save();

        res.json({ message: "Inheritance transfer rejected", request });
    } catch (err) {
        console.error("inheritance rejection error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;