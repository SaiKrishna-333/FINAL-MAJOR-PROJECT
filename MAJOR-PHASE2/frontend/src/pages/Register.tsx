import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BiometricCaptureModal from "../components/BiometricCaptureModal";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "owner",
    phone: "",
    address: "",
    state: "",
    district: "",
    aadhaarNumber: "",
    dlNumber: "",
    badgeNumber: "", // For police
    profilePhoto: null as File | null,
  });
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "biometric">("form");
  const [showBiometric, setShowBiometric] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState("");
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getEmailPlaceholder = () => {
    const role = formData.role;
    switch (role) {
      case "owner":
        return "username@owner.com";
      case "dealer":
        return "username@dealer.com";
      case "rto":
        return "username@rto.com";
      case "police":
        return "username@police.com";
      default:
        return "username@role.com";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("district", formData.district);
      formDataToSend.append("aadhaarNumber", formData.aadhaarNumber);
      formDataToSend.append("dlNumber", formData.dlNumber);
      if (formData.role === "police" && formData.badgeNumber) {
        formDataToSend.append("badgeNumber", formData.badgeNumber);
      }
      if (formData.profilePhoto) {
        formDataToSend.append("profilePhoto", formData.profilePhoto);
      }

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Store the user ID and move to biometric step
      setRegisteredUserId(response.data.userId);
      setStep("biometric");
      setShowBiometric(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || errorMessage,
      );
    }
  };

  const handleBiometricSuccess = async (biometricData: {
    templateId: string;
    timestamp: string;
    quality: number;
  }) => {
    try {
      // Update user with biometric template using public endpoint (no auth needed)
      await axios.put(
        `http://localhost:5000/api/auth/register/${registeredUserId}/biometric`,
        {
          templateId: biometricData.templateId,
          quality: biometricData.quality,
        },
      );

      alert("Registration and biometric enrollment successful! Please login.");
      navigate("/login");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Biometric enrollment failed";
      setError(
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || errorMessage,
      );
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <header className="gov-header">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "1.5rem" }}>🏛️</span>
          <div className="gov-nav">
            <a href="/">Home</a>
            <a href="/login">Login</a>
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{ maxWidth: "550px", marginTop: "40px" }}
      >
        <div className="card">
          <div
            className="orange-badge"
            style={{ display: "block", textAlign: "center", fontSize: "1rem" }}
          >
            Digital India Citizen Registration
          </div>
          <h2
            style={{
              textAlign: "center",
              margin: "20px 0",
              color: "#1a237e",
              fontWeight: "800",
            }}
          >
            BIOCHAIN RTO
          </h2>

          {step === "form" && (
            <>
              <div
                style={{
                  background: "rgba(19, 136, 8, 0.05)",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid rgba(19, 136, 8, 0.2)",
                }}
              >
                <h5 style={{ margin: "0 0 10px 0", color: "#138808" }}>
                  🇮🇳 Identity Verification Requirements:
                </h5>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "0.85rem",
                    color: "#666",
                  }}
                >
                  Please use the official role-based email domain provided by
                  your department or for personal use.
                </p>
                <p
                  style={{
                    margin: "5px 0",
                    fontSize: "0.85rem",
                    color: "#d32f2f",
                    fontWeight: "bold",
                  }}
                >
                  ⚠️ All fields are mandatory. Profile details can be edited
                  later from dashboard.
                </p>
              </div>

              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name (as per Aadhaar)</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Official Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={getEmailPlaceholder()}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Secure Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>System Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="owner">Owner/Buyer</option>
                    <option value="dealer">Dealer</option>
                    <option value="rto">RTO Officer</option>
                    <option value="police">Police</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter your complete address"
                    required
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "1rem",
                  }}
                >
                  <div className="form-group">
                    <label>State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "1rem",
                      }}
                    >
                      <option value="">Select State</option>
                      <option value="AP">Andhra Pradesh</option>
                      <option value="TS">Telangana</option>
                      <option value="KA">Karnataka</option>
                      <option value="TN">Tamil Nadu</option>
                      <option value="MH">Maharashtra</option>
                      <option value="DL">Delhi</option>
                      <option value="GJ">Gujarat</option>
                      <option value="RJ">Rajasthan</option>
                      <option value="UP">Uttar Pradesh</option>
                      <option value="MP">Madhya Pradesh</option>
                      <option value="KL">Kerala</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>District *</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="e.g., Bangalore Urban"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                  }}
                >
                  <div className="form-group">
                    <label>Aadhaar Number *</label>
                    <input
                      type="text"
                      name="aadhaarNumber"
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                      placeholder="XXXX-XXXX-XXXX"
                      maxLength={12}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>DL Number *</label>
                    <input
                      type="text"
                      name="dlNumber"
                      value={formData.dlNumber}
                      onChange={handleChange}
                      placeholder="Driving License Number"
                      required
                    />
                  </div>
                  {formData.role === "police" && (
                    <div
                      className="form-group"
                      style={{ gridColumn: "span 2" }}
                    >
                      <label>Badge Number (Police ID) *</label>
                      <input
                        type="text"
                        name="badgeNumber"
                        value={formData.badgeNumber}
                        onChange={handleChange}
                        placeholder="Enter your police badge/ID number"
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginTop: "15px" }}>
                  <label>Profile Photo *</label>
                  <input
                    type="file"
                    name="profilePhoto"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, profilePhoto: file });
                      }
                    }}
                    required
                  />
                  <small
                    style={{
                      color: "#666",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    Upload your recent passport-size photograph (JPG/PNG)
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ width: "100%", padding: "14px", marginTop: "10px" }}
                >
                  Create Secure Identity
                </button>
              </form>
              <p
                style={{
                  textAlign: "center",
                  marginTop: "20px",
                  fontSize: "0.9rem",
                }}
              >
                Already registered?{" "}
                <a
                  href="/login"
                  style={{
                    color: "#138808",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  Login to Dashboard
                </a>
              </p>
            </>
          )}
        </div>
      </div>
      <footer className="dashboard-footer">
        <p>© 2026 BioChain RTO System • Digital India Initiative</p>
      </footer>

      {/* Biometric Enrollment Modal */}
      <BiometricCaptureModal
        isOpen={showBiometric}
        onClose={() => setShowBiometric(false)}
        onSuccess={handleBiometricSuccess}
        personName={formData.name}
        personRole={formData.role}
        instructionText="Place your index finger on the biometric scanner to complete enrollment"
      />
    </div>
  );
}
