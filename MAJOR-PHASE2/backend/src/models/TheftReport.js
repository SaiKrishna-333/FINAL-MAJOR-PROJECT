import mongoose from "mongoose";

const theftReportSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true
        },
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        policeStation: {
            type: String,
            required: true
        },
        firNumber: {
            type: String,
            required: true
        },
        incidentDate: {
            type: Date,
            required: true
        },
        incidentLocation: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["reported", "under_investigation", "recovered", "closed"],
            default: "reported"
        },
        recoveryDate: {
            type: Date
        },
        recoveryLocation: {
            type: String
        },
        remarks: {
            type: String
        }
    },
    { timestamps: true }
);

export const TheftReport = mongoose.model("TheftReport", theftReportSchema);