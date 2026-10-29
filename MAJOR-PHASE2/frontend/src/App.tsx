import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
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
import VehicleHistory from "./pages/VehicleHistory";
import WorkshopDashboard from "./pages/WorkshopDashboard";
import FraudInvestigations from "./pages/FraudInvestigations";
import TransferApprovals from "./pages/TransferApprovals";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

// The landing card lists consoles an account can actually open: every entry repeats
// the roles allowed on that route below, so no link bounces the user back here.
const HUB_LINKS: {
  to: string;
  label: string;
  variant: string;
  roles: string[];
}[] = [
  {
    to: "/dealer",
    label: "Go to Dealer Dashboard",
    variant: "btn-primary",
    roles: ["dealer"],
  },
  {
    to: "/owner",
    label: "Go to Owner Dashboard",
    variant: "btn-primary",
    roles: ["owner"],
  },
  {
    to: "/rto",
    label: "Go to RTO Dashboard",
    variant: "btn-primary",
    roles: ["rto"],
  },
  {
    to: "/police",
    label: "Go to Police Dashboard",
    variant: "btn-primary",
    roles: ["police"],
  },
  {
    to: "/workshop",
    label: "Go to Workshop Dashboard",
    variant: "btn-primary",
    roles: ["workshop"],
  },
  {
    to: "/search",
    label: "Search the Vehicle Registry",
    variant: "btn-secondary",
    roles: ["rto", "police"],
  },
  {
    to: "/analytics",
    label: "Open the Analytics Dashboard",
    variant: "btn-secondary",
    roles: ["rto", "police"],
  },
  {
    to: "/investigations",
    label: "Go to Investigations Console",
    variant: "btn-danger",
    roles: ["rto", "police", "admin"],
  },
  {
    to: "/transfer-approvals",
    label: "Go to Transfer Approvals",
    variant: "btn-info",
    roles: ["rto", "admin", "owner", "workshop"],
  },
  {
    to: "/documents",
    label: "View My Documents",
    variant: "btn-success",
    roles: ["dealer", "owner", "rto", "police"],
  },
];

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
  const { user, logout } = useAuth();

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
                    color: "#1e5aa8",
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
                  {HUB_LINKS.filter((link) =>
                    link.roles.includes(user.role),
                  ).map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`btn ${link.variant}`}
                      style={{
                        textDecoration: "none",
                        padding: "15px 25px",
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        display: "block",
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
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
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      // Through the context, because that also drops the live WebSocket
                      // connection - clearing storage by hand leaves it running.
                      logout();
                      window.location.href = "/login";
                    }}
                    style={{
                      color: "#b91c1c",
                      textDecoration: "underline",
                    }}
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
        path="/workshop"
        element={
          <ProtectedRoute allowedRoles={["workshop"]}>
            <WorkshopDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicle-history/:vehicleId"
        element={
          <ProtectedRoute
            allowedRoles={[
              "owner",
              "dealer",
              "rto",
              "police",
              "admin",
              "workshop",
            ]}
          >
            <VehicleHistory />
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
      <Route
        path="/investigations"
        element={
          <ProtectedRoute allowedRoles={["rto", "police", "admin"]}>
            <FraudInvestigations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transfer-approvals"
        element={
          <ProtectedRoute allowedRoles={["rto", "admin", "owner", "workshop"]}>
            <TransferApprovals />
          </ProtectedRoute>
        }
      />
      <Route path="/rc-card/:vehicleId" element={<RCCardView />} />
      <Route path="/invoice/:requestId" element={<InvoiceView />} />
      {/* Unknown URLs land back on the public home page - never a blank screen */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
