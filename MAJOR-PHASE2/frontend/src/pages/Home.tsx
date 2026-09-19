import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

// Feature icons as SVG components
const BiometricIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" />
    <path d="M12 6a6 6 0 0 0-6 6c0 3.314 2.686 6 6 6s6-2.686 6-6a6 6 0 0 0-6-6z" />
    <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const BlockchainIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="8" height="8" rx="1" />
    <rect x="14" y="2" width="8" height="8" rx="1" />
    <rect x="2" y="14" width="8" height="8" rx="1" />
    <rect x="14" y="14" width="8" height="8" rx="1" />
    <path d="M10 6h4M6 10v4M18 10v4M10 18h4" />
  </svg>
);

const StorageIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ContractIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const VerifyIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 12 15 16 10" />
  </svg>
);

// Transaction data
const recentTransactions = [
  {
    regNumber: "MH-12-AB-4892",
    owner: "Rajesh Subramaniam",
    type: "New Reg",
    status: "Verified",
    txHash: "0x3a9f...e434",
    time: "09:14 AM",
  },
  {
    regNumber: "KA-01-MX-7743",
    owner: "Arjun Venkatesh",
    type: "Transfer",
    status: "Verified",
    txHash: "0x67c2...bc9f",
    time: "08:52 AM",
  },
  {
    regNumber: "TN-09-BK-2201",
    owner: "Priya Rajan",
    type: "Inheritance",
    status: "Pending",
    txHash: "0xe842...fe82",
    time: "08:30 AM",
  },
  {
    regNumber: "DL-04-CZ-9910",
    owner: "Ramesh Gupta",
    type: "Stolen",
    status: "Blocked",
    txHash: "0x1a3...c7d0",
    time: "07:18 AM",
  },
  {
    regNumber: "GJ-05-XX-3310",
    owner: "Sunita Patel",
    type: "New Reg",
    status: "Verified",
    txHash: "0x923b...54ef",
    time: "06:55 AM",
  },
];

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusClass = () => {
    switch (status) {
      case "Verified":
        return "status-verified";
      case "Pending":
        return "status-pending";
      case "Blocked":
        return "status-blocked";
      case "Stolen":
        return "status-stolen";
      default:
        return "status-verified";
    }
  };

  return <span className={`status-pill ${getStatusClass()}`}>{status}</span>;
};

const TypeBadge = ({ type }: { type: string }) => {
  const getTypeClass = () => {
    switch (type) {
      case "New Reg":
        return "type-new";
      case "Transfer":
        return "type-transfer";
      case "Inheritance":
        return "type-inheritance";
      case "Stolen":
        return "type-stolen";
      default:
        return "type-new";
    }
  };

  return <span className={`type-pill ${getTypeClass()}`}>{type}</span>;
};

