import express from "express";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";
import { Vehicle } from "../models/Vehicle.js";
import { Request } from "../models/Request.js";
import { User } from "../models/User.js";

const router = express.Router();

// Generate RC (Registration Certificate)
router.get("/rc/:vehicleId", authRequired, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const vehicle = await Vehicle.findById(vehicleId)
            .populate("currentOwner");

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        // Check if user has permission to view this RC
        if (req.user.id !== vehicle.currentOwner._id && req.user.role !== "rto" && req.user.role !== "police") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Generate RC document data
        const rcData = {
            regNumber: vehicle.regNumber,
            chassisNumber: vehicle.chassisNumber,
            engineNumber: vehicle.engineNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            ownerName: vehicle.currentOwner.name,
            ownerEmail: vehicle.currentOwner.email,
            ownerAadhaar: vehicle.currentOwner.aadhaarNumber,
            ownerDL: vehicle.currentOwner.dlNumber,
            issueDate: new Date().toISOString(),
            validity: "Permanent",
            issuingAuthority: "Regional Transport Office",
            qrCode: `RC_${vehicle.regNumber}_${Date.now()}`
        };

        res.json(rcData);
    } catch (err) {
        console.error("RC generation error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Generate Transfer Certificate
router.get("/transfer-certificate/:requestId", authRequired, async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await Request.findById(requestId)
            .populate("vehicle")
            .populate("seller", "name email aadhaarNumber dlNumber")
            .populate("buyer", "name email aadhaarNumber dlNumber");

        if (!request || request.type !== "transfer") {
            return res.status(404).json({ message: "Transfer request not found" });
        }

        // Check if user has permission to view this certificate
        if (req.user.id !== request.seller._id && req.user.id !== request.buyer._id &&
            req.user.role !== "rto" && req.user.role !== "police") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const transferData = {
            transferId: request._id,
            vehicle: {
                regNumber: request.vehicle.regNumber,
                chassisNumber: request.vehicle.chassisNumber,
                engineNumber: request.vehicle.engineNumber,
                make: request.vehicle.make,
                model: request.vehicle.model,
                year: request.vehicle.year
            },
            seller: {
                name: request.seller.name,
                email: request.seller.email,
                aadhaar: request.seller.aadhaarNumber,
                dlNumber: request.seller.dlNumber
            },
            buyer: {
                name: request.buyer.name,
                email: request.buyer.email,
                aadhaar: request.buyer.aadhaarNumber,
                dlNumber: request.buyer.dlNumber
            },
            transferDate: request.updatedAt,
            status: request.status,
            issuedBy: "Regional Transport Office",
            qrCode: `TRANSFER_${request._id}_${Date.now()}`
        };

        res.json(transferData);
    } catch (err) {
        console.error("Transfer certificate generation error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Generate Invoice for New Registration
router.get("/invoice/:requestId", authRequired, async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await Request.findById(requestId)
            .populate("vehicle")
            .populate("dealer", "name email dealerDetails")
            .populate("buyer", "name email aadhaarNumber dlNumber");

        if (!request || request.type !== "newRegistration") {
            return res.status(404).json({ message: "Registration request not found" });
        }

        // Check if user has permission to view this invoice
        if (req.user.id !== request.buyer._id && req.user.id !== request.dealer._id &&
            req.user.role !== "rto" && req.user.role !== "police") {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Calculate fees (these would be configurable in a real system)
        const fees = {
            registrationFee: 500,
            roadTax: 300,
            insurance: 1500,
            processingFee: 100,
            totalAmount: 2400
        };

        const invoiceData = {
            invoiceId: `INV_${request._id.substring(0, 8).toUpperCase()}`,
            requestId: request._id,
            date: new Date().toISOString(),
            dealer: {
                name: request.dealer.name,
                email: request.dealer.email,
                businessName: request.dealer.dealerDetails?.businessName || request.dealer.name,
                gstin: request.dealer.dealerDetails?.gstin || '',
                tin: request.dealer.dealerDetails?.tin || '',
                showroomAddress: request.dealer.dealerDetails?.showroomAddress || '',
                phone: request.dealer.dealerDetails?.phone || '',
                licenseNumber: request.dealer.dealerDetails?.licenseNumber || ''
            },
            buyer: {
                name: request.buyer.name,
                email: request.buyer.email,
                aadhaar: request.buyer.aadhaarNumber,
                dlNumber: request.buyer.dlNumber
            },
            vehicle: {
                chassisNumber: request.vehicle.chassisNumber,
                engineNumber: request.vehicle.engineNumber,
                make: request.vehicle.make,
                model: request.vehicle.model,
                year: request.vehicle.year
            },
            fees: fees,
            status: request.status,
            issuedBy: "Regional Transport Office",
            qrCode: `INVOICE_${request._id}_${Date.now()}`
        };

        res.json(invoiceData);
    } catch (err) {
        console.error("Invoice generation error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all documents for a user
router.get("/user-documents", authRequired, async (req, res) => {
    try {
        // Get all vehicles owned by the user
        const vehicles = await Vehicle.find({ currentOwner: req.user.id })
            .populate("currentOwner", "name email");

        // Get all requests initiated by the user
        const requests = await Request.find({
            $or: [
                { buyer: req.user.id },
                { seller: req.user.id },
                { dealer: req.user.id }
            ]
        })
            .populate("vehicle", "regNumber make model year")
            .populate("buyer", "name")
            .populate("seller", "name")
            .populate("dealer", "name");

        const documents = {
            registrationCertificates: vehicles.map(v => ({
                id: v._id,
                regNumber: v.regNumber,
                vehicle: `${v.make} ${v.model} (${v.year})`,
                type: "RC"
            })),
            transferCertificates: requests
                .filter(r => r.type === "transfer")
                .map(r => ({
                    id: r._id,
                    vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "Unknown",
                    type: "Transfer Certificate",
                    status: r.status,
                    date: r.updatedAt
                })),
            invoices: requests
                .filter(r => r.type === "newRegistration")
                .map(r => ({
                    id: r._id,
                    vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : "Unknown",
                    type: "Invoice",
                    status: r.status,
                    date: r.createdAt
                }))
        };

        res.json(documents);
    } catch (err) {
        console.error("User documents error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;