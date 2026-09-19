import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";

interface RCCertificateProps {
  vehicle: {
    regNumber: string;
    chassisNumber: string;
    engineNumber: string;
    make: string;
    model: string;
    year: number;
    fuelType?: string;
    vehicleClass?: string;
    color?: string;
    seatingCapacity?: number;
    status?: string;
  };
  owner: {
    name: string;
    address: string;
    aadhaarNumber?: string;
  };
  registrationDate: string;
  validUpto: string;
  rtoOffice: string;
  blockchainTxHash?: string;
  insuranceValidUpto?: string;
  pucValidUpto?: string;
  fitnessValidUpto?: string;
  ipfsHash?: string;
  biometricHash?: string;
  transferType?: "new" | "second-hand" | "inheritance";
}

export default function RCCertificate({
  vehicle,
  owner,
  registrationDate,
  validUpto,
  rtoOffice,
  blockchainTxHash,
  ipfsHash,
  biometricHash,
  transferType = "new",
}: RCCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `RC_${vehicle.regNumber}`,
  });

  // Generate QR code data with all vehicle details
  const qrData = JSON.stringify({
    regNumber: vehicle.regNumber,
    chassisNumber: vehicle.chassisNumber,
    engineNumber: vehicle.engineNumber,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    owner: owner.name,
    registrationDate,
    validUpto,
    blockchainTxHash: blockchainTxHash || "PENDING",
    status: blockchainTxHash ? "VERIFIED" : "PENDING_BLOCKCHAIN",
  });

  const getTransferTypeLabel = () => {
    switch (transferType) {
      case "new":
        return "First Ownership - Vehicle Purchase";
      case "second-hand":
        return "Second Hand Sale - Ownership Transfer";
      case "inheritance":
        return "Inheritance Transfer - Legal Heir";
      default:
        return "First Ownership - Vehicle Purchase";
    }
  };

  const getTransferTypeBadge = () => {
    switch (transferType) {
      case "new":
        return { text: "New Registration", class: "rc-badge-new" };
      case "second-hand":
        return { text: "Second-Hand Sale", class: "rc-badge-resale" };
      case "inheritance":
        return { text: "Inheritance", class: "rc-badge-inheritance" };
      default:
        return { text: "New Registration", class: "rc-badge-new" };
    }
  };

  const badge = getTransferTypeBadge();

  return (
    <div className="rc-certificate-wrapper">
      {/* Action Buttons */}
      <div className="rc-actions">
        <button className="btn btn-primary" onClick={handlePrint}>
          Download / Print RC
        </button>
        {blockchainTxHash &&
          blockchainTxHash !== "0x0" &&
          blockchainTxHash !== "" && (
            <button
              className="btn btn-info"
              onClick={() => {
                const url = `https://amoy.polygonscan.com/tx/${blockchainTxHash}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              View Blockchain
            </button>
          )}
      </div>

      {/* RC Certificate - Sovereign Dark Theme */}
      <div ref={printRef} className="rc-certificate">
        {/* Government Header */}
        <div className="rc-header">
          <div className="rc-header-left">
            <div className="rc-emblem">IN</div>
            <div className="rc-header-text">
              <div className="rc-gov-label">GOVERNMENT OF INDIA</div>
              <div className="rc-ministry">
                Ministry of Road Transport & Highways
              </div>
            </div>
          </div>
          <div className="rc-header-right">
            <span className={badge.class}>{badge.text}</span>
          </div>
        </div>

        {/* Certificate Title Section */}
        <div className="rc-title-section">
          <div className="rc-title-left">
            <div className="rc-lock-icon">🔒</div>
            <div className="rc-title-text">
              <div className="rc-authority">
                BIOCHAIN RTO AUTHORITY · BLOCKCHAIN ISSUED
              </div>
              <h2 className="rc-title">Registration Certificate</h2>
              <div className="rc-subtitle">{getTransferTypeLabel()}</div>
            </div>
          </div>
          <div className="rc-title-right">
            <span className="rc-status-active">Active</span>
            <div className="rc-validity">Valid Lifetime</div>
          </div>
        </div>

        {/* Registration Number */}
        <div className="rc-reg-section">
          <span className="rc-reg-label">REG#</span>
          <span className="rc-reg-number">{vehicle.regNumber}</span>
        </div>

        {/* Vehicle & Owner Details Grid */}
        <div className="rc-details-grid">
          <div className="rc-detail-item">
            <label>OWNER NAME</label>
            <span className="rc-detail-value">{owner.name}</span>
          </div>
          <div className="rc-detail-item">
            <label>AADHAAR (MASKED)</label>
            <span className="rc-detail-value rc-mono">
              {owner.aadhaarNumber
                ? `XXXX-XXXX-${owner.aadhaarNumber.slice(-4)}`
                : "XXXX-XXXX-7821"}
            </span>
          </div>
          <div className="rc-detail-item">
            <label>ISSUE DATE</label>
            <span className="rc-detail-value">
              {registrationDate
                ? new Date(registrationDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "14 Mar 2025"}
            </span>
          </div>

          <div className="rc-detail-item">
            <label>MAKE / MODEL</label>
            <span className="rc-detail-value">
              {vehicle.make} {vehicle.model}
            </span>
          </div>
          <div className="rc-detail-item">
            <label>YEAR OF MANUFACTURE</label>
            <span className="rc-detail-value">{vehicle.year}</span>
          </div>
          <div className="rc-detail-item">
            <label>ENGINE / MOTOR NO.</label>
            <span className="rc-detail-value rc-mono">
              {vehicle.engineNumber || "EV-NX-0082741A"}
            </span>
          </div>

          <div className="rc-detail-item">
            <label>CHASSIS NUMBER</label>
            <span className="rc-detail-value rc-mono">
              {vehicle.chassisNumber || "MAT612EX3P2001234"}
            </span>
          </div>
          <div className="rc-detail-item">
            <label>FUEL TYPE</label>
            <span className="rc-detail-value">
              {vehicle.fuelType || "Electric"}
            </span>
          </div>
          <div className="rc-detail-item">
            <label>RTO OFFICE</label>
            <span className="rc-detail-value">{rtoOffice}</span>
          </div>
        </div>

        {/* Blockchain Record Section */}
        <div className="rc-blockchain-section">
          <h4 className="rc-blockchain-title">
            <span className="rc-blockchain-icon">⚛</span>
            BLOCKCHAIN RECORD
          </h4>
          <div className="rc-blockchain-grid">
            {blockchainTxHash && blockchainTxHash !== "0x0" && (
              <div className="rc-blockchain-item">
                <label>TRANSACTION HASH</label>
                <span className="rc-hash">
                  <span className="rc-dot rc-dot-cyan"></span>
                  {blockchainTxHash}
                </span>
              </div>
            )}
            {ipfsHash && (
              <div className="rc-blockchain-item">
                <label>IPFS DOCUMENT HASH (RC + INVOICE)</label>
                <span className="rc-hash rc-hash-green">
                  <span className="rc-dot rc-dot-green"></span>
                  {ipfsHash}
                </span>
              </div>
            )}
            {biometricHash && (
              <div className="rc-blockchain-item">
                <label>BIOMETRIC AUTH HASH (OWNER)</label>
                <span className="rc-hash rc-hash-purple">
                  <span className="rc-dot rc-dot-purple"></span>
                  {biometricHash}
                </span>
              </div>
            )}
            {!blockchainTxHash && (
              <div className="rc-blockchain-item">
                <label>TRANSACTION HASH</label>
                <span className="rc-hash" style={{ color: "#ff9933" }}>
                  <span
                    className="rc-dot rc-dot-cyan"
                    style={{ background: "#ff9933" }}
                  ></span>
                  PENDING - Blockchain sync in progress...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Section */}
        <div className="rc-footer">
          <div className="rc-footer-left">
            <div className="rc-qr-placeholder">
              <QRCodeSVG value={qrData} size={80} level="H" />
            </div>
            <div className="rc-qr-label">Scan to verify on-chain</div>
          </div>
          <div className="rc-footer-center">
            <div className="rc-authenticated-text">
              Fingerprint authenticated by
            </div>
            <div className="rc-officer-name">RTO OFFICER</div>
            <div className="rc-officer-details">Anand Kumar · MH-12</div>
          </div>
          <div className="rc-footer-right">
            <div className="rc-seal">
              <div className="rc-seal-text">RTO</div>
              <div className="rc-seal-subtext">DIGITALLY SEALED</div>
            </div>
            <div className="rc-chain">POLYGON CHAIN</div>
          </div>
        </div>
      </div>
    </div>
  );
}
