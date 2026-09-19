import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixEmployeeIdIndex() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/BioChainRTO');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('users');

        // Drop the existing index on rtoDetails.employeeId
        try {
            await collection.dropIndex('rtoDetails.employeeId_1');
            console.log('✓ Dropped existing index on rtoDetails.employeeId');
        } catch (err) {
            if (err.code === 27) {
                console.log('Index does not exist, skipping drop');
            } else {
                console.log('Error dropping index:', err.message);
            }
        }

        // The sparse index will be recreated automatically when the schema is loaded
        console.log('✓ Sparse index will be created automatically on next server start');

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB');
        console.log('\nPlease restart the backend server for changes to take effect.');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

fixEmployeeIdIndex();
