import React, { useState, useEffect } from "react";
import { EyeIcon, EyeCloseIcon, TrashBinIcon, PencilIcon } from "../icons";
import { supportTicketApi, SupportTicket as ApiSupportTicket } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Modal } from "../components/ui/modal";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import { isUserAdmin } from "../context/AuthContext";
interface FormData {
  category: string;
  priority: string;
  message: string;
  transactionPassword: string;
  oneTimePassword: string;
}

export default function Support() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    category: "",
    priority: "Normal/Minor impact",
    message: "",
    transactionPassword: "",
    oneTimePassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [supportTickets, setSupportTickets] = useState<ApiSupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(null);
  const [editingTicket, setEditingTicket] = useState<ApiSupportTicket | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    category: "",
    priority: "",
    message: "",
    status: "",
  });
  // Fetch support tickets on component mount
  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await supportTicketApi.getAll(0, 25, 'ACTIVE', null);
      setSupportTickets(response.content || []);
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOTP = async () => {
    setOtpLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsOtpSent(true);
      setSuccess("OTP sent successfully to your registered email/mobile");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Map form category values to API values
  const mapCategoryToApi = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      "technical": "OTHERS",
      "account": "OTHERS",
      "payment": "DEPOSIT",
      "withdrawal": "WITHDRAWAL",
      "general": "OTHERS",
      "other": "OTHERS",
    };
    return categoryMap[category] || "OTHERS";
  };

  // Map form priority values to API values
  const mapPriorityToApi = (priority: string): string => {
    const priorityMap: { [key: string]: string } = {
      "Normal/Minor impact": "NORMAL",
      "Urgent": "URGENT",
      "High": "HIGH",
      "Low/Informational": "LOW",
    };
    return priorityMap[priority] || "NORMAL";
  };

  // Map API priority values to display values
  const mapPriorityToDisplay = (priority: string): string => {
    const priorityMap: { [key: string]: string } = {
      "NORMAL": "Normal/Minor impact",
      "URGENT": "Urgent",
      "HIGH": "High",
      "LOW": "Low/Informational",
    };
    return priorityMap[priority] || priority;
  };

  // Map API category values to display values
  const mapCategoryToDisplay = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      "DEPOSIT": "Deposit",
      "WITHDRAWAL": "Withdrawal",
      "CLOSING": "Closing",
      "OTHERS": "Other",
    };
    return categoryMap[category] || category;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // Basic validation
      if (!formData.category) {
        throw new Error("Please select a category");
      }
      if (!formData.message.trim()) {
        throw new Error("Please enter your message");
      }
      if (!formData.transactionPassword) {
        throw new Error("Please enter your transaction password");
      }
      if (!formData.oneTimePassword) {
        throw new Error("Please enter the OTP");
      }

      if (!user?.nodeId) {
        throw new Error("User node ID not found. Please login again.");
      }

      // Prepare API request
      const ticketData = {
        supportTicketPkId: null,
        category: mapCategoryToApi(formData.category),
        priority: mapPriorityToApi(formData.priority),
        userNodeId: user.nodeId,
        message: formData.message.trim(),
        status: "OPEN",
        updatedAtDateTime: null,
        transactionPassword: formData.transactionPassword,
        otp: formData.oneTimePassword,
      };

      // Call API
      await supportTicketApi.add(ticketData);

      setSuccess("Support ticket created successfully! We will respond within 24 hours.");
      setFormData({
        category: "",
        priority: "Normal/Minor impact",
        message: "",
        transactionPassword: "",
        oneTimePassword: "",
      });
      setIsOtpSent(false);

      // Refresh tickets list
      await fetchSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
            Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1.5"></span>
            In Progress
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return "N/A";
    }
  };

  const handleDeleteTicket = async (ticketId: number | null) => {
    if (!ticketId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this support ticket? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingTicketId(ticketId);
    setError("");
    setSuccess("");

    try {
      await supportTicketApi.delete(ticketId);
      setSuccess("Support ticket deleted successfully.");
      await fetchSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete support ticket. Please try again.");
    } finally {
      setDeletingTicketId(null);
    }
  };

  const handleUpdateTicketStatus = async (ticket: ApiSupportTicket, newStatus: string) => {
    if (!ticket.supportTicketPkId) return;

    setUpdatingTicketId(ticket.supportTicketPkId);
    setError("");
    setSuccess("");

    try {
      // Prepare update data - keep existing fields and update status
      const updateData = {
        ...ticket,
        status: newStatus,
        updatedAtDateTime: new Date().toISOString(),
      };

      await supportTicketApi.update(ticket.supportTicketPkId, updateData);
      setSuccess(`Support ticket status updated to ${newStatus} successfully.`);
      await fetchSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update support ticket. Please try again.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleEditTicket = (ticket: ApiSupportTicket) => {
    setEditingTicket(ticket);
    // Map API values back to form values
    const categoryValue = ticket.category === "DEPOSIT" ? "payment" :
      ticket.category === "WITHDRAWAL" ? "withdrawal" :
        ticket.category === "CLOSING" ? "other" : "other";

    const priorityValue = ticket.priority === "NORMAL" ? "Normal/Minor impact" :
      ticket.priority === "URGENT" ? "Urgent" :
        ticket.priority === "HIGH" ? "High" :
          ticket.priority === "LOW" ? "Low/Informational" : "Normal/Minor impact";

    setEditFormData({
      category: categoryValue,
      priority: priorityValue,
      message: ticket.message,
      status: ticket.status,
    });
    setIsEditModalOpen(true);
    setError("");
    setSuccess("");
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket?.supportTicketPkId) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Basic validation
      if (!editFormData.category) {
        throw new Error("Please select a category");
      }
      if (!editFormData.message.trim()) {
        throw new Error("Please enter your message");
      }

      // Prepare update data
      const updateData = {
        ...editingTicket,
        category: mapCategoryToApi(editFormData.category),
        priority: mapPriorityToApi(editFormData.priority),
        message: editFormData.message.trim(),
        status: editFormData.status,
        updatedAtDateTime: new Date().toISOString(),
      };

      await supportTicketApi.update(editingTicket.supportTicketPkId, updateData);
      setSuccess("Support ticket updated successfully!");
      setIsEditModalOpen(false);
      setEditingTicket(null);
      await fetchSupportTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-white mb-2">
          Support
        </h2>
        <nav>
          <ol className="flex items-center gap-2">
            {/* <li><a className="font-medium text-gray-300 hover:text-white" href="/">Home /</a></li> */}
            {/* <li><a className="font-medium text-gray-300 hover:text-white" href="/">Support /</a></li> */}
            {/* <li className="font-medium text-gray-300">Create Ticket</li> */}
          </ol>
        </nav>
      </div>

      {/* Fill Details Form */}
      {!isUserAdmin(user) && <div className="mb-8">
        <h3 className="font-bold text-white text-xl mb-6">
          Fill Details
        </h3>

        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mb-6">
                  <label className="mb-3 block text-white font-medium text-lg">
                    Category
                  </label>
                  <div className="relative z-20">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                    >
                      <option value="" className="bg-gray-700">Select Category--</option>
                      <option value="technical" className="bg-gray-700">Technical Support</option>
                      <option value="account" className="bg-gray-700">Account Issues</option>
                      <option value="payment" className="bg-gray-700">Payment Problems</option>
                      <option value="withdrawal" className="bg-gray-700">Withdrawal Issues</option>
                      <option value="general" className="bg-gray-700">General Inquiry</option>
                      <option value="other" className="bg-gray-700">Other</option>
                    </select>
                    <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.8">
                          <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF" />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-3 block text-white font-medium text-lg">
                    Priority
                  </label>
                  <div className="relative z-20">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="relative z-20 w-full appearance-none rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500"
                    >
                      <option value="Normal/Minor impact" className="bg-gray-700">Normal/Minor impact</option>
                      <option value="Urgent" className="bg-gray-700">Urgent</option>
                      <option value="High" className="bg-gray-700">High</option>
                      <option value="Low/Informational" className="bg-gray-700">Low/Informational</option>
                    </select>
                    <span className="absolute top-1/2 right-4 z-10 -translate-y-1/2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.8">
                          <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z" fill="#9CA3AF" />
                        </g>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              {/* <div className="mb-6">
                <label className="mb-3 block text-white font-medium text-lg">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Type message"
                  className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-4 px-6 text-white font-medium outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 hover:border-gray-500 placeholder-gray-400 resize-none"
                />
              </div> */}

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
                      <path d="M12 22S2 16 2 9A10 10 0 0 1 12 2A10 10 0 0 1 22 9C22 16 12 22 12 22Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="9" r="3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

              <div className="mb-8">
                <label className="mb-3 block text-white font-medium text-lg">
                  One Time Password
                </label>
                <div className="flex gap-3">
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
                        <path d="M12 22S2 16 2 9A10 10 0 0 1 12 2A10 10 0 0 1 22 9C22 16 12 22 12 22Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="9" r="3" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
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
      </div>}

      {/* All Tickets Table */}
      <div>
        <h3 className="font-bold text-white text-xl mb-6">All Tickets</h3>

        <div className="rounded-xl border border-gray-700 bg-gray-800 shadow-2xl backdrop-blur-sm">
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">#</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">UserNodeId</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Subject</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Message</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Priority</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Last Update</th>
                    <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {ticketsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                          <span className="ml-3 text-gray-400">Loading tickets...</span>
                        </div>
                      </td>
                    </tr>
                  ) : supportTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">No tickets found</p>
                          <p className="text-sm text-gray-500 mt-1">Create your first support ticket to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    supportTickets.map((ticket, index) => (
                      <tr key={ticket.supportTicketPkId || index} className="hover:bg-gray-700/50 transition-colors">
                        <td className="py-4 px-6 text-white font-medium">
                          {ticket.supportTicketPkId || index + 1}
                        </td>
                        <td className="py-4 px-6 text-white font-medium">
                          {mapCategoryToDisplay(ticket.userNodeId)}
                        </td>
                        <td className="py-4 px-6 text-white font-medium">
                          {mapCategoryToDisplay(ticket.category)}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          <div className="max-w-xs truncate" title={ticket.message}>
                            {ticket.message}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {mapPriorityToDisplay(ticket.priority)}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {formatDate(ticket.updatedAtDateTime || ticket.lastModifiedDateTime || ticket.createdDatetime)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit ticket"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>

                            {/* Update Status Button - Only show if ticket is not CLOSED */}
                            {ticket.status !== "CLOSED" && ticket.status !== "closed" && (
                              <button
                                onClick={() => handleUpdateTicketStatus(ticket, "CLOSED")}
                                disabled={updatingTicketId === ticket.supportTicketPkId}
                                className="px-3 py-1.5 text-xs font-medium text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Close ticket"
                              >
                                {updatingTicketId === ticket.supportTicketPkId ? (
                                  <span className="flex items-center gap-1">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                                    Closing...
                                  </span>
                                ) : (
                                  "Close"
                                )}
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteTicket(ticket.supportTicketPkId)}
                              disabled={deletingTicketId === ticket.supportTicketPkId}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete ticket"
                            >
                              {deletingTicketId === ticket.supportTicketPkId ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                              ) : (
                                <TrashBinIcon className="h-4 w-4" />
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

      {/* Edit Ticket Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[700px] m-4"
      >
        <div className="w-full max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 overflow-hidden">

          {/* Header */}
          <div className="flex flex-col px-6 py-5 bg-gradient-to-r from-black to-yellow-500">
            <h4 className="text-2xl font-semibold text-white">
              Edit Support Ticket
            </h4>
            <p className="text-sm text-gray-200 mt-1">
              Update the support ticket details.
            </p>
          </div>

          <div className="p-6">

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/40 p-3">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 rounded-lg border border-green-500/30 bg-green-900/40 p-3">
                <p className="text-sm text-green-200">{success}</p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col">

              {/* Scrollable Form */}
              <div className="max-h-[420px] overflow-y-auto pr-2">

                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white">
                  Ticket Details
                </h5>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* Category */}
                  <div>
                    <Label>Category</Label>
                    <select
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-3 px-4 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="">Select Category</option>
                      <option value="technical">Technical Support</option>
                      <option value="account">Account Issues</option>
                      <option value="payment">Payment Problems</option>
                      <option value="withdrawal">Withdrawal Issues</option>
                      <option value="general">General Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <Label>Priority</Label>
                    <select
                      name="priority"
                      value={editFormData.priority}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-3 px-4 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="Normal/Minor impact">Normal/Minor impact</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Low/Informational">Low/Informational</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-2">
                    <Label>Status</Label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-3 px-4 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="lg:col-span-2">
                    <Label>Message</Label>
                    <textarea
                      name="message"
                      value={editFormData.message}
                      onChange={handleEditInputChange}
                      rows={5}
                      placeholder="Type message"
                      className="w-full rounded-lg border-2 border-gray-600 bg-gray-700 py-3 px-4 text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 resize-none"
                    />
                  </div>

                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <Button size="sm" type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
