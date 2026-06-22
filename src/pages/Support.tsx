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

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const fetchSupportTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await supportTicketApi.getAll(0, 25, "ACTIVE", null);
      setSupportTickets(response.content || []);
    } catch (err) {
      console.error("Failed to fetch support tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async () => {
    setOtpLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsOtpSent(true);
      setSuccess("OTP sent successfully to your registered email/mobile");
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const mapCategoryToApi = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      technical: "OTHERS",
      account: "OTHERS",
      payment: "DEPOSIT",
      withdrawal: "WITHDRAWAL",
      general: "OTHERS",
      other: "OTHERS",
    };
    return categoryMap[category] || "OTHERS";
  };

  const mapPriorityToApi = (priority: string): string => {
    const priorityMap: { [key: string]: string } = {
      "Normal/Minor impact": "NORMAL",
      Urgent: "URGENT",
      High: "HIGH",
      "Low/Informational": "LOW",
    };
    return priorityMap[priority] || "NORMAL";
  };

  const mapPriorityToDisplay = (priority: string): string => {
    const priorityMap: { [key: string]: string } = {
      NORMAL: "Normal/Minor impact",
      URGENT: "Urgent",
      HIGH: "High",
      LOW: "Low/Informational",
    };
    return priorityMap[priority] || priority;
  };

  const mapCategoryToDisplay = (category: string): string => {
    const categoryMap: { [key: string]: string } = {
      DEPOSIT: "Deposit",
      WITHDRAWAL: "Withdrawal",
      CLOSING: "Closing",
      OTHERS: "Other",
    };
    return categoryMap[category] || category;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!formData.category) throw new Error("Please select a category");
      if (!formData.message.trim()) throw new Error("Please enter your message");
      if (!formData.transactionPassword) throw new Error("Please enter your transaction password");
      if (!formData.oneTimePassword) throw new Error("Please enter the OTP");
      if (!user?.nodeId) throw new Error("User node ID not found. Please login again.");

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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
            Open
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
            In Progress
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></span>
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
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
    const categoryValue =
      ticket.category === "DEPOSIT" ? "payment" : ticket.category === "WITHDRAWAL" ? "withdrawal" : "other";
    const priorityValue =
      ticket.priority === "NORMAL"
        ? "Normal/Minor impact"
        : ticket.priority === "URGENT"
        ? "Urgent"
        : ticket.priority === "HIGH"
        ? "High"
        : ticket.priority === "LOW"
        ? "Low/Informational"
        : "Normal/Minor impact";

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

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket?.supportTicketPkId) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!editFormData.category) throw new Error("Please select a category");
      if (!editFormData.message.trim()) throw new Error("Please enter your message");

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
    <div className="bg-black min-h-screen">
      <div className="mx-auto max-w-screen-xl p-4 md:p-6 2xl:p-10">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Support Centre</h2>
          <p className="text-gray-500 text-sm mt-1">
            Raise a ticket and our team will get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Form ── */}
          {!isUserAdmin(user) && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-lg">Raise a Ticket</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Fill in the details below</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="p-6 space-y-5">

                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}
                    {success && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="text-sm text-green-700">{success}</p>
                      </div>
                    )}

                    {/* Category */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                   text-gray-800 outline-none focus:border-yellow-500
                                   focus:ring-2 focus:ring-yellow-500/20"
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
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                   text-gray-800 outline-none focus:border-yellow-500
                                   focus:ring-2 focus:ring-yellow-500/20"
                      >
                        <option value="Normal/Minor impact">Normal/Minor impact</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Low/Informational">Low/Informational</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Describe your issue..."
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                   text-gray-800 outline-none focus:border-yellow-500
                                   focus:ring-2 focus:ring-yellow-500/20 resize-none placeholder-gray-400"
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-black to-yellow-500 text-white font-semibold
                                 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50
                                 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Submitting..." : "Submit Ticket"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── RIGHT: Tickets list ── */}
          <div className={isUserAdmin(user) ? "lg:col-span-3" : "lg:col-span-2"}>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">All Tickets</h3>
                <span className="text-xs text-gray-400">{supportTickets.length} total</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">User</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Category</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Message</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Priority</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Updated</th>
                      <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ticketsLoading ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
                            <span className="text-gray-400 text-sm">Loading tickets...</span>
                          </div>
                        </td>
                      </tr>
                    ) : supportTickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          <p className="text-gray-400 text-sm">
                            No tickets found. Submit one to get started.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      supportTickets.map((ticket, index) => (
                        <tr key={ticket.supportTicketPkId || index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-6 text-gray-700 font-medium">
                            {ticket.supportTicketPkId || index + 1}
                          </td>
                          <td className="py-3.5 px-6 text-gray-700">{ticket.userNodeId}</td>
                          <td className="py-3.5 px-6 text-gray-700">{mapCategoryToDisplay(ticket.category)}</td>
                          <td className="py-3.5 px-6 text-gray-500">
                            <div className="max-w-xs truncate" title={ticket.message}>
                              {ticket.message}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-gray-500">{mapPriorityToDisplay(ticket.priority)}</td>
                          <td className="py-3.5 px-6">{getStatusBadge(ticket.status)}</td>
                          <td className="py-3.5 px-6 text-gray-500">
                            {formatDate(ticket.updatedAtDateTime || ticket.lastModifiedDateTime || ticket.createdDatetime)}
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditTicket(ticket)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit ticket"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>

                              {ticket.status !== "CLOSED" && ticket.status !== "closed" && (
                                <button
                                  onClick={() => handleUpdateTicketStatus(ticket, "CLOSED")}
                                  disabled={updatingTicketId === ticket.supportTicketPkId}
                                  className="px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-50
                                             hover:bg-yellow-100 rounded-lg transition disabled:opacity-50"
                                  title="Close ticket"
                                >
                                  {updatingTicketId === ticket.supportTicketPkId ? "..." : "Close"}
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTicket(ticket.supportTicketPkId)}
                                disabled={deletingTicketId === ticket.supportTicketPkId}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg
                                           transition disabled:opacity-50"
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
      </div>

      {/* ── Edit Ticket Modal ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-[700px] m-4"
      >
        <div className="w-full max-w-[700px] rounded-2xl bg-white overflow-hidden">

          <div className="flex flex-col px-6 py-5 bg-gradient-to-r from-black to-yellow-500">
            <h4 className="text-xl font-semibold text-white">Edit Support Ticket</h4>
            <p className="text-sm text-gray-100 mt-1">Update the support ticket details.</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex flex-col">
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  <div>
                    <Label>Category</Label>
                    <select
                      name="category"
                      value={editFormData.category}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                 text-gray-800 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
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

                  <div>
                    <Label>Priority</Label>
                    <select
                      name="priority"
                      value={editFormData.priority}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                 text-gray-800 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option value="Normal/Minor impact">Normal/Minor impact</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Low/Informational">Low/Informational</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Status</Label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                 text-gray-800 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Message</Label>
                    <textarea
                      name="message"
                      value={editFormData.message}
                      onChange={handleEditInputChange}
                      rows={5}
                      placeholder="Type message"
                      className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm
                                 text-gray-800 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 resize-none"
                    />
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isLoading}>
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