import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import DualBiometricVerification from "../components/DualBiometricVerification";
import ProfileButton from "../components/ProfileButton";

export default function DealerDashboard() {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  interface Request {
    _id: string;
    vehicle?: {
      make: string;
      model: string;
      year: string;
    };
    buyer?: {
      name: string;
    };
    status: string;
    createdAt: string;
    // Add other properties as needed
  }

  const [requests, setRequests] = useState<Request[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(""); // "dealer-details" or "showroom-details"
  interface VerificationResult {
    regNumber: string;
    make: string;
    model: string;
    year: string;
    status: "active" | "blocked";
    isStolen: boolean;
    currentOwner?: { name: string };
    blockchainOwner?: string;
    blockchainTxHash?: string;
  }

  interface DealerDetails {
    businessName: string;
    gstin: string;
    tin: string;
    licenseNumber: string;
    showroomAddress: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    phone: string;
  }

  const [formData, setFormData] = useState({
    buyerEmail: "",
    vehicleDetails: {
      chassisNumber: "",
      engineNumber: "",
      make: "",
      model: "",
      year: "",
    },
    exShowroomPrice: 0,
    roadTax: 0,
    registrationFee: 500,
    insuranceAmount: 0,
    handlingCharges: 5000,
    otherCharges: 0,
    paymentMode: "Full Payment",
  });
  const [regNumber, setRegNumber] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState("actions"); // 'actions', 'verification'
  const [showBiometricVerification, setShowBiometricVerification] =
    useState(false);
  const [pendingRequest, setPendingRequest] = useState<{
    buyerEmail: string;
    vehicleDetails: {
      chassisNumber: string;
      engineNumber: string;
      make: string;
      model: string;
      year: string;
    };
    exShowroomPrice: number;
    roadTax: number;
    registrationFee: number;
    insuranceAmount: number;
    handlingCharges: number;
    otherCharges: number;
    paymentMode: string;
  } | null>(null);

  // Initialize dealer details from user context
  const initialDealerDetails = (): DealerDetails => {
    if (user?.dealerDetails) {
      return {
        businessName: user.dealerDetails.businessName || "",
        gstin: user.dealerDetails.gstin || "",
        tin: user.dealerDetails.tin || "",
        licenseNumber: user.dealerDetails.licenseNumber || "",
        showroomAddress: user.dealerDetails.showroomAddress || "",
        contactPerson: user.dealerDetails.contactPerson || "",
        contactPhone: user.dealerDetails.contactPhone || "",
        contactEmail: user.dealerDetails.contactEmail || "",
        phone: user.dealerDetails.phone || "",
      };
    }
    return {
      businessName: "",
      gstin: "",
      tin: "",
      licenseNumber: "",
      showroomAddress: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      phone: "",
    };
  };

  const [dealerDetails, setDealerDetails] =
    useState<DealerDetails>(initialDealerDetails);

  const handleVehicleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.get(`/verification/vehicle/${regNumber}`);
      setVerificationResult(res.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("Verification failed: " + errorMessage);
    }
  };

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const res = await api.get("/requests/my-requests");
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadRequests();
  }, [api, user]);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/requests/all");
      setRequests(
        res.data.filter(
          (r: { dealer?: { _id: string } }) => r.dealer?._id === user!.id,
        ),
      );
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleDealerDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setDealerDetails({
      ...dealerDetails,
      [name]: value,
    });
  };

  const handleSaveDealerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Updating dealer details...", dealerDetails);
      const response = await api.put("/auth/update-dealer-details", {
        dealerDetails,
      });
      console.log("Response:", response.data);

      // Update user context with new dealer details
      const updatedUser = {
        ...user!,
        dealerDetails: response.data.dealerDetails,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      alert("Dealer details updated successfully!");
      setShowForm(false);
      setFormType("");
      // Reload page to refresh user context
      window.location.reload();
    } catch (error: unknown) {
      console.error("Error updating dealer details:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update dealer details";
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const serverMessage = axiosError.response?.data?.message || errorMessage;
      alert(serverMessage);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name.includes("vehicleDetails")) {
      const field = name.split(".")[1];
      setFormData({
        ...formData,
        vehicleDetails: { ...formData.vehicleDetails, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Store the form data and show biometric verification
    setPendingRequest(formData);
    setShowBiometricVerification(true);
  };

  const handleBiometricSuccess = async () => {
    if (!pendingRequest) return;

    try {
      const response = await api.post(
        "/requests/new-registration",
        pendingRequest,
      );
      const { requestId, invoiceNumber } = response.data;

      // Show success with invoice link
      const viewInvoice = window.confirm(
        `Registration request submitted!\n\nInvoice: ${invoiceNumber}\n\nWould you like to view/print the invoice?`,
      );

      setShowForm(false);
      setFormType("");
      setShowBiometricVerification(false);
      setPendingRequest(null);
      setFormData({
        buyerEmail: "",
        vehicleDetails: {
          chassisNumber: "",
          engineNumber: "",
          make: "",
          model: "",
          year: "",
        },
        exShowroomPrice: 0,
        roadTax: 0,
        registrationFee: 500,
        insuranceAmount: 0,
        handlingCharges: 5000,
        otherCharges: 0,
        paymentMode: "Full Payment",
      });
      fetchRequests();

      if (viewInvoice && requestId) {
        navigate(`/invoice/${requestId}`);
      }
    } catch {
      alert("Error submitting request");
    }
  };

  return (
    <div className="container">
      <div className="navbar">
        <div className="container">
          <h2>BioChain RTO - Dealer Dashboard</h2>
          <div className="nav-links">
            <span className="role-badge role-dealer">DEALER</span>
            <ProfileButton />
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
        <h3>Dealer Dashboard</h3>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "actions" ? "active" : ""}`}
            onClick={() => setActiveTab("actions")}
          >
            Actions
          </button>
          <button
            className={`tab-btn ${
              activeTab === "verification" ? "active" : ""
            }`}
            onClick={() => setActiveTab("verification")}
          >
            Verify Vehicle
          </button>
        </div>

        {activeTab === "actions" && (
          <div>
            <h4>Choose Action</h4>
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFormType("dealer-details");
                  setShowForm(true);
                }}
              >
                Update Dealer Details
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  setFormType("showroom-details");
                  setShowForm(true);
                }}
              >
                Register New Vehicle
              </button>
            </div>

            {/* Dual Biometric Verification Modal */}
            <DualBiometricVerification
              isOpen={showBiometricVerification}
              onClose={() => {
                setShowBiometricVerification(false);
                setPendingRequest(null);
              }}
              onSuccess={handleBiometricSuccess}
              person1Name={user?.name || "Dealer"}
              person1Role="dealer"
              person2Name="Buyer"
              person2Role="owner"
              transactionType="vehicle-sale"
            />
          </div>
        )}

        {activeTab === "verification" && (
          <div>
            <h4>Vehicle Verification</h4>
            <form onSubmit={handleVehicleVerification}>
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
                Verify Vehicle
              </button>
            </form>

            {verificationResult && (
              <div className="history-section" style={{ marginTop: "20px" }}>
                <h5>Verification Result</h5>
                <p>
                  <strong>Registration No:</strong>{" "}
                  {verificationResult.regNumber}
                </p>
                <p>
                  <strong>Make & Model:</strong> {verificationResult.make}{" "}
                  {verificationResult.model}
                </p>
                <p>
                  <strong>Year:</strong> {verificationResult.year}
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    className={
                      verificationResult.status === "active"
                        ? "status-active"
                        : "status-blocked"
                    }
                  >
                    {verificationResult.status.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Stolen Status:</strong>
                  <span
                    className={
                      verificationResult.isStolen
                        ? "status-stolen"
                        : "status-not-stolen"
                    }
                  >
                    {verificationResult.isStolen ? "STOLEN" : "NOT STOLEN"}
                  </span>
                </p>
                {verificationResult.currentOwner && (
                  <p>
                    <strong>Current Owner:</strong>{" "}
                    {verificationResult.currentOwner.name}
                  </p>
                )}

                <h6 style={{ marginTop: "15px" }}>Blockchain Info</h6>
                <p>
                  <strong>Blockchain Owner:</strong>{" "}
                  {verificationResult.blockchainOwner
                    ? verificationResult.blockchainOwner.substring(0, 15) +
                      "..."
                    : "Not available"}
                </p>
                <p>
                  <strong>Last Blockchain Tx:</strong>{" "}
                  {verificationResult.blockchainTxHash
                    ? verificationResult.blockchainTxHash.substring(0, 15) +
                      "..."
                    : "None"}
                </p>
              </div>
            )}
          </div>
        )}

        {showForm && formType === "dealer-details" && (
          <form
            onSubmit={handleSaveDealerDetails}
            style={{ marginTop: "20px" }}
          >
            <h4>Dealer Details</h4>
            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={dealerDetails.businessName}
                onChange={handleDealerDetailsChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Business GSTIN</label>
              <input
                type="text"
                name="gstin"
                value={dealerDetails.gstin}
                onChange={handleDealerDetailsChange}
              />
            </div>
            <div className="form-group">
              <label>TIN Number</label>
              <input
                type="text"
                name="tin"
                value={dealerDetails.tin}
                onChange={handleDealerDetailsChange}
              />
            </div>
            <div className="form-group">
              <label>Showroom Address</label>
              <textarea
                name="showroomAddress"
                value={dealerDetails.showroomAddress}
                onChange={handleDealerDetailsChange}
                rows={3}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={dealerDetails.phone}
                onChange={handleDealerDetailsChange}
              />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={dealerDetails.licenseNumber}
                onChange={handleDealerDetailsChange}
              />
            </div>
            <button type="submit" className="btn btn-success">
              Save Dealer Details
            </button>
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        {showForm && formType === "showroom-details" && (
          <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
            <h4>Register New Vehicle</h4>
            <div className="form-group">
              <label>Buyer Email</label>
              <input
                type="email"
                name="buyerEmail"
                value={formData.buyerEmail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Chassis Number</label>
              <input
                type="text"
                name="vehicleDetails.chassisNumber"
                value={formData.vehicleDetails.chassisNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Engine Number</label>
              <input
                type="text"
                name="vehicleDetails.engineNumber"
                value={formData.vehicleDetails.engineNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Make</label>
              <input
                type="text"
                name="vehicleDetails.make"
                value={formData.vehicleDetails.make}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="vehicleDetails.model"
                value={formData.vehicleDetails.model}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input
                type="text"
                name="vehicleDetails.year"
                value={formData.vehicleDetails.year}
                onChange={handleChange}
                required
              />
            </div>
            <h5 style={{ marginTop: "20px", marginBottom: "15px" }}>
              Pricing Details
            </h5>
            <div className="form-group">
              <label>Ex-Showroom Price (₹)</label>
              <input
                type="number"
                name="exShowroomPrice"
                value={formData.exShowroomPrice}
                onChange={handleChange}
                placeholder="e.g., 800000"
                required
              />
              <small>Base price of the vehicle before taxes</small>
            </div>
            <div className="form-group">
              <label>Road Tax (₹)</label>
              <input
                type="number"
                name="roadTax"
                value={formData.roadTax}
                onChange={handleChange}
                placeholder="e.g., 48000"
                required
              />
              <small>State road tax (typically 6% of ex-showroom price)</small>
            </div>
            <div className="form-group">
              <label>Insurance Amount (₹)</label>
              <input
                type="number"
                name="insuranceAmount"
                value={formData.insuranceAmount}
                onChange={handleChange}
                placeholder="e.g., 32000"
                required
              />
              <small>Annual insurance premium</small>
            </div>
            <div className="form-group">
              <label>Handling Charges (₹)</label>
              <input
                type="number"
                name="handlingCharges"
                value={formData.handlingCharges}
                onChange={handleChange}
                placeholder="e.g., 5000"
                required
              />
            </div>
            <div className="form-group">
              <label>Other Charges (₹)</label>
              <input
                type="number"
                name="otherCharges"
                value={formData.otherCharges}
                onChange={handleChange}
                placeholder="e.g., 0"
              />
              <small>Any additional charges (optional)</small>
            </div>
            <div className="form-group">
              <label>Payment Mode</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                required
              >
                <option value="Full Payment">Full Payment</option>
                <option value="Loan">Loan/Financing</option>
                <option value="Exchange">Exchange + Payment</option>
              </select>
            </div>
            <button type="submit" className="btn btn-success">
              Submit Request
            </button>
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>My Requests</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Buyer</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req._id}>
                <td>
                  {req.vehicle?.make} {req.vehicle?.model}
                </td>
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
                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-info"
                    onClick={() => navigate(`/invoice/${req._id}`)}
                  >
                    📄 Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="dashboard-footer">
        <p>© 2026 BioChain RTO System • Digital India Initiative</p>
      </footer>
    </div>
  );
}
