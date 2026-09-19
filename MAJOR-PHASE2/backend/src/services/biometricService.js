// biometricService.js
// This file integrates with real fingerprint SDK for biometric authentication

// For demonstration purposes, we'll use a mock biometric SDK
// In production, this would connect to a real fingerprint scanner SDK

// Mock database to store biometric templates (in production, use secure storage)
const biometricTemplates = new Map();

export const enrollFingerprint = async (userId, rawFingerprintData) => {
    try {
        // Simulate connecting to fingerprint scanner SDK
        // This would be replaced with actual SDK calls
        console.log(`Enrolling fingerprint for user ${userId}`);

        // In a real implementation, this would process the raw fingerprint data
        // and generate a secure biometric template
        const templateId = generateSecureTemplateId(userId);

        // Store the biometric template securely (in production, use encrypted storage)
        biometricTemplates.set(templateId, {
            userId,
            template: rawFingerprintData || `encrypted_template_for_${userId}`,
            enrolledAt: new Date(),
            status: 'active'
        });

        console.log(`Fingerprint enrolled successfully for user ${userId}. Template ID: ${templateId}`);

        return templateId;
    } catch (error) {
        console.error('Error enrolling fingerprint:', error.message);
        throw error;
    }
};

export const verifyFingerprint = async (userId, rawFingerprintData) => {
    try {
        console.log(`Verifying fingerprint for user ${userId}`);

        // Find the user's stored biometric template
        let userTemplateId = null;
        for (const [templateId, templateData] of biometricTemplates.entries()) {
            if (templateData.userId === userId && templateData.status === 'active') {
                userTemplateId = templateId;
                break;
            }
        }

        if (!userTemplateId) {
            return {
                success: false,
                message: "No enrolled fingerprint found for this user"
            };
        }

        // In a real implementation, this would compare the raw fingerprint data
        // with the stored template using the SDK's matching algorithm
        // For demo, we'll simulate a successful match
        const isValid = simulateBiometricMatch(biometricTemplates.get(userTemplateId), rawFingerprintData);

        const result = {
            success: isValid,
            message: isValid ? "Fingerprint verification successful" : "Fingerprint verification failed",
            templateId: userTemplateId
        };

        console.log(`Fingerprint verification result for user ${userId}:`, result);

        return result;
    } catch (error) {
        console.error('Error verifying fingerprint:', error.message);
        return {
            success: false,
            message: `Fingerprint verification error: ${error.message}`
        };
    }
};

// Function to generate a secure template ID
function generateSecureTemplateId(userId) {
    return `bio_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to simulate biometric matching (in production, use SDK)
function simulateBiometricMatch(storedTemplate, inputTemplate) {
    // In a real implementation, this would use the biometric SDK's matching algorithm
    // For demo purposes, we'll return true 95% of the time to simulate a realistic scenario
    return Math.random() > 0.05; // 95% success rate
}

// Function to get user's biometric template
export const getUserBiometricTemplate = async (userId) => {
    for (const [templateId, templateData] of biometricTemplates.entries()) {
        if (templateData.userId === userId && templateData.status === 'active') {
            return {
                templateId,
                ...templateData
            };
        }
    }
    return null;
};
