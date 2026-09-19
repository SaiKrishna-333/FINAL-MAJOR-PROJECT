import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";

interface Challan {
  _id: string;
  vehicle: {
    _id: string;
    regNumber: string;
    make: string;
    model: string;
  };
  regNumber: string;
  violationType: string;
  violationDescription: string;
  location: string;
  violationDate: string;
  fineAmount: number;
  penaltyPoints: number;
  paymentStatus: "pending" | "paid" | "partial";
  paidAmount: number;
  status: "active" | "cancelled" | "disputed";
  issuingOfficer: string;
  officerName: string;
  createdAt: string;
}

export default function ChallanManagement() {
  const { api } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: "",
    regNumber: "",
    violationType: "speeding",
    violationDescription: "",
    location: "",
    violationDate: new Date().toISOString().split("T")[0],
    fineAmount: 0,
    penaltyPoints: 0,
    remarks: "",
  });

  const fetchMyChallans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/challans/my-challans");
      setChallans(res.data);
    } catch (err: unknown) {
      console.error("Error fetching challans:", err);
      alert("Failed to load challans");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchMyChallans();
  }, [fetchMyChallans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== SUBMITTING CHALLAN ===");
    console.log("Form data:", formData);

    try {
      const response = await api.post("/challans/create", formData);
      console.log("Response:", response);
      alert("Challan created successfully!");
      setShowForm(false);
      setFormData({
        vehicleId: "",
        regNumber: "",
        violationType: "speeding",
        violationDescription: "",
        location: "",
        violationDate: new Date().toISOString().split("T")[0],
        fineAmount: 0,
        penaltyPoints: 0,
        remarks: "",
      });
      fetchMyChallans();
    } catch (err: unknown) {
      console.error("Full error:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
      // Try to get error response data
      if (err instanceof Error && "response" in err) {
        const axiosErr = err as {
          response?: { data?: unknown; status?: number };
        };
        console.error("Response data:", axiosErr.response?.data);
        console.error("Status:", axiosErr.response?.status);
      }
      const msg =
        err instanceof Error ? err.message : "Failed to create challan";
      alert(msg);
    }
  };

  const handleCancelChallan = async (challanId: string) => {
    if (!confirm("Are you sure you want to cancel this challan?")) return;

    try {
      await api.put(`/challans/${challanId}/status`, { status: "cancelled" });
      alert("Challan cancelled");
      fetchMyChallans();
    } catch {
      alert("Failed to cancel challan");
    }
  };

  const getViolationLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      speeding: "Speeding",
      red_light: "Red Light Violation",
      no_helmet: "No Helmet",
      no_seatbelt: "No Seatbelt",
      drunk_driving: "Drunk Driving",
      overloading: "Overloading",
      no_insurance: "No Insurance",
      no_puc: "No PUC Certificate",
      illegal_parking: "Illegal Parking",
      wrong_lane: "Wrong Lane",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (status === "cancelled") return "Cancelled";
    if (status === "disputed") return "Disputed";
    if (paymentStatus === "paid") return "Paid ✓";
    if (paymentStatus === "partial") return "Partial";
    return "Pending";
  };

  const getStatusClass = (status: string, paymentStatus: string) => {
    if (status === "cancelled") return "role-police";
    if (status === "disputed") return "role-owner";
    if (paymentStatus === "paid") return "role-rto";
    return "role-dealer";
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3>Traffic Challan Management</h3>
        <button className="btn btn-success" onClick={() => setShowForm(true)}>
          + Create New Challan
        </button>
      </div>

      {/* Create Challan Form */}
      {showForm && (
        <div className="card">
          <h4>Create Traffic Challan</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Vehicle Registration Number *</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) =>
                  setFormData({ ...formData, regNumber: e.target.value })
                }
                placeholder="KA01AB1234"
                required
              />
              <small>Enter vehicle registration number</small>
            </div>

            <div className="form-group">
              <label>Violation Type *</label>
              <select
                value={formData.violationType}
                onChange={(e) =>
                  setFormData({ ...formData, violationType: e.target.value })
                }
                required
              >
                <option value="speeding">Speeding</option>
                <option value="red_light">Red Light Violation</option>
                <option value="no_helmet">No Helmet</option>
                <option value="no_seatbelt">No Seatbelt</option>
                <option value="drunk_driving">Drunk Driving</option>
                <option value="overloading">Overloading</option>
                <option value="no_insurance">No Insurance</option>
                <option value="no_puc">No PUC Certificate</option>
                <option value="illegal_parking">Illegal Parking</option>
                <option value="wrong_lane">Wrong Lane</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Violation Description *</label>
              <textarea
                value={formData.violationDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    violationDescription: e.target.value,
                  })
                }
                placeholder="Describe the violation..."
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Where did the violation occur?"
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Violation *</label>
              <input
                type="date"
                value={formData.violationDate}
                onChange={(e) =>
                  setFormData({ ...formData, violationDate: e.target.value })
                }
                required
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div className="form-group">
                <label>Fine Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.fineAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fineAmount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="500"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Penalty Points</label>
                <input
                  type="number"
                  value={formData.penaltyPoints}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      penaltyPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Remarks (Optional)</label>
              <textarea
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn btn-success">
                Create Challan
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Challans List */}
      <div className="card">
        <h4>My Issued Challans</h4>
        {loading ? (
          <p>Loading challans...</p>
        ) : challans.length === 0 ? (
          <p>No challans issued yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Violation</th>
                  <th>Date</th>
                  <th>Fine</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr key={challan._id}>
                    <td>
                      <strong>{challan.regNumber}</strong>
                      <br />
                      <small>
                        {challan.vehicle?.make} {challan.vehicle?.model}
                      </small>
                    </td>
                    <td>
                      <strong>
                        {getViolationLabel(challan.violationType)}
                      </strong>
                      <br />
                      <small>
                        {challan.violationDescription.substring(0, 50)}...
                      </small>
                    </td>
                    <td>
                      {new Date(challan.violationDate).toLocaleDateString()}
                    </td>
                    <td>₹ {challan.fineAmount.toLocaleString()}</td>
                    <td>
                      <span
                        className={`role-badge ${getStatusClass(
                          challan.status,
                          challan.paymentStatus
                        )}`}
                      >
                        {getStatusBadge(challan.status, challan.paymentStatus)}
                      </span>
                    </td>
                    <td>
                      {challan.paymentStatus === "pending" &&
                        challan.status === "active" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleCancelChallan(challan._id)}
                          >
                            Cancel
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
