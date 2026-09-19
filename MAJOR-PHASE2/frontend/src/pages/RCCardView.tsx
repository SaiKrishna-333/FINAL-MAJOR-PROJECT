import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import RCCertificate from "../components/RCCertificate";

export default function RCCardView() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [vehicle, setVehicle] = useState<{
    _id: string;
    regNumber: string;
    make: string;
    model: string;
    year: string;
    status: string;
    chassisNumber?: string;
    engineNumber?: string;
    currentOwner?: string;
    blockchainTxHash?: string;
    ipfsRecordHash?: string;
  } | null>(null);
  const [owner, setOwner] = useState<{
    name: string;
    email: string;
    aadhaarNumber?: string;
    address?: string;
  } | null>(null);
  const [blockchainHash, setBlockchainHash] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState({
    registration: "",
    validUpto: "",
    insuranceValid: "",
    pucValid: "",
    fitnessValid: "",
  });

  useEffect(() => {
    const loadRCData = async () => {
      try {
        console.log("Loading RC card for vehicle:", vehicleId);

        if (!vehicleId) {
          setError("No vehicle ID provided");
          setLoading(false);
          return;
        }

        // Fetch vehicle details
        console.log("Fetching vehicle from API...");
        const vehicleRes = await api.get(`/vehicles/${vehicleId}`);
        console.log(
          "✅ Vehicle response received:",
          JSON.stringify(vehicleRes.data, null, 2)
        );

        setVehicle(vehicleRes.data);

        // Store blockchain hash separately
        if (vehicleRes.data.blockchainTxHash) {
          console.log(
            "✅ Blockchain hash found:",
            vehicleRes.data.blockchainTxHash
          );
          setBlockchainHash(vehicleRes.data.blockchainTxHash);
        } else {
          console.warn("⚠️ No blockchain hash in vehicle data");
        }

        // Fetch owner details if available
        if (vehicleRes.data.currentOwner) {
          console.log("📋 currentOwner found:", vehicleRes.data.currentOwner);

          // Check if currentOwner is populated (object) or just an ID (string)
          if (
            typeof vehicleRes.data.currentOwner === "object" &&
            vehicleRes.data.currentOwner._id
          ) {
            console.log(
              "✅ currentOwner is already populated with user details"
            );
            setOwner({
              name: vehicleRes.data.currentOwner.name || "Unknown",
              address:
                vehicleRes.data.currentOwner.address || "Address not available",
              aadhaarNumber:
                vehicleRes.data.currentOwner.aadhaarNumber || "N/A",
              email: vehicleRes.data.currentOwner.email || "",
            });
          } else {
            // currentOwner is just an ID, need to fetch user details
            try {
              const userId =
                typeof vehicleRes.data.currentOwner === "string"
                  ? vehicleRes.data.currentOwner
                  : vehicleRes.data.currentOwner?._id;

              console.log("📋 Fetching owner details for user ID:", userId);
              const ownerRes = await api.get(`/users/${userId}`);
              console.log(
                "✅ Owner response received:",
                JSON.stringify(ownerRes.data, null, 2)
              );
              setOwner(ownerRes.data);
            } catch (ownerErr) {
              console.error("❌ Owner details fetch failed:", ownerErr);
              // Set default owner data from vehicle if user endpoint fails
              if (vehicleRes.data.ownerName || vehicleRes.data.ownerAddress) {
                setOwner({
                  name: vehicleRes.data.ownerName || "Unknown",
                  address: vehicleRes.data.ownerAddress || "Unknown",
                  aadhaarNumber: vehicleRes.data.ownerAadhaar || null,
                  email: vehicleRes.data.ownerEmail || "",
                });
              } else {
                console.warn(
                  "⚠️ No owner data available anywhere, using defaults"
                );
                // Set a default owner so the UI shows something
                setOwner({
                  name: "Vehicle Owner",
                  address: "Address not available",
                  aadhaarNumber: "N/A",
                  email: "",
                });
              }
            }
          }
        } else {
          console.warn("⚠️ No currentOwner found in vehicle data at all");
          // Set a default owner so the UI shows something
          setOwner({
            name: "Vehicle Owner",
            address: "Address not available",
            aadhaarNumber: "N/A",
            email: "",
          });
        }

        setLoading(false);

        // Set dates once data is loaded
        const regDate = new Date();
        const validDate = new Date(
          regDate.getTime() + 15 * 365 * 24 * 60 * 60 * 1000
        );
        const insuranceDate = new Date(
          regDate.getTime() + 365 * 24 * 60 * 60 * 1000
        );
        const pucDate = new Date(regDate.getTime() + 180 * 24 * 60 * 60 * 1000);
        const fitnessDate = new Date(
          validDate.getTime() + 365 * 24 * 60 * 60 * 1000
        );
        setDates({
          registration: regDate.toISOString(),
          validUpto: validDate.toISOString(),
          insuranceValid: insuranceDate.toISOString(),
          pucValid: pucDate.toISOString(),
          fitnessValid: fitnessDate.toISOString(),
        });
      } catch (err) {
        console.error("Failed to load RC data:", err);
        let errorMsg = "Unknown error";
        if (typeof err === "object" && err !== null && "response" in err) {
          const axiosError = err as {
            response?: { data?: { message?: string } };
          };
          errorMsg = axiosError.response?.data?.message || "Request failed";
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }
        setError(`Failed to load RC card: ${errorMsg}`);
        setLoading(false);
      }
    };

    loadRCData();
  }, [vehicleId, api]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading RC Card...</h2>
        <p>Please wait while we fetch your registration certificate</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#dc3545" }}>Error Loading RC Card</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1000px",
        margin: "20px auto",
      }}
    >
      <RCCertificate
        vehicle={{
          regNumber: vehicle?.regNumber || "KA01AB1234",
          chassisNumber: vehicle?.chassisNumber || "N/A",
          engineNumber: vehicle?.engineNumber || "N/A",
          make: vehicle?.make || "Unknown",
          model: vehicle?.model || "Unknown",
          year: parseInt(vehicle?.year || "2024"),
          fuelType: "Petrol",
          vehicleClass: "Two Wheeler (Motorcycle)",
          color: "Black",
          seatingCapacity: 2,
          status: vehicle?.status || "active",
        }}
        owner={{
          name: owner?.name || "Vehicle Owner",
          address: owner?.address || "Address not available",
          aadhaarNumber: owner?.aadhaarNumber || "N/A",
        }}
        registrationDate={dates.registration}
        validUpto={dates.validUpto}
        rtoOffice="Bengaluru Central RTO, Karnataka"
        blockchainTxHash={blockchainHash}
        insuranceValidUpto={dates.insuranceValid}
        pucValidUpto={dates.pucValid}
        fitnessValidUpto={dates.fitnessValid}
      />
    </div>
  );
}
