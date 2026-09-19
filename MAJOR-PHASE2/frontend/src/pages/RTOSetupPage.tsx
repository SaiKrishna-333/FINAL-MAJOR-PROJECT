import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

export default function RTOSetupPage() {
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    stateCode: "",
    stateName: "",
    district: "",
    rtoOfficeCode: "",
    rtoOfficeName: "",
    designation: "RTO Officer",
    employeeId: "",
    officeAddress: "",
    jurisdiction: "",
  });

  const [loading, setLoading] = useState(false);

  const states = [
    { code: "AP", name: "Andhra Pradesh" },
    { code: "TS", name: "Telangana" },
    { code: "KA", name: "Karnataka" },
    { code: "TN", name: "Tamil Nadu" },
    { code: "MH", name: "Maharashtra" },
    { code: "DL", name: "Delhi" },
    { code: "GJ", name: "Gujarat" },
    { code: "RJ", name: "Rajasthan" },
    { code: "UP", name: "Uttar Pradesh" },
    { code: "MP", name: "Madhya Pradesh" },
    { code: "KL", name: "Kerala" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "stateCode" && {
        stateName: states.find((s) => s.code === value)?.name || "",
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put("/auth/update-rto-details", { rtoDetails: formData });
      alert("RTO details setup completed successfully!");
      navigate("/rto-dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Error updating RTO details: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "rto") {
    navigate("/login");
    return null;
  }

  // If already setup, redirect to dashboard
  if (user.rtoDetails?.stateCode) {
    navigate("/rto-dashboard");
    return null;
  }

  return (
    <div className="container">
      <div className="navbar">
        <div className="container">
          <h2>BioChain RTO - Officer Setup</h2>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <h3>Welcome, {user.name}!</h3>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          Please configure your RTO office details to get started. This
          information will be used to manage vehicles in your jurisdiction.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                State <span style={{ color: "red" }}>*</span>
              </label>
              <select
                name="stateCode"
                value={formData.stateCode}
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
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                RTO Office Code <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="rtoOfficeCode"
                placeholder="e.g., KA-01, TS-07"
                value={formData.rtoOfficeCode}
                onChange={handleChange}
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                RTO Office Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="rtoOfficeName"
                placeholder="e.g., Bangalore Central RTO"
                value={formData.rtoOfficeName}
                onChange={handleChange}
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                District <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="district"
                placeholder="e.g., Bangalore Urban"
                value={formData.district}
                onChange={handleChange}
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Employee ID <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                placeholder="Your official employee ID"
                value={formData.employeeId}
                onChange={handleChange}
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

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Designation
              </label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              >
                <option value="RTO Officer">RTO Officer</option>
                <option value="Assistant RTO">Assistant RTO</option>
                <option value="Senior RTO Officer">Senior RTO Officer</option>
                <option value="Deputy RTO">Deputy RTO</option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Office Address <span style={{ color: "red" }}>*</span>
              </label>
              <textarea
                name="officeAddress"
                placeholder="Complete office address"
                value={formData.officeAddress}
                onChange={handleChange}
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "1rem",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Jurisdiction Area
              </label>
              <input
                type="text"
                name="jurisdiction"
                placeholder="e.g., Bangalore Urban District"
                value={formData.jurisdiction}
                onChange={handleChange}
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

          <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#e3f2fd",
            borderRadius: "8px",
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0" }}>ℹ️ Information</h4>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#555" }}>
            Once you complete the setup, you will be able to:
          </p>
          <ul
            style={{
              margin: "0.5rem 0 0 1.5rem",
              fontSize: "0.9rem",
              color: "#555",
            }}
          >
            <li>Manage vehicle registrations in your state</li>
            <li>Approve inter-state vehicle transfers</li>
            <li>Issue No Objection Certificates (NOC)</li>
            <li>Verify and approve ownership transfers</li>
            <li>Access vehicle history and blockchain records</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
