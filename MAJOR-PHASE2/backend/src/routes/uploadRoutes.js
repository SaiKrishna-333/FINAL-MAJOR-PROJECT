import express from "express";
import multer from "multer";
import { authRequired, requireRole } from "../middleware/authMiddleware.js";
import { Vehicle } from "../models/Vehicle.js";
import { storeVehicleDocument, getIPFSUrl } from "../services/ipfsService.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow PDF, images, and common document types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'), false);
        }
    }
});

/**
 * Upload vehicle document to IPFS
 * POST /api/upload/vehicle-document/:vehicleId
 */
router.post(
    "/vehicle-document/:vehicleId",
    authRequired,
    upload.single('document'),
    async (req, res) => {
        try {
            const { vehicleId } = req.params;
            const { documentType } = req.body; // rc, insurance, puc, transfer, invoice, other

            if (!req.file) {
                return res.status(400).json({ message: "No document provided" });
            }

            if (!documentType) {
                return res.status(400).json({ message: "Document type required" });
            }

            // Verify vehicle exists and user has access
            const vehicle = await Vehicle.findById(vehicleId);
            if (!vehicle) {
                return res.status(404).json({ message: "Vehicle not found" });
            }

            // Check authorization
            const isOwner = vehicle.currentOwner?.toString() === req.user.id;
            const isRTO = req.user.role === "rto";
            const isPolice = req.user.role === "police";

            if (!isOwner && !isRTO && !isPolice) {
                return res.status(403).json({ message: "Unauthorized to upload documents for this vehicle" });
            }

            // Upload to IPFS
            const result = await storeVehicleDocument(
                req.file.buffer,
                documentType,
                vehicle.regNumber || vehicleId,
                {
                    originalName: req.file.originalname,
                    mimeType: req.file.mimetype,
                    uploadedBy: req.user.id,
                    uploadedByRole: req.user.role
                }
            );

            // Update vehicle record with IPFS hash
            if (!vehicle.ipfsDocuments) {
                vehicle.ipfsDocuments = {};
            }

            const documentTypeMap = {
                'rc': 'rcCertificate',
                'insurance': 'insurance',
                'puc': 'puc',
                'transfer': 'transferForms',
                'invoice': 'invoice',
                'other': 'otherDocuments'
            };

            const fieldName = documentTypeMap[documentType];
            if (fieldName) {
                if (documentType === 'other') {
                    if (!vehicle.ipfsDocuments.otherDocuments) {
                        vehicle.ipfsDocuments.otherDocuments = [];
                    }
                    vehicle.ipfsDocuments.otherDocuments.push(result.ipfsHash);
                } else {
                    vehicle.ipfsDocuments[fieldName] = result.ipfsHash;
                }
            }

            await vehicle.save();

            res.json({
                message: "Document uploaded successfully",
                documentType,
                ipfsHash: result.ipfsHash,
                ipfsUrl: result.ipfsUrl,
                storedAt: result.storedAt
            });

        } catch (err) {
            console.error("Document upload error:", err.message);
            res.status(500).json({ message: "Failed to upload document", error: err.message });
        }
    }
);

/**
 * Get vehicle documents
 * GET /api/upload/vehicle-documents/:vehicleId
 */
