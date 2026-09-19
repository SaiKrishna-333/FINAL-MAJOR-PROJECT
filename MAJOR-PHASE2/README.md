# BioChain RTO - Blockchain-Based Vehicle Registration System

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-purple.svg)](https://soliditylang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## Overview

BioChain RTO is a **decentralized vehicle registration and ownership management system** that leverages blockchain technology, biometric authentication, and IPFS document storage to create a secure, transparent, and tamper-proof platform for vehicle lifecycle management.

### Key Features

- **Biometric Authentication**: Fingerprint-based identity verification for all transactions
- **Blockchain Immutability**: Ethereum smart contracts ensure tamper-proof ownership records
- **IPFS Document Storage**: Decentralized storage for vehicle documents and certificates
- **Real-time Notifications**: Multi-channel alerts via WebSocket, Email, and SMS
- **Theft Reporting**: Instant nationwide vehicle blocking with police integration
- **Inheritance Transfer**: Legal heirship claim processing with document verification
- **Digital RC**: QR-code enabled digital registration certificates
- **Police Verification Portal**: Real-time ownership and status verification

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIOCHAIN RTO ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Frontend   │    │   Backend    │    │  Blockchain  │                  │
│  │   (React)    │◄──►│  (Node.js)   │◄──►│  (Ethereum)  │                  │
│  │   Port 5173  │    │   Port 5000  │    │   Ganache    │                  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘                  │
│                             │                                               │
│                             ▼                                               │
│                    ┌─────────────────┐                                      │
│                    │    MongoDB      │                                      │
│                    │   (Database)    │                                      │
│                    └─────────────────┘                                      │
│                                                                             │
│  External Services: IPFS (Pinata) | WebSocket | Email (Nodemailer) | SMS   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend

- **React 19.2.0** with TypeScript
- **Vite** for build tooling
- **React Router DOM** for navigation
- **Axios** for API communication
- **Socket.io Client** for real-time notifications
- **Recharts** for analytics dashboards
- **QRCode.react** for digital RC generation
- **React-to-Print** for document printing

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcryptjs** for password hashing
- **Multer** for file uploads
- **Socket.io** for real-time communication
- **Ethers.js** for blockchain interaction
- **Nodemailer** for email notifications
- **Twilio** for SMS notifications

### Blockchain

- **Solidity 0.8.20** for smart contracts
- **Hardhat** for development and deployment
- **Ethers.js** for contract interaction
- **Ganache** for local blockchain testing

## Project Structure

```
BioChainRTO/
├── backend/                    # Node.js Backend API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Auth & biometric middleware
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # Business logic services
│   │   ├── app.js             # Express app setup
│   │   └── server.js          # Server entry point
│   └── .env                   # Environment variables
├── blockchain/                 # Smart Contracts
│   ├── contracts/
│   │   └── VehicleRegistry.sol
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.js
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # Auth context & hooks
│   │   ├── pages/             # Dashboard pages
│   │   ├── services/          # API & socket services
│   │   └── types/             # TypeScript definitions
│   └── index.html
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5.0 or higher)
- Ganache CLI or GUI
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SaiKrishna-333/BioChainRTO.git
cd BioChainRTO
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/biochain-rto
JWT_SECRET=your_jwt_secret_key_here
BLOCKCHAIN_PROVIDER=http://127.0.0.1:8545
CONTRACT_ADDRESS=your_deployed_contract_address

# Email Configuration (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone
```

### 3. Blockchain Setup

```bash
cd blockchain
npm install
```

Create a `.env` file in the blockchain directory:

```env
PRIVATE_KEY=your_ganache_private_key
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Running the Application

### Step 1: Start MongoDB

```bash
mongod
```

### Step 2: Start Ganache (Blockchain)

```bash
# Option 1: Ganache CLI
ganache-cli --deterministic

# Option 2: Ganache GUI
# Open Ganache application and create a new workspace
```

### Step 3: Deploy Smart Contract

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address and update it in `backend/.env`

### Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

Server will run on `http://localhost:5000`

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

## User Roles & Demo Credentials

| Role            | Email               | Password  | Dashboard        |
| --------------- | ------------------- | --------- | ---------------- |
| **Dealer**      | dealer@biochain.com     | dealer123 | Dealer Dashboard |
| **Owner**       | owner@biochain.com      | owner123  | Owner Dashboard  |
| **Karnataka RTO** | ka.rto@biochain.com | ka123     | RTO Dashboard    |
| **Tamil Nadu RTO** | tn.rto@biochain.com | tn123     | RTO Dashboard    |
| **Police**      | police@biochain.com     | police123 | Police Dashboard |

## Core Workflows

### 1. New Vehicle Registration (Dealer → Owner)

1. Dealer registers and logs in
2. Owner registers with biometric enrollment
3. Dealer creates new registration request
4. RTO receives real-time notification
5. RTO approves and assigns registration number
6. Digital RC generated and sent to owner
7. Blockchain records immutable ownership

### 2. Vehicle Resale (Owner A → Owner B)

1. New buyer registers on platform
2. Seller initiates transfer with biometric verification
3. RTO reviews and approves transfer
4. Blockchain updates ownership record
5. Both parties receive confirmation notifications
6. New Digital RC issued to buyer

### 3. Inheritance Transfer

1. Legal heir submits claim with death certificate
2. Uploads succession certificate and court order
3. RTO verifies all legal documents
4. Deceased owner's DID marked accordingly
5. Ownership transferred to legal heir
6. Special RC issued with inheritance notation

### 4. Theft Reporting & Blocking

1. Owner reports theft with FIR details
2. Vehicle status instantly changed to "STOLEN" on blockchain
3. Nationwide alerts sent to all RTOs and Police
4. All transfer attempts automatically blocked
5. Police verifies and updates investigation status
6. Upon recovery, vehicle unblocked and owner notified

### 5. Police Verification

1. Officer scans vehicle registration number
2. Real-time blockchain verification
3. Complete ownership history displayed
4. Stolen status instantly visible
5. Optional biometric verification available

## Smart Contract (VehicleRegistry.sol)

### Key Functions

```solidity
// Register new vehicle
function registerNewVehicle(string memory regNumber, ...)

// Transfer ownership
function transferOwnership(string memory regNumber, address to, ...)

// Get vehicle information
function getVehicleInfo(string memory regNumber)

// Get ownership history
function getOwnershipHistory(string memory regNumber)

// Update vehicle status (stolen/recovered)
function updateVehicleStatus(string memory regNumber, VehicleStatus newStatus)
```

### Events

```solidity
event VehicleRegistered(string indexed regNumber, address indexed owner);
event OwnershipTransferred(string indexed regNumber, address indexed from, address indexed to, string reason);
event VehicleStatusChanged(string indexed regNumber, VehicleStatus status);
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Vehicle Management

- `POST /api/requests/new-registration` - New vehicle registration
- `POST /api/requests/transfer` - Ownership transfer
- `GET /api/vehicles/my` - Get user's vehicles

### RTO Operations

- `GET /api/requests/all` - View all requests
- `POST /api/requests/:id/approve` - Approve request
- `POST /api/requests/:id/reject` - Reject request

### Inheritance

- `POST /api/inheritance/request` - Submit inheritance claim
- `PUT /api/inheritance/requests/:id/approve` - Approve inheritance

### Theft Reporting

- `POST /api/theft/report` - Report stolen vehicle
- `PUT /api/theft/reports/:id` - Update theft status

### Police Verification

- `GET /api/verification/vehicle/:regNumber` - Verify vehicle
- `GET /api/verification/person/:identifier` - Verify person

### Documents

- `POST /api/upload/vehicle-document/:vehicleId` - Upload document
- `GET /api/documents/rc/:vehicleId` - Get Digital RC

## Security Features

- **Biometric Verification**: Every transaction requires fingerprint authentication
- **JWT Authentication**: Secure token-based session management
- **Blockchain Immutability**: Tamper-proof ownership records
- **Role-Based Access Control**: Different permissions for each user role
- **Encrypted Document Storage**: Secure IPFS storage with access control
- **Real-time Monitoring**: Instant alerts for suspicious activities

## Notification Channels

- **WebSocket**: Real-time in-app notifications
- **Email**: SMTP-based email alerts
- **SMS**: Twilio integration for text messages
- **In-app**: Dashboard notification center

## Deployment

### Deploy to Polygon Amoy Testnet

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network polygonAmoy
```

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

## Future Enhancements

- [ ] Integration with real biometric SDK (DigitalPersona)
- [ ] Mobile application for iOS and Android
- [ ] AI-powered document verification
- [ ] Integration with government databases
- [ ] Insurance claim processing module
- [ ] Pollution certificate integration
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- React Team for the amazing frontend library
- Ethereum Foundation for blockchain technology
- Hardhat team for development environment
- MongoDB team for the database solution

## Contact

**Project Link**: [https://github.com/SaiKrishna-333/BioChainRTO](https://github.com/SaiKrishna-333/BioChainRTO)

---

**Note**: This project is developed for educational and demonstration purposes. Some features (biometric verification, document upload) are in simulation mode for demo purposes and can be integrated with real SDKs for production use.
