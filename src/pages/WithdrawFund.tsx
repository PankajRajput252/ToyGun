import React, { useState, useEffect } from "react";
import { EyeIcon, EyeCloseIcon, PencilIcon, TrashBinIcon } from "../icons";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import api, { walletDataApi, WalletData, AddWithdrawalRequestRequest, WithdrawalRequest, withdrawalRequestApi } from "../services/api";

interface WithdrawData {
  selectWallet: string;
  walletType: string;
  withdrawTo: string;
  amount: string;
  transactionPassword: string;
  oneTimePassword: string;
  remarks: string;
  checkMeOut: boolean;
}

export default function WithdrawFund() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [formData, setFormData] = useState<WithdrawData>({
    selectWallet: "",
    walletType: "USDT.BEP20",
    withdrawTo: "",
    amount: "",
    transactionPassword: "",
    oneTimePassword: "",
    remarks: "",
    checkMeOut: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [currentPage] = useState(0);
  const [deletingRequestId, setDeletingRequestId] = useState<number | null>(null);
  const { isOpen: isEditModalOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const [editingRequest, setEditingRequest] = useState<WithdrawalRequest | null>(null);
  const [otpData,setOtpData]=useState("");
  const [isOtpMatched, setIsOtpMatched] = useState(false);
  const [editFormData, setEditFormData] = useState({
    walletType: "",
    walletAddress: "",
    amount: "",
    status: "",
  });

  // Fetch wallet data to get balances and userNodeCode
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const response = await walletDataApi.getAll(0, 1, 'ACTIVE', user?.nodeId || null);
        if (response.content && response.content.length > 0) {
          setWalletData(response.content[0]);
        }
      } catch (err) {
        console.error('Error fetching wallet data:', err);
      }
    };
    fetchWalletData();
  }, [user?.nodeId]);

  // Fetch withdrawal requests
  useEffect(() => {
    const fetchWithdrawalRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await withdrawalRequestApi.getAll(currentPage, 25, 'ACTIVE', user?.nodeId || null);
        setWithdrawalRequests(response.content || []);
      } catch (err) {
        console.error('Error fetching withdrawal requests:', err);
        setError('Failed to load withdrawal requests');
      } finally {
        setLoadingRequests(false);
      }
    };
    fetchWithdrawalRequests();
  }, [currentPage, user?.nodeId]);

  // Get wallet balances from wallet data
  const walletBalances = {
    mineWallet: walletData?.mineWallet || 0,
    nodeWallet: walletData?.nodeWallet || 0,
    capitalWallet: walletData?.capitalWallet || 0,
    packageWallet: 0 // Package wallet is not in WalletData, might need to calculate or fetch separately
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSendOTP = async () => {
    console.log("Useer email--->",user?.email)
    setOtpLoading(true);
    try {
    
      // Simulate API call
       const response = await walletDataApi.addOtp(user?.email ,user?.nodeId || null);
       console.log(response);
       setOtpData(response?.id || "");
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsOtpSent(true);
      setSuccess("OTP sent successfully to your registered email");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

   const handleVerifyOTP = async () => {
    console.log("Useer oneTimePassword--->",formData.oneTimePassword)
    console.log("sent oneTimePassword--->",otpData)
   if(formData.oneTimePassword==otpData){
    console.log("otp matched")
    setIsOtpMatched(true);
    setSuccess("OTP Verified successfully.");
   }
   else{
    console.log("otp NOT matched")
    setError(" OTP MisMatched. Please try again.");
    setIsOtpMatched(false);
   }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.selectWallet) {
        throw new Error("Please select a wallet");
      }
      if (!formData.walletType) {
        throw new Error("Please select a wallet type");
      }
      if (!formData.withdrawTo) {
        throw new Error("Please enter withdrawal address");
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }
      if (!formData.transactionPassword) {
        throw new Error("Please enter your transaction password");
      }
      if (!formData.oneTimePassword) {
        throw new Error("Please enter the OTP");
      }
      if (!formData.checkMeOut) {
        throw new Error("Please check the agreement");
      }

      // Check if amount exceeds wallet balance
      const selectedBalance = walletBalances[formData.selectWallet as keyof typeof walletBalances];
      if (parseFloat(formData.amount) > selectedBalance) {
        throw new Error("Insufficient balance in selected wallet");
      }

      // Get user info
      if (!user) {
        throw new Error("User not authenticated. Please login again.");
      }

      const username = user.username || user.name;
      const userNodeId = user.nodeId || walletData?.userNodeCode || "";
      
      if (!userNodeId) {
        throw new Error("User node ID not found. Please ensure your account is properly set up.");
      }

      // Prepare API request
      const withdrawalRequest: AddWithdrawalRequestRequest = {
        withdrawalRequestPkId: null,
        username: username,
        userNodeId: userNodeId,
        walletType: formData.walletType,
        walletAddress: formData.withdrawTo.trim(),
        amount: parseFloat(formData.amount),
        status: "PENDING",
        updatedAtDateTime: null,
        transactionPassword: formData.transactionPassword,
        otp: formData.oneTimePassword,
      };

      // Call API
      await api.withdrawalRequest.add(withdrawalRequest);

      setSuccess("Withdrawal request submitted successfully! Your funds will be processed within 24 hours.");
      setFormData({
        selectWallet: "",
        walletType: "USDT.BEP20",
        withdrawTo: "",
        amount: "",
        transactionPassword: "",
        oneTimePassword: "",
        remarks: "",
        checkMeOut: false,
      });
      setIsOtpSent(false);
      
      // Refresh withdrawal requests list
      const refreshRequests = async () => {
        try {
          const response = await withdrawalRequestApi.getAll(currentPage, 25, 'ACTIVE', user?.nodeId || null);
          setWithdrawalRequests(response.content || []);
        } catch (err) {
          console.error('Error refreshing withdrawal requests:', err);
        }
      };
      refreshRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getWalletBalance = (wallet: string) => {
    return walletBalances[wallet as keyof typeof walletBalances] || 0;
  };

  const handleUpdate = (request: WithdrawalRequest) => {
    if (!request.withdrawalRequestPkId) {
      setError("Cannot update request: Invalid request ID");
      return;
    }

    setEditingRequest(request);
    setEditFormData({
      walletType: request.walletType || "",
      walletAddress: request.walletAddress || "",
      amount: request.amount?.toString() || "",
      status: request.status || "PENDING",
    });
    openEditModal();
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRequest?.withdrawalRequestPkId) {
      setError("Cannot update request: Invalid request ID");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      // Validation
      if (!editFormData.walletType) {
        throw new Error("Please select a wallet type");
      }
      if (!editFormData.walletAddress) {
        throw new Error("Please enter a wallet address");
      }
      if (!editFormData.amount || parseFloat(editFormData.amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }
      if (!editFormData.status) {
        throw new Error("Please select a status");
      }

      const updatedRequest: Partial<WithdrawalRequest> = {
        ...editingRequest,
        walletType: editFormData.walletType,
        walletAddress: editFormData.walletAddress.trim(),
        amount: parseFloat(editFormData.amount),
        status: editFormData.status,
        updatedAtDateTime: new Date().toISOString(),
      };

      await withdrawalRequestApi.update(editingRequest.withdrawalRequestPkId, updatedRequest);
      setSuccess("Withdrawal request updated successfully!");
      
      // Refresh the list
      const response = await withdrawalRequestApi.getAll(currentPage, 25, 'ACTIVE', user?.nodeId || null);
      setWithdrawalRequests(response.content || []);
      
      // Close modal and reset
      closeEditModal();
      setEditingRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update withdrawal request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId: number | null) => {
    if (!requestId) {
      setError("Cannot delete request: Invalid request ID");
      return;
    }

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this withdrawal request? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingRequestId(requestId);
      setIsLoading(true);
      setError("");
      
      await withdrawalRequestApi.delete(requestId);
      setSuccess("Withdrawal request deleted successfully!");
      
      // Refresh the list
      const response = await withdrawalRequestApi.getAll(currentPage, 25, 'ACTIVE', user?.nodeId || null);
      setWithdrawalRequests(response.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete withdrawal request");
    } finally {
      setIsLoading(false);
      setDeletingRequestId(null);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-white">
          Withdraw Fund
        </h2>
        <nav>
          <ol className="flex flex-wrap items-center gap-2">
            <li><a className="font-medium text-gray-300 hover:text-white" href="/">Home /</a></li>
            <li><a className="font-medium text-gray-300 hover:text-white" href="/">Financial /</a></li>
            <li className="font-medium text-orange-500">Withdraw Fund</li>
          </ol>
        </nav>
      </div>

      {/* Withdraw Fund Form */}
      <div className="mb-8">
        <h3 className="font-bold text-white text-xl mb-6">
          Withdraw Fund
        </h3>
        
        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm">

          <form onSubmit={handleSubmit}>
            <div className="p-4 sm:p-6 md:p-8">
              {/* Error Message */}
              {error && (
                <div className="mb-6 rounded-lg border border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 p-4 shadow-lg">
                  <p className="text-sm text-red-200 font-medium">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-900/40 to-green-800/30 p-4 shadow-lg">
                  <p className="text-sm text-green-200 font-medium">{success}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Select Wallet
                </label>
                <div className="relative z-20">
                  <select
                    name="selectWallet"
                    value={formData.selectWallet}
                    onChange={handleInputChange}
                    className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                  >
                    <option value="" className="bg-gray-700">Select Wallet--</option>
                    <option value="mineWallet" className="bg-gray-700">Mine Wallet (${walletBalances.mineWallet.toLocaleString()})</option>
                    <option value="packageWallet" className="bg-gray-700">Package Wallet (${walletBalances.packageWallet.toLocaleString()})</option>
                    <option value="nodeWallet" className="bg-gray-700">Node Wallet (${walletBalances.nodeWallet.toLocaleString()})</option>
                    <option value="capitalWallet" className="bg-gray-700">Capital Wallet (${walletBalances.capitalWallet.toLocaleString()})</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.8">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF"/>
                      </g>
                    </svg>
                  </span>
                </div>
                {formData.selectWallet && (
                  <p className="mt-2 text-sm text-gray-300">
                    Available Balance: ${getWalletBalance(formData.selectWallet).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Wallet Type
                </label>
                <div className="relative z-20">
                  <select
                    name="walletType"
                    value={formData.walletType}
                    onChange={handleInputChange}
                    className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                  >
                    <option value="USDT.BEP20" className="bg-gray-700">USDT.BEP20</option>
                    <option value="USDT.TRC20" className="bg-gray-700">USDT.TRC20</option>
                    <option value="USDT.ERC20" className="bg-gray-700">USDT.ERC20</option>
                    <option value="BTC" className="bg-gray-700">Bitcoin (BTC)</option>
                    <option value="ETH" className="bg-gray-700">Ethereum (ETH)</option>
                    <option value="BNB" className="bg-gray-700">Binance Coin (BNB)</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.8">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF"/>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Withdraw To (Address)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="withdrawTo"
                    value={formData.withdrawTo}
                    onChange={handleInputChange}
                    placeholder="Enter withdrawal address"
                    className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 pl-12 pr-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Enter Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter withdrawal amount"
                    className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 pl-12 pr-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
                {formData.amount && formData.selectWallet && (
                  <p className="mt-2 text-sm text-gray-300">
                    Withdrawal Fee: ${(parseFloat(formData.amount) * 0.01).toFixed(2)} (1%)
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Transaction Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="transactionPassword"
                    value={formData.transactionPassword}
                    onChange={handleInputChange}
                    placeholder="Enter your transaction password"
                    className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 pl-12 pr-12 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22S2 16 2 9A10 10 0 0 1 12 2A10 10 0 0 1 22 9C22 16 12 22 12 22Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="9" r="3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400 transition-colors"
                  >
                    {showPassword ? (
                      <EyeCloseIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  One Time Password
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      name="oneTimePassword"
                      value={formData.oneTimePassword}
                      onChange={handleInputChange}
                      placeholder="Enter One Time Password"
                      className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 pl-12 pr-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22S2 16 2 9A10 10 0 0 1 12 2A10 10 0 0 1 22 9C22 16 12 22 12 22Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="9" r="3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || isOtpSent}
                    className="px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 whitespace-nowrap"
                  >
                    {otpLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Sending...
                      </div>
                    ) : isOtpSent ? (
                      "OTP Sent"
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                  {
                      isOtpSent &&   
                      <button
                      type="button"
                      onClick={handleVerifyOTP}
                      className="px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 whitespace-nowrap"
                     >Verify</button>
                    }
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add remarks (optional)"
                  className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400 resize-none"
                />
              </div>

              <div className="mb-8">
                <label className="flex cursor-pointer items-center group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="checkMeOut"
                      checked={formData.checkMeOut}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`box mr-4 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
                      formData.checkMeOut 
                        ? "border-orange-500 bg-orange-500 shadow-lg shadow-orange-500/25" 
                        : "border-gray-600 bg-gray-700 group-hover:border-gray-500"
                    }`}>
                      <span className={`text-white transition-opacity ${formData.checkMeOut ? "opacity-100" : "opacity-0"}`}>
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.7071 0.292893C12.0976 0.683417 12.0976 1.31658 11.7071 1.70711L5.41421 8C4.63316 8.78095 3.36684 8.78095 2.58579 8L0.292893 5.70711C-0.0976311 5.31658 -0.0976311 4.68342 0.292893 4.29289C0.683417 3.90237 1.31658 3.90237 1.70711 4.29289L4 6.58579L10.2929 0.292893C10.6834 -0.0976311 11.3166 -0.0976311 11.7071 0.292893Z" fill="currentColor"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <span className="text-white font-medium group-hover:text-orange-300 transition-colors">Check me out</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading  || !isOtpMatched}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span className="font-semibold">Processing...</span>
                  </div>
                ) : (
                  <span className="font-bold">Submit</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Wallet Address Table */}
      <div>
        <h3 className="font-bold text-white text-xl mb-6">Wallet Address</h3>
        
        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm">

          <div className="p-4 sm:p-6 md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">#</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Wallet Type</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Address</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Amount</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Created At</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loadingRequests ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-400">Loading withdrawal requests...</span>
                        </div>
                      </td>
                    </tr>
                  ) : withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <p className="text-lg font-medium">No withdrawal requests found</p>
                          <p className="text-sm text-gray-500 mt-1">Submit a withdrawal request to see it here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    withdrawalRequests.map((request, index) => (
                      <tr key={request.withdrawalRequestPkId || index} className="hover:bg-gray-750 transition-colors">
                        <td className="py-4 px-6 text-white font-medium">
                          {request.withdrawalRequestPkId || index + 1}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {request.walletType || '-'}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          <div className="max-w-xs truncate" title={request.walletAddress || ''}>
                            {request.walletAddress || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-white font-medium">
                          ${request.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {request.createdDatetime 
                            ? new Date(request.createdDatetime).toLocaleString()
                            : request.effectiveDateTime
                            ? new Date(request.effectiveDateTime).toLocaleString()
                            : request.lastModifiedDateTime
                            ? new Date(request.lastModifiedDateTime).toLocaleString()
                            : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'APPROVED' 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : request.status === 'REJECTED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {request.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdate(request)}
                              disabled={isLoading || !request.withdrawalRequestPkId}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Update Status"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(request.withdrawalRequestPkId)}
                              disabled={isLoading || deletingRequestId === request.withdrawalRequestPkId || !request.withdrawalRequestPkId}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete"
                            >
                              {deletingRequestId === request.withdrawalRequestPkId ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                              ) : (
                                <TrashBinIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal} className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 md:p-8 bg-gray-800">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Edit Withdrawal Request</h2>
          
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 p-4 shadow-lg">
              <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-900/40 to-green-800/30 p-4 shadow-lg">
              <p className="text-sm text-green-200 font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-white font-medium text-lg">
                  Wallet Type
                </label>
                <div className="relative z-20">
                  <select
                    name="walletType"
                    value={editFormData.walletType}
                    onChange={handleEditInputChange}
                    className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                  >
                    <option value="USDT.BEP20" className="bg-gray-700">USDT.BEP20</option>
                    <option value="USDT.TRC20" className="bg-gray-700">USDT.TRC20</option>
                    <option value="USDT.ERC20" className="bg-gray-700">USDT.ERC20</option>
                    <option value="BTC" className="bg-gray-700">Bitcoin (BTC)</option>
                    <option value="ETH" className="bg-gray-700">Ethereum (ETH)</option>
                    <option value="BNB" className="bg-gray-700">Binance Coin (BNB)</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.8">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF"/>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-white font-medium text-lg">
                  Wallet Address
                </label>
                <input
                  type="text"
                  name="walletAddress"
                  value={editFormData.walletAddress}
                  onChange={handleEditInputChange}
                  placeholder="Enter wallet address"
                  className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="mb-3 block text-white font-medium text-lg">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={editFormData.amount}
                  onChange={handleEditInputChange}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="mb-3 block text-white font-medium text-lg">
                  Status
                </label>
                <div className="relative z-20">
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                  >
                    <option value="PENDING" className="bg-gray-700">PENDING</option>
                    <option value="APPROVED" className="bg-gray-700">APPROVED</option>
                    <option value="REJECTED" className="bg-gray-700">REJECTED</option>
                  </select>
                  <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g opacity="0.8">
                        <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF"/>
                      </g>
                    </svg>
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Request"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
