import express from "express";
import { authRequired, requireRole, biometricRequired } from "../middleware/authMiddleware.js";
import { Request } from "../models/Request.js";
import { Vehicle } from "../models/Vehicle.js";
import { User } from "../models/User.js";
import { OwnershipHistory } from "../models/OwnershipHistory.js";
import {
    registerVehicleOnChain,
    transferVehicleOnChain,
    getCurrentOwnerFromChain
} from "../services/blockchainService.js";
import { storeTransferRecord } from "../services/ipfsService.js";

const router = express.Router();

router.post(
    "/new-registration",
    authRequired,
    requireRole("dealer"),
    async (req, res) => {
        try {
            const { buyerEmail, vehicleDetails, exShowroomPrice, roadTax, registrationFee, insuranceAmount, handlingCharges, otherCharges, paymentMode } = req.body;

            const buyer = await User.findOne({ email: buyerEmail, role: "owner" });
            if (!buyer) {
                return res.status(400).json({ message: "Buyer not found or invalid role" });
            }

            // Get dealer details
            const dealer = await User.findById(req.user.id);
            if (!dealer) {
                return res.status(400).json({ message: "Dealer not found" });
            }

            // Parse all prices to ensure they're numbers (handle string inputs)
            const parsedExShowroom = parseFloat(exShowroomPrice) || 0;
            const parsedRoadTax = parseFloat(roadTax) || 0;
            const parsedRegistrationFee = parseFloat(registrationFee) || 500;
            const parsedInsurance = parseFloat(insuranceAmount) || 0;
            const parsedHandling = parseFloat(handlingCharges) || 0;
            const parsedOther = parseFloat(otherCharges) || 0;

            const vehicle = new Vehicle({
                ...vehicleDetails,
                currentOwner: null
            });
            await vehicle.save();

            // Generate Invoice Number
            const invoiceNumber = `INV-${Date.now()}-${vehicle._id.toString().substring(0, 6).toUpperCase()}`;

            // Calculate GST (28% on ex-showroom + handling charges)
            const gstBase = parsedExShowroom + parsedHandling;
            const gstAmount = Math.round(gstBase * 0.28);

            // Calculate grand total correctly
            const grandTotal = parsedExShowroom +
                parsedRoadTax +
                parsedRegistrationFee +
                parsedInsurance +
                parsedHandling +
                gstAmount +
                parsedOther;

            console.log('Invoice Calculation:', {
                exShowroom: parsedExShowroom,
                roadTax: parsedRoadTax,
                registration: parsedRegistrationFee,
                insurance: parsedInsurance,
                handling: parsedHandling,
                other: parsedOther,
                gstBase,
                gstAmount,
                grandTotal
            });

            // Generate digital signature hash
            const crypto = await import('crypto');
            const signatureData = `${invoiceNumber}:${dealer._id}:${buyer._id}:${Date.now()}`;
            const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex');

            const request = new Request({
                type: "newRegistration",
                vehicle: vehicle._id,
                dealer: req.user.id,
                buyer: buyer._id,
                status: "pending",
                invoice: {
                    invoiceNumber,
                    invoiceDate: new Date(),
                    exShowroomPrice: parsedExShowroom,
                    roadTax: parsedRoadTax,
                    registrationFee: parsedRegistrationFee,
                    insuranceAmount: parsedInsurance,
                    handlingCharges: parsedHandling,
                    otherCharges: parsedOther,
                    gstAmount,
                    grandTotal,
                    paymentMode: paymentMode || "Full Payment",
                    paymentStatus: "Paid",
                    verificationStatus: "pending",
                    signatureHash
                },
                documentsVerified: false
            });

            await request.save();

            // Populate the request for response
            const populatedRequest = await Request.findById(request._id)
                .populate('vehicle')
                .populate('dealer', 'name email dealerDetails')
                .populate('buyer', 'name email aadhaarNumber dlNumber address');

            res.status(201).json({
                message: "New registration request created with invoice",
                requestId: request._id,
                invoiceNumber,
                request: populatedRequest
            });
        } catch (err) {
            console.error("new-registration error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

router.post(
    "/transfer",
    authRequired,
    requireRole("owner"),
    async (req, res) => {
        try {
            const { vehicleId, buyerEmail } = req.body;

            console.log("Transfer request - vehicleId:", vehicleId);
            console.log("Transfer request - user.id:", req.user.id);
            console.log("Transfer request - userType:", typeof req.user.id);

            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                return res.status(400).json({ message: "Vehicle not found" });
            }

            console.log("Vehicle currentOwner:", vehicle.currentOwner);
            console.log("Vehicle currentOwner type:", typeof vehicle.currentOwner);
            console.log("Vehicle currentOwner toString:", vehicle.currentOwner?.toString());
            console.log("Match check:", String(vehicle.currentOwner) === String(req.user.id));

            if (!vehicle.currentOwner || String(vehicle.currentOwner) !== String(req.user.id)) {
                return res.status(400).json({ message: "You do not own this vehicle" });
            }

            const buyer = await User.findOne({ email: buyerEmail, role: "owner" });
            if (!buyer) {
                return res.status(400).json({ message: "Buyer not found" });
            }

            const request = new Request({
                type: "transfer",
                vehicle: vehicle._id,
                seller: req.user.id,
                buyer: buyer._id,
                status: "pending"
            });

            await request.save();

            res.status(201).json({ message: "Transfer request created", requestId: request._id });
        } catch (err) {
            console.error("transfer error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Get all requests (RTO only)
router.get(
    "/all",
    authRequired,
    requireRole("rto"),
    async (req, res) => {
        try {
            const requests = await Request.find()
                .populate("vehicle")
                .populate("dealer", "name")
                .populate("seller", "name")
                .populate("buyer", "name")
                .sort({ createdAt: -1 });
            res.json(requests);
        } catch (err) {
            console.error("get all requests error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Get dealer's own requests (Dealer only)
router.get(
    "/my-requests",
    authRequired,
    requireRole("dealer"),
    async (req, res) => {
        try {
            const requests = await Request.find({ dealer: req.user.id })
                .populate("vehicle")
                .populate("buyer", "name")
                .sort({ createdAt: -1 });
            res.json(requests);
        } catch (err) {
            console.error("get dealer requests error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

router.post(
    "/:id/approve",
    authRequired,
    requireRole("rto"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { regNumber } = req.body;

            const request = await Request.findById(id).populate("vehicle");
            if (!request || request.status !== "pending") {
                return res.status(400).json({ message: "Invalid request" });
            }

            const vehicle = await Vehicle.findById(request.vehicle._id);

            // FOR TRANSFER REQUESTS: Check for pending challans
            if (request.type === "transfer") {
                const Challan = (await import('../models/Challan.js')).Challan;

                const pendingChallans = await Challan.find({
                    vehicle: vehicle._id,
                    paymentStatus: { $in: ["pending", "partial"] },
                    status: "active"
                });

                if (pendingChallans.length > 0) {
                    const totalPending = pendingChallans.reduce((sum, c) => sum + (c.fineAmount - c.paidAmount), 0);
                    return res.status(400).json({
                        message: `Vehicle has ${pendingChallans.length} pending challan(s) totaling ₹${totalPending}. All challans must be cleared before transfer.`,
                        pendingChallansCount: pendingChallans.length,
                        totalPendingAmount: totalPending,
                        challans: pendingChallans.map(c => ({
                            challanId: c._id,
                            violationType: c.violationType,
                            fineAmount: c.fineAmount,
                            paidAmount: c.paidAmount,
                            remainingAmount: c.fineAmount - c.paidAmount
                        }))
                    });
                }

                console.log("✓ No pending challans for transfer");
            }

            let txHash;
            try {
                console.log(`\n=== BLOCKCHAIN APPROVAL START ===`);
                console.log(`Request Type: ${request.type}`);
                console.log(`Vehicle: ${vehicle.make} ${vehicle.model}`);
                console.log(`Reg Number: ${regNumber || vehicle.regNumber}`);

                if (request.type === "newRegistration") {
                    if (!regNumber) return res.status(400).json({ message: "Registration number required" });
                    vehicle.regNumber = regNumber;

                    // Get user's blockchain wallet address
                    const buyerUser = await User.findById(request.buyer);
                    console.log("Buyer User:", buyerUser?.name, buyerUser?._id);

                    const ownerAddress = buyerUser?.blockchainWalletAddress || `0x${buyerUser._id}`;
                    console.log("Owner Address:", ownerAddress);

                    console.log("Calling registerVehicleOnChain...");
                    txHash = await registerVehicleOnChain(
                        vehicle.regNumber,
                        vehicle.chassisNumber,
                        vehicle.engineNumber,
                        vehicle.make,
                        vehicle.model,
                        vehicle.year,
                        ownerAddress
                    );
                    console.log("✓ Blockchain registration successful:", txHash);

                    vehicle.currentOwner = request.buyer;
                    vehicle.blockchainTxHash = txHash;
                } else {
                    // Get user's blockchain wallet addresses
                    const sellerUser = await User.findById(request.seller);
                    const buyerUser = await User.findById(request.buyer);
                    console.log("Seller:", sellerUser?.name, "Buyer:", buyerUser?.name);

                    const sellerAddress = sellerUser?.blockchainWalletAddress || `0x${sellerUser._id}`;
                    const buyerAddress = buyerUser?.blockchainWalletAddress || `0x${buyerUser._id}`;
                    console.log("Seller Address:", sellerAddress);
                    console.log("Buyer Address:", buyerAddress);

                    console.log("Calling transferVehicleOnChain...");
                    txHash = await transferVehicleOnChain(vehicle.regNumber, sellerAddress, buyerAddress, "purchase", "0x0000000000000000000000000000000000000000000000000000000000000000");
                    console.log("✓ Blockchain transfer successful:", txHash);

                    vehicle.currentOwner = request.buyer;
                    vehicle.blockchainTxHash = txHash;
                }

                await vehicle.save();
                console.log("✓ Vehicle saved with blockchain hash\n");
            } catch (blockchainErr) {
                console.error("❌ Blockchain operation failed:", blockchainErr.message);
                console.error("Error stack:", blockchainErr.stack);
                // If blockchain fails, still allow the operation but log warning
                console.warn("Proceeding without blockchain registration due to:", blockchainErr.message);

                // Set default values if blockchain failed
                if (request.type === "newRegistration" && !vehicle.regNumber) {
                    vehicle.regNumber = regNumber || "TEMP-" + Date.now();
                }
                vehicle.currentOwner = request.buyer;
                vehicle.blockchainTxHash = null; // Mark as pending blockchain sync
                await vehicle.save();
                console.log("⚠️ Vehicle approved WITHOUT blockchain hash\n");
            }

            // Update invoice with blockchain hash for new registrations
            if (request.type === "newRegistration" && request.invoice && vehicle.blockchainTxHash) {
                request.invoice.blockchainTxHash = vehicle.blockchainTxHash;
                await Request.findByIdAndUpdate(request._id, { invoice: request.invoice });
            }

            // Create ownership history record
            const ownershipRecord = await OwnershipHistory.create({
                vehicle: vehicle._id,
                fromOwner: request.seller || null,
                toOwner: request.buyer,
                blockchainTxHash: txHash,
                transferType: request.type === "newRegistration" ? "new_registration" : "purchase",
                biometricVerification: req.biometricVerification || null
            });

            // Store transfer record on IPFS for immutable documentation
            try {
                const transferData = {
                    vehicleRegNumber: vehicle.regNumber,
                    vehicleDetails: {
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                        chassisNumber: vehicle.chassisNumber,
                        engineNumber: vehicle.engineNumber
                    },
                    transferType: request.type,
                    fromOwner: request.seller ? (await User.findById(request.seller))?.email : "DEALER",
                    toOwner: (await User.findById(request.buyer))?.email,
                    txHash: txHash,
                    approvedBy: req.user.id,
                    approvedAt: new Date().toISOString(),
                    biometricVerified: !!req.biometricVerification
                };

                const ipfsResult = await storeTransferRecord(transferData);
                ownershipRecord.ipfsDocumentHash = ipfsResult.ipfsHash;
                await ownershipRecord.save();

                // Update vehicle with IPFS reference
                vehicle.ipfsRecordHash = ipfsResult.ipfsHash;
                await vehicle.save();

                console.log(`Transfer record stored on IPFS: ${ipfsResult.ipfsHash}`);
            } catch (ipfsErr) {
                console.error("Failed to store transfer record on IPFS:", ipfsErr.message);
                // Don't fail the operation if IPFS storage fails
            }

            request.status = "approved";
            request.rtoOfficer = req.user.id;
            await request.save();

            res.json({ message: "Request approved", txHash, ipfsHash: ownershipRecord.ipfsDocumentHash });
        } catch (err) {
            console.error("approve error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

router.post(
    "/:id/reject",
    authRequired,
    requireRole("rto"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { remarks } = req.body;

            const request = await Request.findById(id);
            if (!request || request.status !== "pending") {
                return res.status(400).json({ message: "Invalid request" });
            }

            request.status = "rejected";
            request.remarks = remarks;
            request.rtoOfficer = req.user.id;
            await request.save();

            res.json({ message: "Request rejected" });
        } catch (err) {
            console.error("reject error:", err.message);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// Get invoice details for a request
router.get("/:id/invoice", authRequired, async (req, res) => {
    try {
        const { id } = req.params;

        const request = await Request.findById(id)
            .populate('vehicle')
            .populate('dealer', 'name email dealerDetails')
            .populate('buyer', 'name email aadhaarNumber dlNumber address')
            .populate('invoice.verifiedBy', 'name email');

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.type !== "newRegistration") {
            return res.status(400).json({ message: "Invoice only available for new registrations" });
        }

        // Check authorization
        const isDealer = String(request.dealer._id) === String(req.user.id);
        const isBuyer = String(request.buyer._id) === String(req.user.id);
        const isRTO = req.user.role === "rto";
        const isPolice = req.user.role === "police";

        if (!isDealer && !isBuyer && !isRTO && !isPolice) {
            return res.status(403).json({ message: "Not authorized to view this invoice" });
        }

        const dealer = request.dealer;
        const buyer = request.buyer;
        const vehicle = request.vehicle;
        const invoice = request.invoice;

        // Format invoice data for frontend
        const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            // Dealer details
            dealerName: dealer.name,
            dealerBusinessName: dealer.dealerDetails?.businessName || dealer.name,
            dealerGSTIN: dealer.dealerDetails?.gstin || "N/A",
            dealerTIN: dealer.dealerDetails?.tin || "N/A",
            dealerLicense: dealer.dealerDetails?.licenseNumber || "N/A",
            dealerAddress: dealer.dealerDetails?.showroomAddress || "Address not provided",
            dealerPhone: dealer.dealerDetails?.phone || "N/A",
            dealerEmail: dealer.email,
            // Buyer details
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            buyerAadhaar: buyer.aadhaarNumber || "N/A",
            buyerDL: buyer.dlNumber || "N/A",
            buyerAddress: buyer.address || "Address not provided",
            // Vehicle details
            chassisNumber: vehicle.chassisNumber,
            engineNumber: vehicle.engineNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            // Pricing
            exShowroomPrice: invoice.exShowroomPrice,
            roadTax: invoice.roadTax,
            registrationFee: invoice.registrationFee,
            insuranceAmount: invoice.insuranceAmount,
            handlingCharges: invoice.handlingCharges,
            otherCharges: invoice.otherCharges,
            gstAmount: invoice.gstAmount,
            grandTotal: invoice.grandTotal,
            // Payment
            paymentMode: invoice.paymentMode,
            paymentStatus: invoice.paymentStatus,
            // Verification
            verificationStatus: invoice.verificationStatus,
            verifiedBy: invoice.verifiedBy?.name || null,
            verifiedAt: invoice.verifiedAt,
            verificationRemarks: invoice.verificationRemarks,
            signatureHash: invoice.signatureHash,
            // Blockchain - prefer invoice hash, fallback to vehicle hash
            blockchainTxHash: invoice.blockchainTxHash || vehicle.blockchainTxHash
        };

        res.json(invoiceData);
    } catch (err) {
        console.error("Get invoice error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get my invoices (for owner)
router.get("/my-invoices", authRequired, async (req, res) => {
    try {
        // Find all requests where the user is the buyer and has an invoice
        const requests = await Request.find({
            buyer: req.user.id,
            type: "newRegistration",
            invoice: { $exists: true }
        })
            .populate('vehicle', 'make model regNumber year')
            .select('_id invoice createdAt status');

        const invoices = requests.map(req => ({
            _id: req._id,
            invoiceNumber: req.invoice.invoiceNumber,
            vehicle: req.vehicle,
            status: req.status,
            createdAt: req.createdAt
        }));

        res.json(invoices);
    } catch (err) {
        console.error("Get my invoices error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Verify invoice (RTO only)
router.put("/:id/verify-invoice", authRequired, requireRole("rto"), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        const request = await Request.findById(id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.type !== "newRegistration") {
            return res.status(400).json({ message: "Invoice verification only for new registrations" });
        }

        if (!request.invoice) {
            return res.status(400).json({ message: "No invoice found for this request" });
        }

        request.invoice.verificationStatus = status;
        request.invoice.verifiedBy = req.user.id;
        request.invoice.verifiedAt = new Date();
        request.invoice.verificationRemarks = remarks || "";

        // If invoice is verified, mark documents as verified
        if (status === "verified") {
            request.documentsVerified = true;
        }

        await request.save();

        res.json({
            message: `Invoice ${status}`,
            verificationStatus: status
        });
    } catch (err) {
        console.error("Verify invoice error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
