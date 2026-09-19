import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";

interface ExpiryAlert {
  vehicleId: string;
  regNumber: string;
  documentId: string;
  documentType: string;
  documentName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: "expired" | "expiring-soon";
}

export default function DocumentExpiryAlerts() {
  const { api } = useAuth();
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents-mgmt/expiry-alerts");
      setAlerts(res.data);
    } catch (err) {
      console.error("Failed to fetch expiry alerts:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "insurance":
        return "🛡️";
      case "puc":
        return "🌱";
      case "rc":
        return "📄";
      default:
        return "📎";
    }
  };

  const getUrgencyColor = (daysUntilExpiry: number, status: string) => {
    if (status === "expired") {
      return { bg: "#EF444420", border: "#EF4444", text: "#EF4444" };
    }
    if (daysUntilExpiry <= 7) {
      return { bg: "#EF444420", border: "#EF4444", text: "#EF4444" };
    }
    if (daysUntilExpiry <= 15) {
      return { bg: "#F59E0B20", border: "#F59E0B", text: "#F59E0B" };
    }
    return { bg: "#10B98120", border: "#10B981", text: "#10B981" };
  };

  if (loading) {
    return (
      <div className="expiry-alerts loading">
        <p>Checking document expiry dates...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show if no alerts
  }

  const expiredCount = alerts.filter((a) => a.status === "expired").length;
  const expiringSoonCount = alerts.filter(
    (a) => a.status === "expiring-soon"
  ).length;

  return (
    <div className="expiry-alerts-container">
      <div
        className="expiry-alerts-header"
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer" }}
      >
        <div className="alerts-title">
          <span className="alert-icon">⚠️</span>
          <h4>Document Expiry Alerts</h4>
          <span className="alert-count">
            {expiredCount > 0 && (
              <span className="badge expired">{expiredCount} Expired</span>
            )}
            {expiringSoonCount > 0 && (
              <span className="badge expiring">
                {expiringSoonCount} Expiring Soon
              </span>
            )}
          </span>
        </div>
        <span className="expand-icon">{expanded ? "▼" : "▶"}</span>
      </div>

      {expanded && (
        <div className="expiry-alerts-list">
          {alerts.map((alert) => {
            const colors = getUrgencyColor(alert.daysUntilExpiry, alert.status);
            return (
              <div
                key={`${alert.vehicleId}-${alert.documentId}`}
                className={`expiry-alert-item ${alert.status}`}
                style={{
                  backgroundColor: colors.bg,
                  borderLeft: `4px solid ${colors.border}`,
                }}
              >
                <div className="alert-icon-type">
                  <span className="doc-icon">
                    {getDocumentIcon(alert.documentType)}
                  </span>
                </div>
                <div className="alert-details">
                  <p className="doc-name">{alert.documentName}</p>
                  <p className="vehicle-info">
                    Vehicle: {alert.regNumber || "N/A"}
                  </p>
                  <p className="expiry-info" style={{ color: colors.text }}>
                    {alert.status === "expired" ? (
                      <strong>
                        Expired {Math.abs(alert.daysUntilExpiry)} days ago
                      </strong>
                    ) : (
                      <strong>Expires in {alert.daysUntilExpiry} days</strong>
                    )}
                    <span className="expiry-date">
                      ({new Date(alert.expiryDate).toLocaleDateString()})
                    </span>
                  </p>
                </div>
                <div className="alert-actions">
                  <a
                    href={`/owner`}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: colors.border,
                      color: "#fff",
                      padding: "6px 12px",
                      fontSize: "12px",
                      textDecoration: "none",
                      borderRadius: "4px",
                    }}
                  >
                    Renew
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
