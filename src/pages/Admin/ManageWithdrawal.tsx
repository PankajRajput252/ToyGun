import React, { useState, useEffect, useMemo } from 'react';
import PageMeta from '../../components/common/PageMeta';
import AdminModal, { FormField } from '../../components/admin/AdminModal';
import { manageWithdrawalApi, WithdrawalType, sellRequestApi, SellRequestUser } from '../../services/api';

export default function SellRequests() {
    const [withdrawals, setWithdrawals] = useState<SellRequestUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWithdrawal, setEditingWithdrawal] = useState<WithdrawalType | null>(null);
    const [modalError, setModalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [error, setError] = useState('');

    // Fetch Withdrawal types from API
    const fetchWithdrawals = async () => {
        try {
            setIsLoading(true);
            setError('');
            console.log('Fetching withdrawals...');

            const response = await sellRequestApi.getAll(1, 25, 'ACTIVE');
            console.log('API Response: ram', response);

            // Check different possible response structures
            if (response && response.content && Array.isArray(response.content)) {
                console.log("one");
                setWithdrawals(response.content);
            } else {
                console.warn('Unexpected API response structure:', response);
                setWithdrawals([]);
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            setError('Failed to load withdrawals. Please try again.');
            setWithdrawals([]);
        } finally {
            setIsLoading(false);
        }
    };
    console.log('withdrawals qwert juik', withdrawals)
    useEffect(() => {
        fetchWithdrawals();
    }, []);
    const handleApproveWithdrawal = async (withdrawal: WithdrawalType) => {
        if (!window.confirm(`Are you sure you want to approve withdrawal request from ${withdrawal.userName}?`)) {
            return;
        }

        try {
            setIsLoading(true);
            // Call your approve API
            await manageWithdrawalApi.add(withdrawal?.withdrawalRequestPkId);
            await fetchWithdrawals(); // Refresh the list
            alert('Withdrawal approved successfully!');
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            alert('Failed to approve withdrawal. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectWithdrawal = async (withdrawal: WithdrawalType) => {
        if (!window.confirm(`Are you sure you want to reject withdrawal request from ${withdrawal.userName}?`)) {
            return;
        }

        try {
            setIsLoading(true);
            // Call your reject API
            await manageWithdrawalApi.reject(withdrawal.withdrawalRequestPkId);
            await fetchWithdrawals(); // Refresh the list
            alert('Withdrawal rejected successfully!');
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            alert('Failed to reject withdrawal. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    const handleAddWithdrawal = () => {
        setEditingWithdrawal(null);
        setModalError('');
        setIsModalOpen(true);
    };

    const handleEditWithdrawal = (withdrawal: WithdrawalType) => {
        setEditingWithdrawal(withdrawal);
        setModalError('');
        setIsModalOpen(true);
    };

    const handleDeleteWithdrawal = async (withdrawalId: number) => {
        if (!window.confirm('Are you sure you want to delete this withdrawal?')) {
            return;
        }

        try {
            await manageWithdrawalApi.delete(withdrawalId);
            await fetchWithdrawals(); // Refresh the list
        } catch (error) {
            console.error('Error deleting withdrawal:', error);
            alert('Failed to delete withdrawal. Please try again.');
        }
    };
    const handlePaymentAction = async (
        paymentId: number,
        status: 'APPROVED' | 'REJECTED',
        approvedAt?: string
    ) => {
        try {
            const finalApprovedAt =
                approvedAt ?? new Date().toISOString().split('T')[0];

            await sellRequestApi.update(paymentId, {
                status,
                approvedAt: finalApprovedAt,
            });

            await fetchWithdrawals();
        } catch (error) {
            console.error(`Error updating payment status to ${status}`, error);
            alert('Failed to update payment status');
        }
    };


    const handleModalSubmit = async (formData: any) => {
        try {
            setIsSubmitting(true);
            setModalError('');

            if (editingWithdrawal) {
                // Update existing withdrawal
                await manageWithdrawalApi.update(editingWithdrawal.withdrawalRequestPkId!, {
                    // Add your update fields here
                });
            } else {
                // Add new withdrawal
                // await manageWithdrawalApi.add({
                //     // Add your creation fields here
                // });
            }

            await fetchWithdrawals(); // Refresh the list
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving withdrawal:', error);
            setModalError(error instanceof Error ? error.message : 'Failed to save withdrawal');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter and paginate withdrawals
    const filteredWithdrawals = useMemo(() => {
        return (withdrawals || []).filter(withdrawal =>
        (withdrawal.userNodeId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            withdrawal.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            withdrawal.finalAmount?.toString().includes(searchTerm))
        );
    }, [withdrawals, searchTerm]);
    console.log("filteredWithdrawals this form", filteredWithdrawals)
    const totalPages = Math.ceil(filteredWithdrawals.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    // Format amount for display
    const formatAmount = (amount: number) => {
        if (!amount) return '—';
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <>
            <PageMeta
                title="Sell Request - Admin"
                description="Admin panel for managing Sell requests"
            />

            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
                {/* Breadcrumb */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-title-md2 font-semibold text-white">
                        Sell Request
                    </h2>
                    <nav>
                        <ol className="flex items-center gap-2">
                            {/* <li><a className="font-medium text-gray-300 hover:text-white" href="/">Home /</a></li>
                            <li><a className="font-medium text-gray-300 hover:text-white" href="/admin">Admin /</a></li> */}
                            <li className="font-medium text-orange-500">Sell Request</li>
                        </ol>
                    </nav>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                        {error}
                    </div>
                )}

                {/* Admin Panel */}
                <div className="bg-[rgb(16_16_16_/1)] rounded-xl border border-[rgb(35_35_35_/1)] shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-white font-bold text-xl">Sell Requests</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search Sell Req..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full sm:w-64 rounded-lg border-2 border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                                    />
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {/* <button
                                    onClick={handleAddWithdrawal}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Withdrawal
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                            <p className="text-gray-400 mt-2">Loading Sell requests...</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                                        <tr>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">#</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">User NodeId</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">CONTAINER TYPE</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">CURRENCY CODE</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Requested Amount</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Requested Date/Time</th>
                                            <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {withdrawals?.length > 0 ? (
                                            withdrawals?.map((withdrawal, index) => (
                                                console.log("withdrawalwithdrawal", withdrawal),
                                                <tr key={withdrawal.investmentPkId} className="hover:bg-gray-700/50 transition-colors">
                                                    <td className="py-4 px-6 text-white font-medium">{startIndex + index + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold">
                                                                {withdrawal?.user?.name?.toString().charAt(0) || 'U'}
                                                            </div>
                                                            <span className="text-white font-semibold">{withdrawal.investment?.userFkId || '—'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300 font-semibold">
                                                        {withdrawal?.investment?.containerType || '—'}
                                                    </td>
                                                    <td className="py-4 px-6 text-green-400 font-mono font-bold">
                                                        {formatAmount(withdrawal?.investment?.currency)}
                                                    </td>
                                                    <td className="py-4 px-6 text-orange-400 font-mono font-bold">
                                                        {formatAmount(withdrawal.final_amount)}
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300">
                                                        {formatDate(withdrawal.requestedAt)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handlePaymentAction(withdrawal?.sellRequestPkId, 'APPROVED')}
                                                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handlePaymentAction(withdrawal?.sellRequestPkId, 'REJECTED')}
                                                                className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                                Reject
                                                            </button>
                                                            {/* <button
                                                                onClick={() => handleEditWithdrawal(withdrawal)}
                                                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button> */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center">
                                                    <div className="text-gray-400">
                                                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="text-lg font-medium">No Sell requests found</p>
                                                        {searchTerm && (
                                                            <p className="text-sm mt-2">Try adjusting your search terms</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredWithdrawals.length > 0 && (
                                <div className="px-6 py-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <span>Showing {startIndex + 1} to {Math.min(endIndex, filteredWithdrawals.length)} of {filteredWithdrawals.length} entries</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-600 bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${page === currentPage
                                                    ? "bg-orange-500 text-white"
                                                    : "text-gray-400 bg-gray-700 border border-gray-600 hover:text-white hover:bg-gray-600"
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-600 bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal */}
                <AdminModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    title={editingWithdrawal ? 'Edit Withdrawal' : 'Add New Withdrawal'}
                    fields={[]} // Add your form fields here
                    initialData={editingWithdrawal}
                    isLoading={isSubmitting}
                    error={modalError}
                />
            </div>
        </>
    );
}
