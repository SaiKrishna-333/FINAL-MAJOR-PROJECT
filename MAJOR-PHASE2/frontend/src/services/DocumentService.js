// Note: This service is designed to work with the api instance from AuthContext
// The actual API calls should be made from components that have access to the auth context

export const DocumentService = {
    // These functions expect the api instance to be passed from the component
    // Get Registration Certificate (RC)
    getRC: async (api, vehicleId) => {
        try {
            const response = await api.get(`/documents/rc/${vehicleId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching RC:', error);
            throw error;
        }
    },

    // Get Transfer Certificate
    getTransferCertificate: async (api, requestId) => {
        try {
            const response = await api.get(`/documents/transfer-certificate/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transfer certificate:', error);
            throw error;
        }
    },

    // Get Invoice
    getInvoice: async (api, requestId) => {
        try {
            const response = await api.get(`/documents/invoice/${requestId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            throw error;
        }
    },

    // Get all user documents
    getUserDocuments: async (api) => {
        try {
            const response = await api.get('/documents/user-documents');
            return response.data;
        } catch (error) {
            console.error('Error fetching user documents:', error);
            throw error;
        }
    }
};