import mongoose from "mongoose";

const ownershipHistorySchema = new mongoose.Schema(
    {
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
        fromOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        toOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        blockchainTxHash: { type: String },
        transferType: { type: String, enum: ["purchase", "inheritance", "gift", "transfer", "new_registration"], default: "transfer" },
        biometricVerification: { // Store biometric verification details for the transaction
            verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            timestamp: { type: Date },
            templateId: { type: String },
            success: { type: Boolean }
        },
        timestamp: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

export const OwnershipHistory = mongoose.model(
    "OwnershipHistory",
    ownershipHistorySchema
);
