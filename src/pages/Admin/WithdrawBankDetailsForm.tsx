import React, { useState, useEffect } from "react";
import { BankApi, AddWithdrawRequest, WithdrawRequest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const WithdrawBankDetailsForm = () => {

  const [showForm, setShowForm] = useState(false);
  const [bankDetails, setBankDetails] = useState<WithdrawRequest[]>([]);

  // Dark Mode Detection
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const textColor = isDarkMode ? "white" : "black";
  const bgColor = isDarkMode ? "#121212" : "white";
  const { user } = useAuth();
  // Form State
  const [formData, setFormData] = useState<AddWithdrawRequest>({
    withdrawRequestPkId: null,
    userFkId: user?.nodeId ?? "",
    accountType: "BANK",
    accountHolderName: null,
    bankName: null,
    accountNumber: null,
    ifscCode: null,
    upiId: null,
    isDefault: false,
    createdAt: null
  });

  // Fetch Bank Details
  const fetchBankDetails = async () => {
    try {
      user?.nodeId
      const res = await BankApi.getAll(1, 25, "ACTIVE", user?.nodeId);

      // 👉 adjust if API returns res.data or res.content.data
      setBankDetails(res?.content?.data || res || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  // Handle Change
  const handleChange = (field: keyof AddWithdrawRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit
  const handleSubmit = async () => {
    try {
      await BankApi.add({
        ...formData,
        upiId: null
      });

      alert("Bank details saved successfully!");

      setShowForm(false);
      fetchBankDetails();

    } catch (error) {
      console.error(error);
      alert("Failed to save bank details");
    }
  };

  return (
    <div style={{
      padding: 30, backgroundColor: bgColor, minHeight: "100vh", position: "relative"

    }}>

      {/* Payment Toggle Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          style={styles.paymentButton}
          onClick={() => setShowForm(prev => !prev)}
        >
          {showForm ? "+ Payment" : "+ Payment"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formOverlay}>
          <div style={{ ...styles.container, backgroundColor: bgColor }}>

            <h2 style={{ color: textColor, textAlign: "center" }}>
              Add Bank Details
            </h2>
            <label style={styles.label}>Account Holder Name</label>

            <input
              style={styles.input}
              placeholder="Account Holder Name"
              value={formData.accountHolderName || ""}
              onChange={(e) => handleChange("accountHolderName", e.target.value)}
            />
            <label style={styles.label}>Bank Name</label>

            <input
              style={styles.input}
              placeholder="Bank Name"
              value={formData.bankName || ""}
              onChange={(e) => handleChange("bankName", e.target.value)}
            />
            <label style={styles.label}>Account Number</label>

            <input
              style={styles.input}
              placeholder="Account Number"
              value={formData.accountNumber || ""}
              onChange={(e) => handleChange("accountNumber", e.target.value)}
            />
            <label style={styles.label}>IFSC Code</label>

            <input
              style={styles.input}
              placeholder="IFSC Code"
              value={formData.ifscCode || ""}
              onChange={(e) => handleChange("ifscCode", e.target.value)}
            />

            <label style={{ color: textColor }}>
              <input
                type="checkbox"
                checked={formData.isDefault || false}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
              />
              &nbsp; Set as Default
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={styles.saveButton} onClick={handleSubmit}>
                Save
              </button>

              <button
                style={styles.cancelButton}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank List */}
      <h3 style={{ color: textColor, marginTop: 40 }}>
        Bank Details List
      </h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Holder</th>
            <th style={styles.th}>Bank</th>
            <th style={styles.th}>Account</th>
            <th style={styles.th}>IFSC</th>
            <th style={styles.th}>Default</th>
          </tr>
        </thead>

        <tbody>
          {bankDetails.map((bank) => (
            <tr key={bank.withdrawRequestPkId} style={styles.tr}>
              <td style={{ ...styles.td, ...styles.th }}>
                {bank.accountHolderName}
              </td>

              <td style={{ ...styles.td, ...styles.th }}>{bank.bankName}</td>
              <td style={{ ...styles.td, ...styles.th }}>{bank.accountNumber}</td>
              <td style={{ ...styles.td, ...styles.th }}>{bank.ifscCode}</td>
              <td style={{ ...styles.td, ...styles.th }}>
                {bank.isDefault ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
};

export default WithdrawBankDetailsForm;


/* ---------- Styles ---------- */

const styles: { [key: string]: React.CSSProperties } = {

  paymentButton: {
    padding: "10px 18px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: -4,
    color: "#ccc"
  },

  formOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10
  },
  container: {
    marginTop: 20,
    padding: 25,
    border: "1px solid #ccc",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 15,
    width: 380,
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
  },

  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14
  },

  saveButton: {
    backgroundColor: "#28a745",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    flex: 1
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    overflow: "hidden"
  },

  th: {
    padding: "14px",
    textAlign: "left",
    backgroundColor: "#2c2c2c",
    color: "white",
    fontWeight: 600,
    fontSize: 15
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #333",
    fontSize: 14
  },

  tr: {
    transition: "0.2s"
  },

  cancelButton: {
    backgroundColor: "#6c757d",
    color: "white",
    padding: 10,
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    flex: 1
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 15
  }
};
