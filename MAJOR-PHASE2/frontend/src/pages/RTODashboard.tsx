import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

import type {
  TransferRequest,
  InheritanceRequest,
  TheftReportAdmin,
} from "../types/api";

export default function RTODashboard() {
  const { logout, api } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [inheritanceRequests, setInheritanceRequests] = useState<
    InheritanceRequest[]
  >([]);
  const [theftReports, setTheftReports] = useState<TheftReportAdmin[]>([]);
  const [regNumber, setRegNumber] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [approvedTxHashes, setApprovedTxHashes] = useState<{
    [key: string]: string;
  }>({});
  const [inheritanceTxHashes, setInheritanceTxHashes] = useState<{
    [key: string]: string;
  }>({});
  const [theftTxHashes, setTheftTxHashes] = useState<{
    [key: string]: string;
  }>({});

  const fetchAllData = useCallback(async () => {
    try {
      const reqRes = await api.get("/requests/all");
      setRequests(reqRes.data);

      const inhRes = await api.get("/inheritance/requests");
      setInheritanceRequests(inhRes.data);

      const theftRes = await api.get("/theft/reports");
      setTheftReports(theftRes.data);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [api]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchAllData();
    };
    fetchData();
  }, [fetchAllData]);

  const handleApprove = async (id: string) => {
    try {
      const response = await api.post(`/requests/${id}/approve`, { regNumber });
      alert("Request approved!");
      setRegNumber("");

      // Capture transaction hash if returned
      if (response.data.txHash) {
        setApprovedTxHashes({
          ...approvedTxHashes,
          [id]: response.data.txHash,
        });
      }

      fetchAllData();
    } catch (err: unknown) {
      console.error("Error approving request:", err);
      alert("Error approving request");
    }
  };

  const handleReject = async (id: string, remarks: string) => {
    try {
      await api.post(`/requests/${id}/reject`, { remarks });
      fetchAllData();
    } catch (err: unknown) {
      console.error("Error rejecting request:", err);
      alert("Error rejecting request");
    }
  };

  const handleInheritanceDocumentVerify = async (id: string) => {
    try {
      await api.put(`/inheritance/requests/${id}/verify-documents`, {
        documentVerifications: [],
        remarks: "Documents verified by RTO officer",
      });
      fetchAllData();
    } catch (err: unknown) {
      console.error("Error verifying documents:", err);
      alert("Error verifying documents");
    }
  };

  const handleInheritanceApprove = async (id: string) => {
    try {
      const response = await api.put(`/inheritance/requests/${id}/approve`, {
        regNumber,
      });
      setRegNumber("");

      // Capture transaction hash if returned
      if (response.data.txHash) {
        setInheritanceTxHashes({
          ...inheritanceTxHashes,
          [id]: response.data.txHash,
        });
      }

      alert("Inheritance transfer approved!");
      fetchAllData();
    } catch (err: unknown) {
      console.error("Error approving inheritance transfer:", err);
      alert("Error approving inheritance transfer");
    }
  };

  const handleInheritanceReject = async (id: string, remarks: string) => {
    try {
      await api.put(`/inheritance/requests/${id}/reject`, { remarks });
      fetchAllData();
    } catch (err: unknown) {
      console.error("Error rejecting inheritance transfer:", err);
      alert("Error rejecting inheritance transfer");
    }
  };

  const handleTheftStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await api.put(`/theft/reports/${id}`, { status });

      // Capture transaction hash if marking as recovered
      if (status === "recovered" && response.data.txHash) {
        setTheftTxHashes({ ...theftTxHashes, [id]: response.data.txHash });
      }

      fetchAllData();
    } catch (err: unknown) {
      console.error("Error updating theft report status:", err);
      alert("Error updating theft report status");
    }
  };

  return (
    <div className="container">
      <div className="navbar">
        <div className="container">
          <h2>BioChain RTO - RTO Dashboard</h2>
          <div className="nav-links">
            <span className="role-badge role-rto">RTO OFFICER</span>
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
        <h3>Administrative Dashboard</h3>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Transfer Requests
          </button>
          <button
            className={`tab-btn ${activeTab === "inheritance" ? "active" : ""}`}
            onClick={() => setActiveTab("inheritance")}
          >
            Inheritance Transfers
          </button>
          <button
            className={`tab-btn ${activeTab === "theft" ? "active" : ""}`}
            onClick={() => setActiveTab("theft")}
          >
            Theft Reports
          </button>
        </div>

        {/* Transfer Requests Tab */}
        {activeTab === "requests" && (
          <div>
            <h4>Pending Transfer Requests</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Vehicle</th>
                  <th>Seller</th>
                  <th>Buyer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.type}</td>
                    <td>
                      {req.vehicle?.make} {req.vehicle?.model} (
                      {req.vehicle?.regNumber || "N/A"})
                    </td>
                    <td>{req.seller?.name || req.dealer?.name}</td>
                    <td>{req.buyer?.name}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          req.status === "approved"
                            ? "role-rto"
                            : req.status === "rejected"
                            ? "role-police"
                            : "role-owner"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === "pending" && (
                        <>
                          {req.type === "newRegistration" && (
                            <>
                              <button
                                className="btn btn-info"
                                onClick={() => navigate(`/invoice/${req._id}`)}
                                style={{ marginRight: "8px" }}
                              >
                                📄 View Invoice
                              </button>
                              <input
                                type="text"
                                placeholder="Reg Number"
                                value={regNumber}
                                onChange={(e) => setRegNumber(e.target.value)}
                                style={{ width: "120px", marginRight: "10px" }}
                              />
                            </>
                          )}
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(req._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ marginLeft: "5px" }}
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason) handleReject(req._id, reason);
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === "approved" && req.vehicle?._id && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            className="btn btn-info"
                            onClick={() =>
                              navigate(`/rc-card/${req.vehicle?._id}`)
                            }
                            style={{ display: "inline-flex" }}
                          >
                            📄 RC Certificate
                          </button>
                          {req.vehicle.blockchainTxHash ? (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${req.vehicle.blockchainTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          ) : req.status === "approved" ? (
                            <span
                              style={{
                                padding: "8px 16px",
                                background: "#ff9800",
                                color: "white",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                              title="Blockchain transaction pending - will be created when next available"
                            >
                              ⚠️ Blockchain Pending
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inheritance Transfers Tab */}
        {activeTab === "inheritance" && (
          <div>
            <h4>Inheritance Transfer Requests</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Deceased Owner</th>
                  <th>Legal Heir</th>
                  <th>Death Cert</th>
                  <th>Relationship</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inheritanceRequests.map((req) => (
                  <tr key={req._id}>
                    <td>
                      {req.vehicle?.regNumber || "N/A"} <br />{" "}
                      {req.vehicle?.make} {req.vehicle?.model}
                    </td>
                    <td>{req.deceasedOwner?.name}</td>
                    <td>{req.legalHeir?.name}</td>
                    <td>{req.deathCertificateNumber}</td>
                    <td>{req.relationshipToDeceased}</td>
                    <td>
                      <span
                        className={`role-badge ${
                          req.status === "approved"
                            ? "role-rto"
                            : req.status === "rejected"
                            ? "role-police"
                            : "role-owner"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === "submitted" && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              handleInheritanceDocumentVerify(req._id)
                            }
                            style={{ display: "inline-flex" }}
                          >
                            Verify Docs
                          </button>
                          {(req.vehicle?.blockchainTxHash ||
                            inheritanceTxHashes[req._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                req.vehicle?.blockchainTxHash ||
                                inheritanceTxHashes[req._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                      {req.status === "documents_verified" && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Reg Number"
                            value={regNumber}
                            onChange={(e) => setRegNumber(e.target.value)}
                            style={{ width: "120px" }}
                          />
                          <button
                            className="btn btn-success"
                            onClick={() => handleInheritanceApprove(req._id)}
                            style={{ display: "inline-flex" }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const reason = prompt("Rejection reason:");
                              if (reason)
                                handleInheritanceReject(req._id, reason);
                            }}
                            style={{ display: "inline-flex" }}
                          >
                            Reject
                          </button>
                          {(req.vehicle?.blockchainTxHash ||
                            inheritanceTxHashes[req._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                req.vehicle?.blockchainTxHash ||
                                inheritanceTxHashes[req._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                      {req.status === "approved" && req.vehicle?._id && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            className="btn btn-info"
                            onClick={() =>
                              navigate(`/rc-card/${req.vehicle?._id}`)
                            }
                            style={{ display: "inline-flex" }}
                          >
                            📄 RC Certificate
                          </button>
                          {(req.vehicle.blockchainTxHash ||
                            inheritanceTxHashes[req._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                req.vehicle.blockchainTxHash ||
                                inheritanceTxHashes[req._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Theft Reports Tab */}
        {activeTab === "theft" && (
          <div>
            <h4>Active Theft Reports</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Reporter</th>
                  <th>Police Station</th>
                  <th>FIR Number</th>
                  <th>Incident Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {theftReports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      {report.vehicle?.regNumber || "N/A"} <br />{" "}
                      {report.vehicle?.make} {report.vehicle?.model}
                    </td>
                    <td>{report.reporter?.name}</td>
                    <td>{report.policeStation}</td>
                    <td>{report.firNumber}</td>
                    <td>
                      {new Date(report.incidentDate).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        className={`role-badge ${
                          report.status === "recovered"
                            ? "role-rto"
                            : report.status === "closed"
                            ? "role-owner"
                            : "role-police"
                        }`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td>
                      {report.status === "reported" && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <select
                            onChange={(e) =>
                              handleTheftStatusUpdate(
                                report._id,
                                e.target.value
                              )
                            }
                            defaultValue=""
                            style={{ width: "120px" }}
                          >
                            <option value="" disabled>
                              Select Action
                            </option>
                            <option value="under_investigation">
                              Under Investigation
                            </option>
                            <option value="recovered">Mark as Recovered</option>
                            <option value="closed">Close Case</option>
                          </select>
                          {(report.vehicle?.blockchainTxHash ||
                            theftTxHashes[report._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                report.vehicle?.blockchainTxHash ||
                                theftTxHashes[report._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                      {report.status === "under_investigation" && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <select
                            onChange={(e) =>
                              handleTheftStatusUpdate(
                                report._id,
                                e.target.value
                              )
                            }
                            defaultValue=""
                            style={{ width: "120px" }}
                          >
                            <option value="" disabled>
                              Select Action
                            </option>
                            <option value="recovered">Mark as Recovered</option>
                            <option value="closed">Close Case</option>
                          </select>
                          {(report.vehicle?.blockchainTxHash ||
                            theftTxHashes[report._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                report.vehicle?.blockchainTxHash ||
                                theftTxHashes[report._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                      {report.status === "recovered" && report.vehicle?._id && (
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            gap: "8px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            className="btn btn-info"
                            onClick={() =>
                              navigate(`/rc-card/${report.vehicle?._id}`)
                            }
                            style={{ display: "inline-flex" }}
                          >
                            📄 RC Certificate
                          </button>
                          {(report.vehicle.blockchainTxHash ||
                            theftTxHashes[report._id]) && (
                            <a
                              href={`https://amoy.polygonscan.com/tx/${
                                report.vehicle.blockchainTxHash ||
                                theftTxHashes[report._id]
                              }`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-info"
                              style={{
                                textDecoration: "none",
                                display: "inline-flex",
                              }}
                            >
                              🔗 View Blockchain Tx
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <footer className="dashboard-footer">
        <p>© 2026 BioChain RTO System • Digital India Initiative</p>
      </footer>
    </div>
  );
}
