import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["theft_alert", "transfer_request", "approval", "rejection", "system"],
            required: true
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipientRole: {
            type: String,
            enum: ["dealer", "owner", "rto", "police", "admin", "all"],
            required: true
        },
        relatedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle"
        },
        relatedRequest: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "requestModel"
        },
        requestModel: {
            type: String,
            enum: ["Request", "InheritanceTransfer", "TheftReport"]
        },
        status: {
            type: String,
            enum: ["unread", "read", "archived"],
            default: "unread"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },
        actionRequired: { type: Boolean, default: false },
        actionUrl: { type: String },
        metadata: {
            type: Map,
            of: String
        }
    },
    { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
