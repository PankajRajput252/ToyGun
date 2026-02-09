import React, { useState } from "react";

type AccountType = "BANK" | "UPI";

interface WithdrawRequest {
  withdrawRequestPkId: number | null;
  userFkId: string;
  accountType: AccountType | null;
  accountHolderName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
  isDefault: boolean | null;
  createdAt: string | null;
}

const WithdrawBankDetailsForm = () => {

  // ✅ Detect Dark Mode
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const textColor = isDarkMode ? "white" : "black";
  const bgColor = isDarkMode ? "#121212" : "white";

  const [formData, setFormData] = useState<WithdrawRequest>({
    withdrawRequestPkId: null,
    userFkId: "CONT66855610",
    accountType: null,
    accountHolderName: null,
    bankName: null,
    accountNumber: null,
    ifscCode: null,
    upiId: null,
    isDefault: false,
    createdAt: null,
  });

  const handleChange = (field: keyof WithdrawRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("Submitting Data:", formData);
  };

  const labelStyle = { color: textColor };

  return (
    <div style={{ ...styles.container, backgroundColor: bgColor }}>
      <h2 style={{ color: textColor }}>Withdraw Account Details</h2>

      {/* Account Type */}
      <label style={labelStyle}>Account Type</label>

      <select
        value={formData.accountType || ""}
        onChange={(e) =>
          handleChange("accountType", e.target.value as AccountType)
        }
      >
        <option value="">Select</option>
        <option value="BANK">Bank</option>
        <option value="UPI">UPI</option>
      </select>

      {/* BANK Fields */}
      {formData.accountType === "BANK" && (
        <>
          <label style={labelStyle}>Account Holder Name</label>
          <input
            type="text"
            value={formData.accountHolderName || ""}
            onChange={(e) =>
              handleChange("accountHolderName", e.target.value)
            }
          />

          <label style={labelStyle}>Bank Name</label>
          <input
            type="text"
            value={formData.bankName || ""}
            onChange={(e) => handleChange("bankName", e.target.value)}
          />

          <label style={labelStyle}>Account Number</label>
          <input
            type="text"
            value={formData.accountNumber || ""}
            onChange={(e) => handleChange("accountNumber", e.target.value)}
          />

          <label style={labelStyle}>IFSC Code</label>
          <input
            type="text"
            value={formData.ifscCode || ""}
            onChange={(e) => handleChange("ifscCode", e.target.value)}
          />
        </>
      )}

      {/* UPI Field */}
      {formData.accountType === "UPI" && (
        <>
          <label style={labelStyle}>UPI ID</label>
          <input
            type="text"
            value={formData.upiId || ""}
            onChange={(e) => handleChange("upiId", e.target.value)}
          />
        </>
      )}

      {/* Default Checkbox */}
      <div style={{ marginTop: 10 }}>
        <input
          type="checkbox"
          checked={formData.isDefault || false}
          onChange={(e) => handleChange("isDefault", e.target.checked)}
        />
        <span style={labelStyle}> Set as Default</span>
      </div>

      {/* Submit */}
      <button style={styles.button} onClick={handleSubmit}>
        Save Details
      </button>
    </div>
  );
};

export default WithdrawBankDetailsForm;

/* ---------- Styles ---------- */

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "400px",
    margin: "30px auto",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  button: {
    marginTop: "15px",
    padding: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
