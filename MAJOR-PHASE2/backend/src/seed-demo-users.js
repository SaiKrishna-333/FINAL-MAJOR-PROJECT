import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';

dotenv.config();

const users = [
  {
    name: 'Dealer Demo',
    email: 'dealer@biochain.com',
    password: 'dealer123',
    role: 'dealer',
    phone: '9876543210',
    address: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    dealerDetails: {
      businessName: 'BioChain Dealer Demo',
      gstin: '29ABCDE1234F1Z2',
      tin: 'TIN1001',
      showroomAddress: 'Bengaluru',
      contactPerson: 'Dealer Demo',
      contactPhone: '9876543210',
      contactEmail: 'dealer@biochain.com',
      phone: '9876543210',
      licenseNumber: 'DL-1001',
    },
  },
  {
    name: 'Owner Demo',
    email: 'owner@biochain.com',
    password: 'owner123',
    role: 'owner',
    phone: '9876543211',
    address: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    aadhaarNumber: '123456789012',
    dlNumber: 'KA1234567890',
  },
  {
    name: 'Karnataka RTO Demo',
    email: 'ka.rto@biochain.com',
    password: 'ka123',
    role: 'rto',
    phone: '9876543212',
    address: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    rtoDetails: {
      stateCode: 'KA',
      stateName: 'Karnataka',
      district: 'Bengaluru Urban',
      rtoOfficeCode: 'KA-01',
      rtoOfficeName: 'Bangalore Central RTO',
      designation: 'RTO Officer',
      employeeId: 'KA-EMP-001',
      officeAddress: 'Bengaluru',
      jurisdiction: 'Bengaluru Urban',
    },
  },
  {
    name: 'Tamil Nadu RTO Demo',
    email: 'tn.rto@biochain.com',
    password: 'tn123',
    role: 'rto',
    phone: '9876543213',
    address: 'Chennai',
    state: 'Tamil Nadu',
    district: 'Chennai',
    rtoDetails: {
      stateCode: 'TN',
      stateName: 'Tamil Nadu',
      district: 'Chennai',
      rtoOfficeCode: 'TN-01',
      rtoOfficeName: 'Chennai RTO',
      designation: 'RTO Officer',
      employeeId: 'TN-EMP-001',
      officeAddress: 'Chennai',
      jurisdiction: 'Chennai',
    },
  },
  {
    name: 'Police Demo',
    email: 'police@biochain.com',
    password: 'police123',
    role: 'police',
    phone: '9876543214',
    address: 'Bengaluru',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    badgeNumber: 'POL-1001',
  },
];

const seedUsers = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biochain_rto';

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for demo seeding');

  const emails = users.map((u) => u.email);
  await User.deleteMany({ email: { $in: emails } });

  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const user = new User({
      ...userData,
      passwordHash,
    });

    await user.save();
    console.log(`Created demo user: ${userData.email}`);
  }

  try {
    await mongoose.connection.db.collection('users').dropIndex('rtoDetails.employeeId_1');
    console.log('Dropped stale RTO employee index for demo compatibility');
  } catch (err) {
    console.log('No stale RTO employee index to drop');
  }

  console.log('Demo users seed complete');
  await mongoose.disconnect();
  process.exit(0);
};

seedUsers().catch((err) => {
  console.error('Demo seed failed:', err);
  process.exit(1);
});
