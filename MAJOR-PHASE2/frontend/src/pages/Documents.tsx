import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

interface RegistrationCertificate {
  id: string;
  regNumber: string;
  vehicle: string;
  type: string;
}

interface TransferCertificate {
  id: string;
  vehicle: string;
  status: "approved" | "rejected" | "pending";
  date: string;
}

interface Invoice {
  id: string;
  vehicle: string;
  invoiceNumber: string;
  status: "approved" | "rejected" | "pending";
  date: string;
}

interface UserDocuments {
  registrationCertificates: RegistrationCertificate[];
  transferCertificates: TransferCertificate[];
  invoices: Invoice[];
}

const Documents = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UserDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUserDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/documents/user-documents");
      setDocuments(response.data);
      setError("");
    } catch (err: unknown) {
      setError("Failed to load documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchUserDocuments();
  }, [fetchUserDocuments]);

  const handleDownload = (docType: string, docId: string) => {
    alert(
      `In a real application, this would download the ${docType} document with ID: ${docId}.`
    );
    // In a real implementation, this would generate and download the actual document
    console.log(`Downloading ${docType} document with ID: ${docId}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <h2>Loading Documents...</h2>
          <p>Please wait while we fetch your documents.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <h2>Error Loading Documents</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchUserDocuments}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-enhanced">
        <div className="container">
          <h1>Your Documents</h1>
          <p>Welcome to your document management portal</p>
        </div>
      </div>

      <div className="card">
        <h2>Registration Certificates</h2>
        {documents?.registrationCertificates &&
        documents.registrationCertificates.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.registrationCertificates.map(
                  (rc: RegistrationCertificate) => (
                    <tr key={rc.id}>
                      <td>{rc.regNumber || "N/A"}</td>
                      <td>{rc.vehicle}</td>
                      <td>{rc.type}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleDownload("RC", rc.id)}
                        >
                          Download RC
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No registration certificates found.</p>
        )}
      </div>

      <div className="card">
        <h2>Transfer Certificates</h2>
        {documents?.transferCertificates &&
        documents.transferCertificates.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.transferCertificates.map(
                  (tc: TransferCertificate) => (
                    <tr key={tc.id}>
                      <td>{tc.vehicle}</td>
                      <td>
                        <span
                          className={`badge ${
                            tc.status === "approved"
                              ? "success"
                              : tc.status === "rejected"
                              ? "danger"
                              : "warning"
                          }`}
                        >
                          {tc.status.charAt(0).toUpperCase() +
                            tc.status.slice(1)}
                        </span>
                      </td>
                      <td>{new Date(tc.date).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            handleDownload("Transfer Certificate", tc.id)
                          }
                        >
                          Download TC
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No transfer certificates found.</p>
        )}
      </div>

      <div className="card">
        <h2>Invoices</h2>
        {documents?.invoices && documents.invoices.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.invoices.map((invoice: Invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      {invoice.invoiceNumber || invoice.id.substring(0, 8)}
                    </td>
                    <td>{invoice.vehicle}</td>
                    <td>
                      <span
                        className={`badge ${
                          invoice.status === "approved"
                            ? "success"
                            : invoice.status === "rejected"
                            ? "danger"
                            : "warning"
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() +
                          invoice.status.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-info"
                        onClick={() => navigate(`/invoice/${invoice.id}`)}
                        style={{ marginRight: "8px" }}
                      >
                        View Invoice
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDownload("Invoice", invoice.id)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No invoices found.</p>
        )}
      </div>
    </div>
  );
};

export default Documents;
