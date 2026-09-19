import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      if (user.role === "dealer") navigate("/dealer");
      else if (user.role === "owner") navigate("/owner");
      else if (user.role === "rto") {
        // Check if RTO details are set up
        if (!user.rtoDetails?.stateCode) {
          navigate("/rto-setup");
        } else {
          navigate("/rto");
        }
      } else if (user.role === "police") navigate("/police");
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : "Invalid credentials");
    }
  };

  // Role-specific email examples
  const getEmailPlaceholder = () => {
    if (email.includes("@owner.com")) return "owner@biochain.com";
    if (email.includes("@dealer.com")) return "dealer@biochain.com";
    if (email.includes("@ka.rto.com") || email.includes("@tn.rto.com")) return "ka.rto@biochain.com";
    if (email.includes("@police.com")) return "police@biochain.com";
    return "user@biochain.com";
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <header className="gov-header">
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "1.5rem" }}>🏛️</span>
          <div className="gov-nav">
            <a href="/">Home</a>
          </div>
        </div>
      </header>

      <div
        className="container"
        style={{ maxWidth: "450px", marginTop: "40px" }}
      >
        <div className="card">
          <div
            className="orange-badge"
            style={{ display: "block", textAlign: "center", fontSize: "1rem" }}
          >
            Digital India Secure Login
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

          <div
            style={{
              background: "rgba(255, 153, 51, 0.05)",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid rgba(255, 153, 51, 0.2)",
            }}
          >
            <h5 style={{ margin: "0 0 10px 0", color: "#ff9933" }}>
              📧 Role-based Email Access:
            </h5>
            <ul
              style={{
                margin: "5px 0",
                paddingLeft: "20px",
                fontSize: "0.85rem",
                color: "#666",
              }}
            >
              <li>
                <strong>Owner:</strong> @owner.com
              </li>
              <li>
                <strong>Dealer:</strong> @dealer.com
              </li>
              <li>
                <strong>RTO:</strong> @rto.com
              </li>
              <li>
                <strong>Police:</strong> @police.com
              </li>
            </ul>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getEmailPlaceholder()}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px" }}
            >
              Secure Login
            </button>
          </form>
          <p
            style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "0.9rem",
            }}
          >
            New user?{" "}
            <a
              href="/register"
              style={{
                color: "#ff9933",
                fontWeight: "700",
                textDecoration: "none",
              }}
            >
              Create an Account
            </a>
          </p>
        </div>
      </div>
      <footer className="dashboard-footer">
        <p>© 2026 BioChain RTO System • Digital India Initiative</p>
      </footer>
    </div>
  );
}