router.get("/vehicle-documents/:vehicleId", authRequired, async (req, res) => {
    try {
        const { vehicleId } = req.params;

        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        // Check authorization
        const isOwner = vehicle.currentOwner?.toString() === req.user.id;
        const isRTO = req.user.role === "rto";
        const isPolice = req.user.role === "police";

        if (!isOwner && !isRTO && !isPolice) {
            return res.status(403).json({ message: "Unauthorized to view documents" });
        }

        const documents = {};

        if (vehicle.ipfsDocuments) {
            if (vehicle.ipfsDocuments.rcCertificate) {
                documents.rcCertificate = {
                    ipfsHash: vehicle.ipfsDocuments.rcCertificate,
                    ipfsUrl: getIPFSUrl(vehicle.ipfsDocuments.rcCertificate),
                    type: "Registration Certificate"
                };
            }
            if (vehicle.ipfsDocuments.insurance) {
                documents.insurance = {
                    ipfsHash: vehicle.ipfsDocuments.insurance,
                    ipfsUrl: getIPFSUrl(vehicle.ipfsDocuments.insurance),
                    type: "Insurance"
                };
            }
            if (vehicle.ipfsDocuments.puc) {
                documents.puc = {
                    ipfsHash: vehicle.ipfsDocuments.puc,
                    ipfsUrl: getIPFSUrl(vehicle.ipfsDocuments.puc),
                    type: "PUC Certificate"
                };
            }
            if (vehicle.ipfsDocuments.transferForms) {
                documents.transferForms = {
                    ipfsHash: vehicle.ipfsDocuments.transferForms,
                    ipfsUrl: getIPFSUrl(vehicle.ipfsDocuments.transferForms),
                    type: "Transfer Forms"
                };
            }
            if (vehicle.ipfsDocuments.invoice) {
                documents.invoice = {
                    ipfsHash: vehicle.ipfsDocuments.invoice,
                    ipfsUrl: getIPFSUrl(vehicle.ipfsDocuments.invoice),
                    type: "Purchase Invoice"
                };
            }
            if (vehicle.ipfsDocuments.otherDocuments?.length > 0) {
                documents.otherDocuments = vehicle.ipfsDocuments.otherDocuments.map((hash, index) => ({
                    ipfsHash: hash,
                    ipfsUrl: getIPFSUrl(hash),
                    type: `Other Document ${index + 1}`
                }));
            }
        }

        res.json({
            vehicleId,
            regNumber: vehicle.regNumber,
            documents,
            totalDocuments: Object.keys(documents).length
        });

    } catch (err) {
        console.error("Get documents error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * Upload inheritance documents
 * POST /api/upload/inheritance-documents/:inheritanceId
 */
router.post(
    "/inheritance-documents/:inheritanceId",
    authRequired,
    upload.array('documents', 5), // Allow up to 5 files
    async (req, res) => {
        try {
            const { inheritanceId } = req.params;
            const { documentType } = req.body;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "No documents provided" });
            }

            const uploadResults = [];

            for (const file of req.files) {
                const result = await storeVehicleDocument(
                    file.buffer,
                    `inheritance_${documentType}`,
                    inheritanceId,
                    {
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        inheritanceId,
                        uploadedBy: req.user.id
                    }
                );

                uploadResults.push({
                    originalName: file.originalname,
                    ipfsHash: result.ipfsHash,
                    ipfsUrl: result.ipfsUrl
                });
            }

            res.json({
                message: `${uploadResults.length} documents uploaded successfully`,
                documents: uploadResults
            });

        } catch (err) {
            console.error("Inheritance document upload error:", err.message);
            res.status(500).json({ message: "Failed to upload documents" });
        }
    }
);

/**
 * Upload theft report documents (FIR, etc.)
 * POST /api/upload/theft-documents/:theftReportId
 */
router.post(
    "/theft-documents/:theftReportId",
    authRequired,
    requireRole("owner", "police"),
    upload.array('documents', 3),
    async (req, res) => {
        try {
            const { theftReportId } = req.params;

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: "No documents provided" });
            }

            const uploadResults = [];

            for (const file of req.files) {
                const result = await storeVehicleDocument(
                    file.buffer,
                    'theft_report',
                    theftReportId,
                    {
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        theftReportId,
                        uploadedBy: req.user.id,
                        uploadedByRole: req.user.role
                    }
                );

                uploadResults.push({
                    originalName: file.originalname,
                    ipfsHash: result.ipfsHash,
                    ipfsUrl: result.ipfsUrl
                });
            }

            res.json({
                message: `${uploadResults.length} documents uploaded successfully`,
                documents: uploadResults
            });

        } catch (err) {
            console.error("Theft document upload error:", err.message);
            res.status(500).json({ message: "Failed to upload documents" });
        }
    }
);

export default router;
