import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

export default function PoliceProfilePage() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    district: "",
    aadhaarNumber: "",
    dlNumber: "",
    badgeNumber: "",
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>("");
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  const loadProfile = useCallback(async () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        state: user.state || "",
        district: user.district || "",
        aadhaarNumber: user.aadhaarNumber || "",
        dlNumber: user.dlNumber || "",
        badgeNumber: user.badgeNumber || "",
      });
      if (user.hasProfilePhoto && user.id) {
        try {
          const response = await api.get(`/auth/users/${user.id}/photo`, {
            responseType: "blob",
          });
          setProfilePhotoUrl(URL.createObjectURL(response.data));
        } catch {
          /* Use default */
        }
      }
    }
  }, [user, api]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (profilePhotoFile && user?.id) {
        const fd = new FormData();
        fd.append("profilePhoto", profilePhotoFile);
        await api.put(`/auth/${user.id}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await api.put(`/auth/users/${user?.id}`, {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        state: formData.state,
        district: formData.district,
      });
      setMessage("✅ Profile updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      setMessage(
        "❌ Error: " + (err instanceof Error ? err.message : "Unknown"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "police") {
    navigate("/login");
    return null;
  }

  return (
    <div className="container">
      <div className="navbar">
        <div className="container">
          <h2>BioChain RTO - Police Profile</h2>
          <div className="nav-links">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/police")}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: "900px", margin: "2rem auto" }}>
        <h3>👮 Police Officer Profile</h3>
        {message && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1.5rem",
              borderRadius: "8px",
              background: message.includes("✅") ? "#e8f5e9" : "#ffebee",
              color: message.includes("✅") ? "#2e7d32" : "#c62828",
            }}
          >
            {message}
          </div>
        )}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              overflow: "hidden",
              border: "4px solid #667eea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: profilePhotoUrl
                ? "transparent"
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ color: "#fff", fontSize: "3rem", fontWeight: "bold" }}
              >
                {formData.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label
            style={{ cursor: "pointer", color: "#667eea", fontWeight: "bold" }}
          >
            📷 Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </label>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
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
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
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
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
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
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  resize: "vertical",
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
                State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
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
                District
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "2px solid #eee",
              }}
            >
              <h4 style={{ color: "#999" }}>🔒 Permanent Details</h4>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                  color: "#999",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #eee",
                  borderRadius: "6px",
                  background: "#f5f5f5",
                  color: "#999",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                  color: "#999",
                }}
              >
                Badge Number
              </label>
              <input
                type="text"
                value={formData.badgeNumber}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #eee",
                  borderRadius: "6px",
                  background: "#f5f5f5",
                  color: "#999",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                  color: "#999",
                }}
              >
                Aadhaar
              </label>
              <input
                type="text"
                value={formData.aadhaarNumber}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #eee",
                  borderRadius: "6px",
                  background: "#f5f5f5",
                  color: "#999",
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
              {loading ? "Updating..." : "Update"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/police")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
