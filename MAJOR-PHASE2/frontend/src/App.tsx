import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DealerDashboard from "./pages/DealerDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import RTODashboard from "./pages/RTODashboard";
import PoliceDashboard from "./pages/PoliceDashboard";
import VehicleSearch from "./pages/VehicleSearch";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import InvoiceView from "./pages/InvoiceView";
import Documents from "./pages/Documents";
import RCCardView from "./pages/RCCardView";
import RTOSetupPage from "./pages/RTOSetupPage";
import RTOProfilePage from "./pages/RTOProfilePage";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import DealerProfilePage from "./pages/DealerProfilePage";
import PoliceProfilePage from "./pages/PoliceProfilePage";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
};

// Component to handle authenticated redirects
const AppContent = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            // If user is logged in, show a dashboard selection page
            <div
              className="container"
              style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div
                className="card"
                style={{
                  maxWidth: "500px",
                  width: "100%",
                }}
              >
                <h2
                  className="text-center"
                  style={{
                    color: "#ff9933",
                    marginBottom: "20px",
                    fontSize: "2rem",
                    fontWeight: "700",
                  }}
                >
                  Welcome Back!
                </h2>
                <p
                  className="text-center"
                  style={{
                    fontSize: "1.2rem",
                    color: "#666",
                    marginBottom: "30px",
                    lineHeight: "1.6",
                    fontWeight: "500",
                  }}
                >
                  You are logged in as{" "}
                  <strong style={{ color: "#2c3e50" }}>{user.role}</strong>
                </p>

                <div
                  className="d-grid gap-3"
                  style={{
                    textAlign: "center",
                  }}
                >
                  {user.role === "dealer" && (
                    <a
                      href="/dealer"
                      className="btn btn-primary"
                      style={{
                        textDecoration: "none",
                        padding: "15px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        display: "block",
                      }}
                    >
                      Go to Dealer Dashboard
                    </a>
                  )}
                  {user.role === "owner" && (
                    <a
                      href="/owner"
                      className="btn btn-primary"
                      style={{
                        textDecoration: "none",
                        padding: "15px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        display: "block",
                      }}
                    >
                      Go to Owner Dashboard
                    </a>
                  )}
                  {user.role === "rto" && (
                    <a
                      href="/rto"
                      className="btn btn-primary"
                      style={{
                        textDecoration: "none",
                        padding: "15px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        display: "block",
                      }}
                    >
                      Go to RTO Dashboard
                    </a>
                  )}
                  {user.role === "police" && (
                    <a
                      href="/police"
                      className="btn btn-primary"
                      style={{
                        textDecoration: "none",
                        padding: "15px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        display: "block",
                      }}
                    >
                      Go to Police Dashboard
                    </a>
                  )}
                  <a
                    href="/documents"
                    className="btn btn-success"
                    style={{
                      textDecoration: "none",
                      padding: "15px 25px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      display: "block",
                    }}
                  >
                    View My Documents
                  </a>
                </div>

                <p
                  className="text-center"
                  style={{
                    marginTop: "25px",
                    fontSize: "0.9rem",
                    color: "#888",
                  }}
                >
                  Or{" "}
                  <a
                    href="/logout"
                    onClick={(e) => {
                      e.preventDefault();
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      window.location.href = "/";
                    }}
                    style={{ color: "#ff9933", textDecoration: "underline" }}
                  >
                    Logout
                  </a>
                </p>
              </div>
            </div>
          ) : (
            <Home />
          )
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner-profile"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <OwnerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer"
        element={
          <ProtectedRoute allowedRoles={["dealer"]}>
            <DealerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dealer-profile"
        element={
          <ProtectedRoute allowedRoles={["dealer"]}>
            <DealerProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rto-setup"
        element={
          <ProtectedRoute allowedRoles={["rto"]}>
            <RTOSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rto"
        element={
          <ProtectedRoute allowedRoles={["rto"]}>
            <RTODashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rto-profile"
        element={
          <ProtectedRoute allowedRoles={["rto"]}>
            <RTOProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police"
        element={
          <ProtectedRoute allowedRoles={["police"]}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police-profile"
        element={
          <ProtectedRoute allowedRoles={["police"]}>
            <PoliceProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={["dealer", "owner", "rto", "police"]}>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute allowedRoles={["rto", "police"]}>
            <VehicleSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={["rto", "police"]}>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/rc-card/:vehicleId" element={<RCCardView />} />
      <Route path="/invoice/:requestId" element={<InvoiceView />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
