import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";

interface DocumentPreviewProps {
  vehicleId: string;
  documentId: string;
  onClose: () => void;
  onVerify?: (status: "verified" | "rejected", remarks: string) => void;
  onSign?: () => void;
  userRole?: string;
}

interface DocumentData {
  documentId: string;
  name: string;
  type: string;
  mimeType: string;
  fileUrl?: string;
  ipfsHash?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  hasSignature: boolean;
  uploadedAt: string;
}

export default function DocumentPreview({
  vehicleId,
  documentId,
  onClose,
  onVerify,
  onSign,
  userRole,
}: DocumentPreviewProps) {
  const { api } = useAuth();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyRemarks, setVerifyRemarks] = useState("");
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyAction, setVerifyAction] = useState<"verified" | "rejected">(
    "verified"
  );

  const fetchDocumentPreview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/documents-mgmt/preview/${vehicleId}/${documentId}`
      );
      setDocument(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load document preview");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api, vehicleId, documentId]);

  useEffect(() => {
    fetchDocumentPreview();
  }, [fetchDocumentPreview]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "rc":
        return "📄";
      case "insurance":
        return "🛡️";
      case "puc":
        return "🌱";
      case "transfer":
        return "🔄";
      case "invoice":
        return "🧾";
      default:
        return "📎";
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified":
        return { text: "Verified", class: "verified" };
      case "rejected":
        return { text: "Rejected", class: "rejected" };
      default:
        return { text: "Pending", class: "pending" };
    }
  };

  const isImage = (mimeType?: string) => {
    return mimeType?.startsWith("image/");
  };

  const isPDF = (mimeType?: string) => {
    return mimeType === "application/pdf";
  };

  const handleVerify = () => {
    if (onVerify) {
      onVerify(verifyAction, verifyRemarks);
      setShowVerifyForm(false);
      setVerifyRemarks("");
    }
  };

  if (loading) {
    return (
      <div className="document-preview-modal" onClick={onClose}>
        <div
          className="document-preview-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="document-preview-loading">
            <p>Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="document-preview-modal" onClick={onClose}>
        <div
          className="document-preview-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="document-preview-error">
            <p>{error || "Document not found"}</p>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const badge = getVerificationBadge(document.verificationStatus);

  return (
    <div className="document-preview-modal" onClick={onClose}>
      <div
        className="document-preview-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="document-preview-header">
          <div className="document-preview-title">
            <span className="document-icon">
              {getDocumentIcon(document.type)}
            </span>
            <div>
              <h3>{document.name}</h3>
              <span className={`verification-badge ${badge.class}`}>
                {badge.text}
              </span>
              {document.hasSignature && (
                <span className="signature-badge">✓ Digitally Signed</span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Preview Area */}
        <div className="document-preview-body">
          {isImage(document.mimeType) ? (
            <div className="image-preview">
              {document.fileUrl ? (
                <img src={document.fileUrl} alt={document.name} />
              ) : document.ipfsHash ? (
                <div className="ipfs-placeholder">
                  <p>🖼️ Image Preview</p>
                  <p className="ipfs-hash">
                    IPFS: {document.ipfsHash.substring(0, 20)}...
                  </p>
                  <a
                    href={`https://gateway.ipfs.io/ipfs/${document.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    View on IPFS
                  </a>
                </div>
              ) : (
                <p>No preview available</p>
              )}
            </div>
          ) : isPDF(document.mimeType) ? (
            <div className="pdf-preview">
              {document.fileUrl ? (
                <iframe
                  src={document.fileUrl}
                  title={document.name}
                  width="100%"
                  height="500px"
                />
              ) : document.ipfsHash ? (
                <div className="ipfs-placeholder">
                  <p>📄 PDF Document</p>
                  <p className="ipfs-hash">
                    IPFS: {document.ipfsHash.substring(0, 20)}...
                  </p>
                  <a
                    href={`https://gateway.ipfs.io/ipfs/${document.ipfsHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    View on IPFS
                  </a>
                </div>
              ) : (
                <p>No preview available</p>
              )}
            </div>
          ) : (
            <div className="generic-preview">
              <div className="document-icon-large">
                {getDocumentIcon(document.type)}
              </div>
              <p>{document.name}</p>
              <p className="mime-type">{document.mimeType || "Unknown type"}</p>
              {document.ipfsHash && (
                <a
                  href={`https://gateway.ipfs.io/ipfs/${document.ipfsHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  View on IPFS
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="document-preview-footer">
          <div className="document-meta">
            <p>
              Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}
            </p>
            <p>Type: {document.type.toUpperCase()}</p>
          </div>

          <div className="document-actions">
            {userRole === "rto" &&
              document.verificationStatus === "pending" && (
                <>
                  {!showVerifyForm ? (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          setVerifyAction("verified");
                          setShowVerifyForm(true);
                        }}
                      >
                        ✓ Verify
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          setVerifyAction("rejected");
                          setShowVerifyForm(true);
                        }}
                      >
                        ✕ Reject
                      </button>
                      {!document.hasSignature && onSign && (
                        <button className="btn btn-primary" onClick={onSign}>
                          ✍️ Sign Document
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="verify-form">
                      <textarea
                        placeholder="Add remarks (optional)..."
                        value={verifyRemarks}
                        onChange={(e) => setVerifyRemarks(e.target.value)}
                        rows={2}
                      />
                      <div className="verify-actions">
                        <button
                          className={`btn ${
                            verifyAction === "verified"
                              ? "btn-success"
                              : "btn-danger"
                          }`}
                          onClick={handleVerify}
                        >
                          Confirm{" "}
                          {verifyAction === "verified"
                            ? "Verification"
                            : "Rejection"}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setShowVerifyForm(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            {document.fileUrl && (
              <a
                href={document.fileUrl}
                download={document.name}
                className="btn btn-primary"
              >
                ⬇️ Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