export default function Home() {
  const [animatedStats, setAnimatedStats] = useState({
    vehicles: 0,
    accuracy: 0,
    forgeries: 0,
    transfers: 0,
  });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      vehicles: 1400000,
      accuracy: 98,
      forgeries: 0,
      transfers: 312000,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        vehicles: Math.floor(targets.vehicles * easeOut),
        accuracy: Math.floor(targets.accuracy * easeOut),
        forgeries: 0,
        transfers: Math.floor(targets.transfers * easeOut),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-brand">
          <span className="nav-logo">BIOCHAIN</span>
          <span className="nav-subtitle">RTO</span>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link active">
            Dashboard
          </Link>
          <Link to="/register" className="nav-link">
            Registration
          </Link>
          <Link to="/transfer" className="nav-link">
            Transfer
          </Link>
          <Link to="/verify" className="nav-link">
            Verify
          </Link>
          <Link to="/admin" className="nav-link">
            Admin Tools
          </Link>
          <Link to="/police" className="nav-link">
            Law Enforcement
          </Link>
        </div>
        <Link to="/login" className="nav-login-btn">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          Login
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          BLOCKCHAIN • BIOMETRIC • IPFS • SMART CONTRACTS
        </div>
        <h1 className="hero-title">
          Secure Vehicle Lifecycle
          <br />
          on the <span className="highlight">Blockchain</span>
        </h1>
        <p className="hero-subtitle">
          India's first biometric-authenticated vehicle registration authority.
          Every ownership record is immutably stored on the Polygon network —
          transparent, tamper-resistant, and instantly verifiable.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-large">
            Register a Vehicle
          </Link>
          <Link to="/verify" className="btn btn-outline btn-large">
            Verify on Chain
          </Link>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-value">
              {formatNumber(animatedStats.vehicles)}
            </div>
            <div className="stat-label">VEHICLES REGISTERED</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{animatedStats.accuracy}%</div>
            <div className="stat-label">BIOMETRIC ACCURACY</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{animatedStats.forgeries}</div>
            <div className="stat-label">FORGERIES</div>
            <div className="stat-sublabel">SINCE LAUNCH</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">
              {formatNumber(animatedStats.transfers)}
            </div>
            <div className="stat-label">TRANSFERS EXECUTED</div>
          </div>
        </div>
      </section>

      {/* RTO Operations Section */}
      <section className="operations-section">
        <div className="section-header">
          <h3 className="section-title">RTO OPERATIONS</h3>
          <Link to="/dashboard" className="view-all-link">
            View Dashboard →
          </Link>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-card-value">284</div>
            <div className="stat-card-label">New Registrations</div>
            <div className="stat-card-trend up">↑ 12% from yesterday</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value">91</div>
            <div className="stat-card-label">Ownership Transfers</div>
            <div className="stat-card-trend up">↑ 7% from yesterday</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-card-value">18</div>
            <div className="stat-card-label">Pending Approvals</div>
            <div className="stat-card-trend">Requires RTO action</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-card-value">3</div>
            <div className="stat-card-label">Stolen Reports</div>
            <div className="stat-card-trend">Blocked on-chain</div>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="transactions-section">
        <div className="section-header">
          <h3 className="section-title">RECENT TRANSACTIONS</h3>
          <Link to="/transactions" className="view-all-link">
            View All →
          </Link>
        </div>
        <div className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>REG. NUMBER</th>
                <th>OWNER</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>TX HASH</th>
                <th>TIME</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, index) => (
                <tr key={index}>
                  <td className="mono">{tx.regNumber}</td>
                  <td>{tx.owner}</td>
                  <td>
                    <TypeBadge type={tx.type} />
                  </td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="mono tx-hash">{tx.txHash}</td>
                  <td className="time">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* RC Certificate Preview */}
      <section className="certificate-section">
        <div className="section-header centered">
          <div className="section-tabs">
            <button className="tab-btn active">NEW PURCHASE</button>
            <button className="tab-btn">SECOND-HAND</button>
            <button className="tab-btn">INHERITANCE</button>
          </div>
        </div>
        <div className="certificate-preview">
          <div className="rc-certificate">
            {/* Certificate Header */}
            <div className="rc-header">
              <div className="rc-header-left">
                <div className="rc-emblem">IN</div>
                <div className="rc-header-text">
                  <span className="rc-gov-label">GOVERNMENT OF INDIA</span>
                  <span className="rc-ministry">
                    Ministry of Road Transport & Highways
                  </span>
                </div>
              </div>
              <div className="rc-header-right">
                <span className="rc-badge-new">New Registration</span>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="rc-title-section">
              <div className="rc-title-left">
                <div className="rc-lock-icon">🔒</div>
                <div className="rc-title-text">
                  <span className="rc-authority">Blockchain RTO Authority</span>
                  <h2 className="rc-title">Registration Certificate</h2>
                  <span className="rc-subtitle">
                    First Ownership • Vehicle Purchase • Blockchain Issued
                  </span>
                </div>
              </div>
              <div className="rc-title-right">
                <span className="rc-status-active">Active</span>
                <span className="rc-validity">Valid till 14 Mar 2035</span>
              </div>
            </div>

            {/* Registration Number */}
            <div className="rc-reg-section">
              <span className="rc-reg-label">REGN NO</span>
              <span className="rc-reg-number">MH-12-AB-4892</span>
            </div>

            {/* Details Grid */}
            <div className="rc-details-grid">
              <div className="rc-detail-item">
                <label>Owner Name</label>
                <span className="rc-detail-value">Rajesh Subramaniam</span>
              </div>
              <div className="rc-detail-item">
                <label>Aadhaar Number</label>
                <span className="rc-detail-value rc-mono">XXXX-XXXX-7821</span>
              </div>
              <div className="rc-detail-item">
                <label>Registration Date</label>
                <span className="rc-detail-value">14 Mar 2025</span>
              </div>
              <div className="rc-detail-item">
                <label>Vehicle Class</label>
                <span className="rc-detail-value">Tata Nexon EV</span>
              </div>
              <div className="rc-detail-item">
                <label>Manufacturing Year</label>
                <span className="rc-detail-value">2025</span>
              </div>
              <div className="rc-detail-item">
                <label>Fuel Type</label>
                <span className="rc-detail-value">Electric</span>
              </div>
              <div className="rc-detail-item">
                <label>Chassis No</label>
                <span className="rc-detail-value rc-mono">
                  MAT6123EXFR2981234
                </span>
              </div>
              <div className="rc-detail-item">
                <label>Engine / Motor No</label>
                <span className="rc-detail-value rc-mono">EV-MX-0882741A</span>
              </div>
              <div className="rc-detail-item">
                <label>RTO Office</label>
                <span className="rc-detail-value">Pune West - MH-12</span>
              </div>
            </div>

            {/* Blockchain Section */}
            <div className="rc-blockchain-section">
              <h4 className="rc-blockchain-title">
                <span className="rc-blockchain-icon">🔗</span>
                BLOCKCHAIN RECORD
              </h4>
              <div className="rc-blockchain-grid">
                <div className="rc-blockchain-item">
                  <label>Transaction Hash</label>
                  <div className="rc-hash">
                    <span className="rc-dot rc-dot-cyan"></span>
                    0x7a8ff3e19b8d7a8f5cb19d8a7f5cb19d8a7f5cb19d8a7f5cb19d8a7f5cb19d8a
                  </div>
                </div>
                <div className="rc-blockchain-item">
                  <label>IPFS Document Hash</label>
                  <div className="rc-hash rc-hash-green">
                    <span className="rc-dot rc-dot-green"></span>
                    QmX5b7f3a9c8d2e1b4f6a7c9d8e2f1a3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2e4f6
                  </div>
                </div>
                <div className="rc-blockchain-item">
                  <label>Biometric Credential</label>
                  <div className="rc-hash rc-hash-purple">
                    <span className="rc-dot rc-dot-purple"></span>
                    0x9f3a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate Footer */}
            <div className="rc-footer">
              <div className="rc-footer-left">
                <div className="rc-qr-placeholder">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <rect
                      x="5"
                      y="5"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#00D4FF"
                      strokeWidth="2"
                    />
                    <rect x="10" y="10" width="10" height="10" fill="#00D4FF" />
                    <rect
                      x="35"
                      y="5"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#00D4FF"
                      strokeWidth="2"
                    />
                    <rect x="40" y="10" width="10" height="10" fill="#00D4FF" />
                    <rect
                      x="5"
                      y="35"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#00D4FF"
                      strokeWidth="2"
                    />
                    <rect x="10" y="40" width="10" height="10" fill="#00D4FF" />
                    <rect x="35" y="35" width="5" height="5" fill="#00D4FF" />
                    <rect x="45" y="35" width="5" height="5" fill="#00D4FF" />
                    <rect x="35" y="45" width="5" height="5" fill="#00D4FF" />
                    <rect x="50" y="40" width="5" height="10" fill="#00D4FF" />
                  </svg>
                </div>
                <span className="rc-qr-label">Scan to Verify on Polygon</span>
              </div>
              <div className="rc-footer-center">
                <span className="rc-authenticated-text">
                  BIOMETRICALLY AUTHENTICATED BY
                </span>
                <span className="rc-officer-name">ANAND KUMAR</span>
                <span className="rc-officer-details">
                  RTO Officer • MH-12 Pune West
                </span>
                <span className="rc-officer-details">
                  Digital Signature: 0x7a8f...e434
                </span>
              </div>
              <div className="rc-footer-right">
                <div className="rc-seal">
                  <span className="rc-seal-text">✓</span>
                  <span className="rc-seal-subtext">VERIFIED</span>
                </div>
                <span className="rc-chain">POLYGON MAINNET</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h3 className="section-title centered">PLATFORM FEATURES</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <BiometricIcon />
            </div>
            <h4>Biometric Authentication</h4>
            <p>
              Fingerprint-based identity verification before every transaction.
              Minutiae extraction with 1:N matching ensures no impersonation is
              possible.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BlockchainIcon />
            </div>
            <h4>Blockchain Ownership Records</h4>
            <p>
              All vehicle ownership data is written to Solidity smart contracts
              on Polygon. Immutable, transparent, and instantly auditable by
              authorized parties.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <StorageIcon />
            </div>
            <h4>Decentralized Document Storage</h4>
            <p>
              Vehicle RCs, insurance, PUC, and transfer forms are stored on IPFS
              via Pinata. Document hashes are linked to both MongoDB and
              blockchain.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <ContractIcon />
            </div>
            <h4>Smart Contract Transfers</h4>
            <p>
              Ownership hand sale and inheritance transfers are executed via
              smart contracts after dual biometric verification of both parties
              and RTO approval.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <ShieldIcon />
            </div>
            <h4>Stolen Vehicle Blocking</h4>
            <p>
              Theft reports instantly trigger on-chain blocking of the vehicle.
              Law enforcement can verify blacklisted status in real-time from
              any location.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <VerifyIcon />
            </div>
            <h4>Universal Verification</h4>
            <p>
              Any RTO officer or law enforcement agency can scan the RC's QR
              code to instantly verify ownership history, document authenticity,
              and chain of custody.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">⛓️</span>
              <div>
                <span className="logo-text">BioChain RTO</span>
                <p className="logo-tagline">
                  India's blockchain-powered vehicle registration authority.
                  Secure, transparent, tamper-resistant. Built on Polygon.
                </p>
              </div>
            </div>
            <div className="footer-tech">
              <span className="tech-badge">
                <span className="tech-dot polygon"></span>
                Polygon Mainnet
              </span>
              <span className="tech-badge">
                <span className="tech-dot ipfs"></span>
                IPFS + Pinata
              </span>
              <span className="tech-badge">
                <span className="tech-dot mongo"></span>
                MongoDB Atlas
              </span>
            </div>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h5>SERVICES</h5>
              <ul>
                <li>
                  <Link to="/register">New Vehicle Registration</Link>
                </li>
                <li>
                  <Link to="/transfer">Ownership Transfer</Link>
                </li>
                <li>
                  <Link to="/inheritance">Inheritance Processing</Link>
                </li>
                <li>
                  <Link to="/report">Report Vehicle Theft</Link>
                </li>
                <li>
                  <Link to="/verify">Verify Vehicle</Link>
                </li>
                <li>
                  <Link to="/documents">Document Upload (IPFS)</Link>
                </li>
                <li>
                  <Link to="/audit">Audit Trail</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>PORTALS</h5>
              <ul>
                <li>
                  <Link to="/login">Vehicle Owner Login</Link>
                </li>
                <li>
                  <Link to="/dealer">Dealer / Agent Portal</Link>
                </li>
                <li>
                  <Link to="/rto">RTO Officer Dashboard</Link>
                </li>
                <li>
                  <Link to="/police">Law Enforcement Access</Link>
                </li>
                <li>
                  <Link to="/admin">Admin Panel</Link>
                </li>
                <li>
                  <Link to="/api">API Documentation</Link>
                </li>
                <li>
                  <Link to="/sdk">Developer SDK</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>CONTACT & SUPPORT</h5>
              <div className="contact-item">
                <strong>HEADQUARTERS</strong>
                <p>
                  Ministry of Road Transport & Highways
                  <br />
                  Transport Bhavan, New Delhi — 110001
                </p>
              </div>
              <div className="contact-item">
                <strong>HELPLINE</strong>
                <p>
                  Toll Free: 1800 110 001
                  <br />
                  Mon - Sat: 9AM - 6PM IST
                </p>
              </div>
              <div className="contact-item">
                <strong>EMAIL SUPPORT</strong>
                <p>support@biochain-rto.gov.in</p>
              </div>
              <div className="contact-item">
                <strong>BLOCKCHAIN EXPLORER</strong>
                <p>polygonscan.com/address/0x7f3c...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-legal">
            <p>
              © 2025 BioChain RTO Authority • Ministry of Road Transport &
              Highways, Government of India
            </p>
            <p>
              All vehicle records and ownership data stored on-chain via Polygon
              Blockchain. Smart contracts audited by CertiK.
            </p>
          </div>
          <div className="footer-legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/blockchain">Blockchain Notice</Link>
            <Link to="/rti">RTI</Link>
            <Link to="/sitemap">Sitemap</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
