import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import ChallanManagement from "../components/ChallanManagement";
import ProfileButton from "../components/ProfileButton";

import type {
  QuickVerifyResult,
  DetailedVehicleResult,
  PersonVerifyResult,
  TheftReportAdmin,
} from "../types/api";

export default function PoliceDashboard() {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  const [regNumber, setRegNumber] = useState("");
  const [aadhaarOrDl, setAadhaarOrDl] = useState("");
  type VerificationResult =
    | QuickVerifyResult
    | DetailedVehicleResult
    | PersonVerifyResult
    | null;

  const [result, setResult] = useState<VerificationResult>(null);
  const [activeTab, setActiveTab] = useState("quickVerify"); // 'quickVerify', 'detailedVerify', 'personVerify', 'privacyVerify', 'theftReports', 'challans', 'profile'
  const [theftReports, setTheftReports] = useState<TheftReportAdmin[]>([]);
  const [recoveryData, setRecoveryData] = useState<{
    [key: string]: {
      recoveryDate?: string;
      recoveryLocation?: string;
      remarks?: string;
    };
  }>({});
  const [showRecoveryModal, setShowRecoveryModal] = useState<string | null>(
    null,
  );

  // Privacy verification state
  const [privacyRegNumber, setPrivacyRegNumber] = useState("");
  const [privacyResult, setPrivacyResult] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    aadhaarNumber: "",
    dlNumber: "",
    badgeNumber: "",
  });

  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/verification/quick-verify", {
        identifier: regNumber,
      });
      setResult(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      alert(msg);
    }
  };

  const handleDetailedVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(`/verification/vehicle/${regNumber}`);
      setResult(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      alert(msg);
    }
  };

  const handlePersonVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(`/verification/person/${aadhaarOrDl}`);
      setResult(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      alert(msg);
    }
  };

  // Handle Privacy-Preserving Verification
  const handlePrivacyVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(
        `/patent/privacy/verify-by-reg/${privacyRegNumber}`,
      );
      setPrivacyResult(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      alert(msg);
      setPrivacyResult(null);
    }
  };

  const fetchTheftReports = async () => {
    try {
      const res = await api.get("/theft/reports");
      setTheftReports(res.data);
    } catch (err: unknown) {
      console.error("Failed to fetch theft reports:", err);
    }
  };

  const handleMarkRecovered = async (reportId: string) => {
    try {
      const recoveryInfo = recoveryData[reportId] || {};
      await api.put(`/theft/reports/${reportId}/recover`, {
        recoveryDate:
          recoveryInfo.recoveryDate || new Date().toISOString().split("T")[0],
        recoveryLocation: recoveryInfo.recoveryLocation,
        remarks: recoveryInfo.remarks,
      });
      alert("Vehicle marked as recovered successfully!");
      setShowRecoveryModal(null);
      fetchTheftReports(); // Refresh list
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to mark as recovered";
      alert(msg);
    }
  };

  const loadProfileData = () => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        aadhaarNumber: user.aadhaarNumber || "",
        dlNumber: user.dlNumber || "",
        badgeNumber: user.badgeNumber || "",
      });
    }
  };

  const [theftReportsLoaded, setTheftReportsLoaded] = useState(false);

  const handleTheftReportsTabClick = () => {
    setActiveTab("theftReports");
    if (!theftReportsLoaded) {
      fetchTheftReports();
      setTheftReportsLoaded(true);
    }
  };

  return (
    <div className="container">
      <div className="navbar">
        <div className="container">
          <h2>BioChain RTO - Police Dashboard</h2>
          <div className="nav-links">
            <span className="role-badge role-police">POLICE</span>
            <ProfileButton />
            <button
              className="btn btn-primary"
              onClick={() => navigate("/search")}
            >
              🔍 Search
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate("/analytics")}
            >
              📊 Analytics
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Real-time Vehicle Verification</h3>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "quickVerify" ? "active" : ""}`}
            onClick={() => setActiveTab("quickVerify")}
          >
            Quick Verify
          </button>
          <button
            className={`tab-btn ${
              activeTab === "detailedVerify" ? "active" : ""
            }`}
            onClick={() => setActiveTab("detailedVerify")}
          >
            Detailed Verify
          </button>
          <button
            className={`tab-btn ${
              activeTab === "personVerify" ? "active" : ""
            }`}
            onClick={() => setActiveTab("personVerify")}
          >
            Person Verify
          </button>
          <button
            className={`tab-btn ${
              activeTab === "privacyVerify" ? "active" : ""
            }`}
            onClick={() => setActiveTab("privacyVerify")}
          >
            🔒 Privacy Verify
          </button>
          <button
            className={`tab-btn ${
              activeTab === "theftReports" ? "active" : ""
            }`}
            onClick={handleTheftReportsTabClick}
          >
            Theft Reports
          </button>
          <button
            className={`tab-btn ${activeTab === "challans" ? "active" : ""}`}
            onClick={() => setActiveTab("challans")}
          >
            Traffic Challans
          </button>
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("profile");
              loadProfileData();
            }}
          >
            Profile
          </button>
        </div>

        {/* Quick Verify Form */}
        {activeTab === "quickVerify" && (
          <form onSubmit={handleQuickVerify}>
            <div className="form-group">
              <label>Registration Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="Enter vehicle registration number"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Quick Verify
            </button>
          </form>
        )}

        {/* Detailed Verify Form */}
        {activeTab === "detailedVerify" && (
          <form onSubmit={handleDetailedVerify}>
            <div className="form-group">
              <label>Registration Number</label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                placeholder="Enter vehicle registration number"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Detailed Verify
            </button>
          </form>
        )}

        {/* Person Verify Form */}
        {activeTab === "personVerify" && (
          <form onSubmit={handlePersonVerify}>
            <div className="form-group">
              <label>Aadhaar or DL Number</label>
              <input
                type="text"
                value={aadhaarOrDl}
                onChange={(e) => setAadhaarOrDl(e.target.value)}
                placeholder="Enter Aadhaar or Driving License number"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Verify Person
            </button>
          </form>
        )}

        {/* Privacy Verify Tab */}
        {activeTab === "privacyVerify" && (
          <div className="card" style={{ background: "#f8fafc" }}>
            <h3>🔒 Privacy-Preserving Verification</h3>
            <p style={{ color: "#666", marginBottom: "20px" }}>
              Verify vehicle ownership WITHOUT exposing personal data.
              GDPR-compliant verification.
            </p>
            <form onSubmit={handlePrivacyVerify}>
              <div className="form-group">
                <label>Vehicle Registration Number</label>
                <input
                  type="text"
                  value={privacyRegNumber}
                  onChange={(e) => setPrivacyRegNumber(e.target.value)}
                  placeholder="KA01AB1234"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                🔒 Verify (Privacy Mode)
              </button>
            </form>

            {privacyResult && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "#e8f5e9",
                  borderRadius: "8px",
                  border: "2px solid #4caf50",
                }}
              >
                <h4 style={{ color: "#2e7d32", marginBottom: "15px" }}>
                  ✅ Verification Result
                </h4>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      background: "white",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <strong style={{ color: "#666", fontSize: "12px" }}>
                      Ownership Status
                    </strong>
                    <p
                      style={{
                        color: "#4caf50",
                        fontWeight: "bold",
                        margin: "5px 0 0 0",
                      }}
                    >
                      {privacyResult.ownershipStatus || "VERIFIED_OWNER"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "white",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <strong style={{ color: "#666", fontSize: "12px" }}>
                      Owner DID
                    </strong>
                    <p
                      style={{
                        color: "#1976d2",
                        fontWeight: "bold",
                        margin: "5px 0 0 0",
                        fontSize: "12px",
                        wordBreak: "break-all",
                      }}
                    >
                      {privacyResult.ownerDID ||
                        privacyResult.did ||
                        "did:biochain:owner:..."}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "white",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <strong style={{ color: "#666", fontSize: "12px" }}>
                      Vehicle Status
                    </strong>
                    <p
                      style={{
                        color: "#4caf50",
                        fontWeight: "bold",
                        margin: "5px 0 0 0",
                      }}
                    >
                      {privacyResult.vehicleStatus ||
                        privacyResult.status ||
                        "ACTIVE"}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "white",
                      padding: "10px",
                      borderRadius: "5px",
                    }}
                  >
                    <strong style={{ color: "#666", fontSize: "12px" }}>
                      Registration
                    </strong>
                    <p
                      style={{
                        color: "#333",
                        fontWeight: "bold",
                        margin: "5px 0 0 0",
                      }}
                    >
                      {privacyResult.regNumber || "Verified"}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "15px",
                    padding: "10px",
                    background: "#fff3e0",
                    borderRadius: "5px",
                  }}
                >
                  <h5 style={{ color: "#e65100", marginBottom: "10px" }}>
                    ⚠️ NO Personal Data Exposed
                  </h5>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "5px",
                      fontSize: "14px",
                    }}
                  >
                    <span>❌ Name</span>
                    <span>❌ Address</span>
                    <span>❌ Phone Number</span>
                    <span>❌ Aadhaar</span>
                    <span>❌ Email</span>
                    <span>❌ DL Number</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theft Reports Tab */}
        {activeTab === "theftReports" && (
          <div>
            <h3>Theft Reports - Mark as Recovered</h3>
            {theftReports.length === 0 ? (
              <p
                style={{ color: "#666", textAlign: "center", padding: "20px" }}
              >
                No theft reports found.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>FIR No</th>
                    <th>Police Station</th>
                    <th>Theft Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {theftReports.map((report) => (
                    <tr key={report._id}>
                      <td>{report.vehicle?.regNumber || "N/A"}</td>
                      <td>{report.firNumber}</td>
                      <td>{report.policeStation}</td>
                      <td>
                        {new Date(report.incidentDate).toLocaleDateString()}
                      </td>
                      <td>
                        <span
                          className={`status-${
                            report.status === "recovered" ? "active" : "stolen"
                          }`}
                        >
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {report.status !== "recovered" ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              className="btn btn-success"
                              onClick={() => setShowRecoveryModal(report._id)}
                              title="Mark as Recovered"
                            >
                              ✅ Mark Recovered
                            </button>
                          </div>
                        ) : (
                          <span
                            className="status-active"
                            style={{ color: "#28a745", fontWeight: "bold" }}
                          >
                            ✓ RECOVERED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Results Display */}
      {result && (
        <div className="card">
          {activeTab === "quickVerify" && result && "regNumber" in result && (
            <div>
              <h3>Quick Verification Result</h3>
              <p>
                <strong>Registration No:</strong> {result.regNumber}
              </p>
              <p>
                <strong>Make & Model:</strong> {result.make} {result.model}
              </p>
              <p>
                <strong>Year:</strong> {result.year}
              </p>
              <p>
                <strong>Status:</strong>
                <span
                  className={
                    result.status === "active"
                      ? "status-active"
                      : "status-blocked"
                  }
                >
                  {result.status.toUpperCase()}
                </span>
              </p>
              <p>
                <strong>Stolen Status:</strong>
                <span
                  className={
                    result.isStolen ? "status-stolen" : "status-not-stolen"
                  }
                >
                  {result.isStolen ? "STOLEN" : "NOT STOLEN"}
                </span>
              </p>
              {result.currentOwner && (
                <p>
                  <strong>Current Owner:</strong> {result.currentOwner.name}
                </p>
              )}
            </div>
          )}

          {activeTab === "detailedVerify" &&
            result &&
            "chassisNumber" in result && (
              <div>
                <h3>Detailed Vehicle Information</h3>
                <div className="row">
                  <div className="col">
                    <p>
                      <strong>Registration No:</strong> {result.regNumber}
                    </p>
                    <p>
                      <strong>Chassis No:</strong> {result.chassisNumber}
                    </p>
                    <p>
                      <strong>Engine No:</strong> {result.engineNumber}
                    </p>
                    <p>
                      <strong>Make:</strong> {result.make}
                    </p>
                    <p>
                      <strong>Model:</strong> {result.model}
                    </p>
                    <p>
                      <strong>Year:</strong> {result.year}
                    </p>
                  </div>
                  <div className="col">
                    <p>
                      <strong>Status:</strong>
                      <span
                        className={
                          result.status === "active"
                            ? "status-active"
                            : "status-blocked"
                        }
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <strong>Stolen:</strong>
                      <span
                        className={
                          result.isStolen
                            ? "status-stolen"
                            : "status-not-stolen"
                        }
                      >
                        {result.isStolen ? "YES" : "NO"}
                      </span>
                    </p>
                    {result.theftReport && (
                      <div>
                        <p>
                          <strong>Theft Details:</strong>
                        </p>
                        <p> • Status: {result.theftReport.status}</p>
                        <p> • Station: {result.theftReport.policeStation}</p>
                        <p> • FIR: {result.theftReport.firNumber}</p>
                        <p>
                          {" "}
                          • Date:{" "}
                          {new Date(
                            result.theftReport.incidentDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {result.currentOwner && (
                  <div>
                    <h4>Current Owner</h4>
                    <p>
                      <strong>Name:</strong> {result.currentOwner.name}
                    </p>
                    <p>
                      <strong>Aadhaar:</strong>{" "}
                      {result.currentOwner.aadhaarNumber}
                    </p>
                    <p>
                      <strong>DL:</strong> {result.currentOwner.dlNumber}
                    </p>
                  </div>
                )}

                <h4 style={{ marginTop: "20px" }}>Ownership History</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Blockchain Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.ownershipHistory.map((record, index) => (
                      <tr key={index}>
                        <td>{record.from}</td>
                        <td>{record.to}</td>
                        <td>{record.transferType}</td>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          {record.blockchainTxHash
                            ? record.blockchainTxHash.substring(0, 10) + "..."
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 style={{ marginTop: "20px" }}>Blockchain Info</h4>
                <p>
                  <strong>Blockchain Owner:</strong>{" "}
                  {result.blockchainOwner
                    ? result.blockchainOwner.substring(0, 10) + "..."
                    : "Not available"}
                </p>
                <p>
                  <strong>Last Blockchain Tx:</strong>{" "}
                  {result.blockchainTxHash
                    ? result.blockchainTxHash.substring(0, 10) + "..."
                    : "None"}
                </p>
              </div>
            )}

          {activeTab === "personVerify" && result && "person" in result && (
            <div>
              <h3>Person Information</h3>
              <div className="row">
                <div className="col">
                  <p>
                    <strong>Name:</strong> {result.person.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.person.email}
                  </p>
                  <p>
                    <strong>Aadhaar:</strong> {result.person.aadhaarNumber}
                  </p>
                  <p>
                    <strong>DL:</strong> {result.person.dlNumber}
                  </p>
                  <p>
                    <strong>Role:</strong> {result.person.role}
                  </p>
                  <p>
                    <strong>Verification Status:</strong>{" "}
                    {result.person.verificationStatus}
                  </p>
                </div>
              </div>

              <h4 style={{ marginTop: "20px" }}>Owned Vehicles</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Make & Model</th>
                    <th>Year</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vehicles.map((v) => (
                    <tr key={v._id}>
                      <td>{v.regNumber}</td>
                      <td>
                        {v.make} {v.model}
                      </td>
                      <td>{v.year}</td>
                      <td>
                        <span
                          className={
                            v.status === "active"
                              ? "status-active"
                              : "status-blocked"
                          }
                        >
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 style={{ marginTop: "20px" }}>Ownership History</h4>
              {result.ownershipHistories.map((history, index) => (
                <div key={index} className="history-section">
                  <h5>Vehicle: {history.regNumber}</h5>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>From</th>
                        <th>To</th>
                        <th>Date</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.history.map((record, idx) => (
                        <tr key={idx}>
                          <td>{record.from}</td>
                          <td>{record.to}</td>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>{record.transferType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "profile" && (
        <div className="card">
          <h3>My Profile</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user) return;
              try {
                await api.put(`/auth/users/${user.id}`, profileData);
                alert("Profile updated successfully!");
              } catch (err: unknown) {
                const msg =
                  err instanceof Error
                    ? err.message
                    : "Failed to update profile";
                alert(msg);
              }
            }}
          >
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    required
                    disabled
                  />
                  <small style={{ color: "#666" }}>
                    Email cannot be changed
                  </small>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Enter your full address"
                  />
                </div>
                <div className="form-group">
                  <label>Aadhaar Number</label>
                  <input
                    type="text"
                    value={profileData.aadhaarNumber}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        aadhaarNumber: e.target.value,
                      })
                    }
                    placeholder="XXXX-XXXX-XXXX"
                    maxLength={12}
                  />
                </div>
                <div className="form-group">
                  <label>Driving License Number</label>
                  <input
                    type="text"
                    value={profileData.dlNumber}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        dlNumber: e.target.value,
                      })
                    }
                    placeholder="DL Number"
                  />
                </div>
                <div className="form-group">
                  <label>Badge Number (Police ID)</label>
                  <input
                    type="text"
                    value={profileData.badgeNumber}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        badgeNumber: e.target.value,
                      })
                    }
                    placeholder="Enter your badge number"
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </form>
        </div>
      )}

      {/* Challans Tab */}
      {activeTab === "challans" && (
        <div>
          <ChallanManagement />
        </div>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
          >
            <h3>Mark Vehicle as Recovered</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleMarkRecovered(showRecoveryModal);
              }}
            >
              <div className="form-group">
                <label>Recovery Date</label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setRecoveryData({
                      ...recoveryData,
                      [showRecoveryModal]: {
                        ...recoveryData[showRecoveryModal],
                        recoveryDate: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Recovery Location</label>
                <input
                  type="text"
                  placeholder="Enter recovery location"
                  onChange={(e) =>
                    setRecoveryData({
                      ...recoveryData,
                      [showRecoveryModal]: {
                        ...recoveryData[showRecoveryModal],
                        recoveryLocation: e.target.value,
                      },
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  placeholder="Enter any additional remarks"
                  rows={3}
                  onChange={(e) =>
                    setRecoveryData({
                      ...recoveryData,
                      [showRecoveryModal]: {
                        ...recoveryData[showRecoveryModal],
                        remarks: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="btn btn-success">
                  ✓ Mark as Recovered
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRecoveryModal(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>© 2026 BioChain RTO System • Digital India Initiative</p>
      </footer>
    </div>
  );
}
