// ipfsService.js
// Service for storing and retrieving document hashes on IPFS
// Uses Pinata or local IPFS node for decentralized storage

import axios from "axios";
import FormData from "form-data";

// Pinata API configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";
const PINATA_BASE_URL = "https://api.pinata.cloud";

// Local IPFS node configuration (fallback)
const IPFS_LOCAL_URL = process.env.IPFS_LOCAL_URL || "http://localhost:5001";

/**
 * Upload a file to IPFS via Pinata
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original file name
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<string>} - IPFS hash (CID)
 */
export const uploadToIPFS = async (fileBuffer, fileName, metadata = {}) => {
    try {
        // Try Pinata first if API keys are available
        if (PINATA_API_KEY && PINATA_SECRET_KEY) {
            return await uploadToPinata(fileBuffer, fileName, metadata);
        }

        // Fallback to local IPFS node
        return await uploadToLocalIPFS(fileBuffer, fileName);
    } catch (error) {
        console.error("Error uploading to IPFS:", error.message);
        throw new Error("Failed to upload document to IPFS");
    }
};

/**
 * Upload file to Pinata (managed IPFS service)
 */
const uploadToPinata = async (fileBuffer, fileName, metadata) => {
    const url = `${PINATA_BASE_URL}/pinning/pinFileToIPFS`;

    const formData = new FormData();
    formData.append("file", fileBuffer, { filename: fileName });

    // Add metadata
    const pinataMetadata = JSON.stringify({
        name: fileName,
        keyvalues: {
            ...metadata,
            uploadedAt: new Date().toISOString(),
            system: "BioChain RTO"
        }
    });
    formData.append("pinataMetadata", pinataMetadata);

    // Pin options
    const pinataOptions = JSON.stringify({
        cidVersion: 1,
        wrapWithDirectory: false
    });
    formData.append("pinataOptions", pinataOptions);

    const response = await axios.post(url, formData, {
        headers: {
            ...formData.getHeaders(),
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
    });

    const ipfsHash = response.data.IpfsHash;
    console.log(`File uploaded to IPFS via Pinata. Hash: ${ipfsHash}`);

    return ipfsHash;
};

/**
 * Upload file to local IPFS node
 */
const uploadToLocalIPFS = async (fileBuffer, fileName) => {
    const FormDataLocal = (await import("form-data")).default;
    const formData = new FormDataLocal();
    formData.append("file", fileBuffer, { filename: fileName });

    const response = await axios.post(`${IPFS_LOCAL_URL}/api/v0/add`, formData, {
        headers: formData.getHeaders()
    });

    const ipfsHash = response.data.Hash;
    console.log(`File uploaded to local IPFS. Hash: ${ipfsHash}`);

    return ipfsHash;
};

/**
 * Upload JSON metadata to IPFS
 * @param {Object} jsonData - JSON data to upload
 * @param {string} name - Name for the pinned content
 * @returns {Promise<string>} - IPFS hash (CID)
 */
export const uploadJSONToIPFS = async (jsonData, name = "metadata.json") => {
    try {
        const data = JSON.stringify({
            pinataContent: jsonData,
            pinataMetadata: {
                name,
                keyvalues: {
                    type: "json",
                    uploadedAt: new Date().toISOString(),
                    system: "BioChain RTO"
                }
            },
            pinataOptions: {
                cidVersion: 1
            }
        });

        if (PINATA_API_KEY && PINATA_SECRET_KEY) {
            const response = await axios.post(
                `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        pinata_api_key: PINATA_API_KEY,
                        pinata_secret_api_key: PINATA_SECRET_KEY
                    }
                }
            );

            console.log(`JSON uploaded to IPFS. Hash: ${response.data.IpfsHash}`);
            return response.data.IpfsHash;
        } else {
            // Local IPFS fallback
            const buffer = Buffer.from(JSON.stringify(jsonData));
            return await uploadToLocalIPFS(buffer, name);
        }
    } catch (error) {
        console.error("Error uploading JSON to IPFS:", error.message);
        throw new Error("Failed to upload JSON to IPFS");
    }
};

/**
 * Get IPFS gateway URL for a hash
 * @param {string} ipfsHash - IPFS hash/CID
 * @returns {string} - Public gateway URL
 */
export const getIPFSUrl = (ipfsHash) => {
    // Use Pinata gateway or public IPFS gateway
    const gateway = process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud";
    return `${gateway}/ipfs/${ipfsHash}`;
};

/**
 * Retrieve file from IPFS
 * @param {string} ipfsHash - IPFS hash/CID
 * @returns {Promise<Buffer>} - File content
 */
export const getFromIPFS = async (ipfsHash) => {
    try {
        const url = getIPFSUrl(ipfsHash);
        const response = await axios.get(url, {
            responseType: "arraybuffer"
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error("Error retrieving from IPFS:", error.message);
        throw new Error("Failed to retrieve document from IPFS");
    }
};

/**
 * Store vehicle document on IPFS and return hash
 * This is the main function used by the document routes
 */
export const storeVehicleDocument = async (documentBuffer, documentType, vehicleRegNumber, metadata = {}) => {
    try {
        const fileName = `${documentType}_${vehicleRegNumber}_${Date.now()}.pdf`;

        const enrichedMetadata = {
            documentType,
            vehicleRegNumber,
            ...metadata
        };

        const ipfsHash = await uploadToIPFS(documentBuffer, fileName, enrichedMetadata);

        return {
            ipfsHash,
            ipfsUrl: getIPFSUrl(ipfsHash),
            documentType,
            storedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error storing vehicle document:", error.message);
        throw error;
    }
};

/**
 * Store ownership transfer record on IPFS
 * Creates an immutable record of the transfer with all details
 */
export const storeTransferRecord = async (transferData) => {
    try {
        const record = {
            ...transferData,
            timestamp: new Date().toISOString(),
            system: "BioChain RTO",
            version: "1.0"
        };

        const fileName = `transfer_${transferData.vehicleRegNumber}_${transferData.txHash}.json`;
        const ipfsHash = await uploadJSONToIPFS(record, fileName);

        return {
            ipfsHash,
            ipfsUrl: getIPFSUrl(ipfsHash),
            storedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error storing transfer record:", error.message);
        throw error;
    }
};

/**
 * Verify if a document exists on IPFS
 * @param {string} ipfsHash - IPFS hash to verify
 * @returns {Promise<boolean>} - Whether the hash is accessible
 */
export const verifyIPFSHash = async (ipfsHash) => {
    try {
        const url = getIPFSUrl(ipfsHash);
        await axios.head(url, { timeout: 5000 });
        return true;
    } catch (error) {
        console.warn(`IPFS hash ${ipfsHash} not accessible:`, error.message);
        return false;
    }
};

/**
 * Unpin content from Pinata (when no longer needed)
 * @param {string} ipfsHash - IPFS hash to unpin
 */
export const unpinFromIPFS = async (ipfsHash) => {
    try {
        if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
            console.warn("Pinata API keys not configured, cannot unpin");
            return;
        }

        await axios.delete(`${PINATA_BASE_URL}/pinning/unpin/${ipfsHash}`, {
            headers: {
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_KEY
            }
        });

        console.log(`Unpinned ${ipfsHash} from Pinata`);
    } catch (error) {
        console.error("Error unpinning from IPFS:", error.message);
        throw error;
    }
};
