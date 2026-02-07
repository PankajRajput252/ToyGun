import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import AdminModal, { FormField } from '../../components/admin/AdminModal';
import { PopupModal } from '../Dashboard/PopupModal';
import { rankRewardApi, RankReward, AddRankRewardRequest, containerPaymentApiData, PaymentUser } from '../../services/api';

export default function ManageRankReward() {
  const [ranks, setRanks] = useState<RankReward[]>([]);
  const [rankMaster, setrankMaster] = useState<PaymentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState<RankReward | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Popup Modal States
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [rankToDelete, setRankToDelete] = useState<RankReward | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  console.log("rankMaster in income rank", rankMaster);

  // Fetch ranks from API
  const fetchRanks = async () => {
    try {
      setIsLoading(true);
      // const response = await rankRewardApi.getAll(currentPage - 1, rowsPerPage, 'ACTIVE');
      const response = await containerPaymentApiData.getAll(0, 25, 'ACTIVE');
      // setRanks(response.content);
      setrankMaster(response.content);
    } catch (error) {
      console.error('Error fetching ranks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, [currentPage, rowsPerPage]);

  // Prepare dropdown options from rankMaster
  // const rankNameOptions = rankMaster.map(rank => ({
  //   value: rank.rankName,
  //   label: rank.rankName
  // }));

  // Modal form fields
  const rankFields: FormField[] = [
    {
      name: 'rankName',
      label: 'Rank Name',
      type: 'select',
      placeholder: 'Select rank name',
      required: true,
      // options: rankNameOptions
    },
    {
      name: 'userNodeId',
      label: 'User Node ID',
      type: 'text',
      placeholder: 'Enter User Node ID',
      required: true
    },
    {
      name: 'matching',
      label: 'Matching Requirement',
      type: 'number',
      placeholder: 'Enter matching requirement',
      required: true,
      min: 0
    },
    {
      name: 'reward',
      label: 'Reward Amount',
      type: 'number',
      placeholder: 'Enter reward amount',
      required: true,
      min: 0,
      step: 0.01
    },
    {
      name: 'achieved',
      label: 'Achieved',
      type: 'checkbox'
    }
  ];

  const handleAddRank = () => {
    setEditingRank(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditRank = (rank: RankReward) => {
    setEditingRank(rank);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (rank: RankReward) => {
    setRankToDelete(rank);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rankToDelete) return;

    try {
      setDeleteLoading(true);
      await rankRewardApi.delete(rankToDelete.rankId!);
      await fetchRanks(); // Refresh the list

      setShowDeletePopup(false);
      setRankToDelete(null);
    } catch (error) {
      console.error('Error deleting rank:', error);
      setShowDeletePopup(false);
      alert('Failed to delete rank. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
    setRankToDelete(null);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setModalError('');

      if (editingRank) {
        // Update existing rank
        await rankRewardApi.update(editingRank.rankId!, formData);
      } else {
        // Add new rank
        const addData: AddRankRewardRequest = {
          rankId: null,
          rankName: formData.rankName,
          userNodeId: formData.userNodeId,
          matching: Number(formData.matching),
          reward: Number(formData.reward),
          achieved: formData.achieved || false
        };
        await rankRewardApi.add(addData);
      }

      await fetchRanks(); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving rank:', error);
      setModalError(error instanceof Error ? error.message : 'Failed to save rank');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePaymentAction = async (
    paymentId: number,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      await containerPaymentApiData.update(paymentId, { status });

      // Refresh list after update
      await fetchRanks();
    } catch (error) {
      console.error(`Error updating payment status to ${status}`, error);
      alert('Failed to update payment status');
    }
  };

  // Filter and paginate ranks
  const filteredRanks = (rankMaster || []).filter(payment => {
    const matchesSearch = payment.userFkId
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  const totalPages = Math.ceil(filteredRanks.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRanks = filteredRanks.slice(startIndex, endIndex);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getStatusBadge = (achieved: boolean) => {
    if (achieved) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
          Achieved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
        Not Achieved
      </span>
    );
  };

  return (
    <>
      <PageMeta
        title="Payment Approval - Admin"
        description="Admin panel for managing rank and reward system"
      />

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-white">
            Payment Approval
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              {/* <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/">Home /</a></li>
              <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/admin">Admin /</a></li> */}
              <li className="font-medium text-orange-500">Payment Approval</li>
            </ol>
          </nav>
        </div>

        {/* Admin Panel */}
        <div className="bg-[rgb(16_16_16_/1)] rounded-xl border border-[rgb(35_35_35_/1)] shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-white font-bold text-xl">Admin Payment Approval</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-lg border border-gray-600 bg-gray-700 px-5 py-5 text-white cursor-pointer"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading ranks...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">#</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">User Id</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">User Name</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Currency</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Amount</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">View Document</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {currentRanks.length > 0 ? (
                      currentRanks.map((payment, index) => (
                        <tr key={payment.paymentPkId} className="hover:bg-gray-700/50 transition-colors">

                          {/* Serial No */}
                          <td className="py-4 px-6 text-white font-medium">
                            {startIndex + index + 1}
                          </td>

                          {/* User ID */}
                          <td className="py-4 px-6 text-white">
                            {payment.userFkId}
                          </td>

                          {/* User Name */}
                          <td className="py-4 px-6 text-white">
                            {payment.user?.name || '-'}
                          </td>

                          {/* Currency */}
                          <td className="py-4 px-6 text-gray-300">
                            {payment.currency}
                          </td>

                          {/* Amount */}
                          <td className="py-4 px-6 text-green-400 font-bold">
                            ₹{Number(payment.amount).toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium
                              ${payment.status === 'PENDING' && 'bg-yellow-100 text-yellow-800'}
                              ${payment.status === 'APPROVED' && 'bg-green-100 text-green-800'}
                              ${payment.status === 'REJECTED' && 'bg-red-100 text-red-800'}
                            `}>
                              {payment.status}
                            </span>
                          </td>

                          {/* View Document */}
                          <td className="py-4 px-6">
                            {payment.imageUrl ? (
                              <a
                                href={payment.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">

                              {payment.status === 'PENDING' ? (
                                <button
                                  onClick={() =>
                                    handlePaymentAction(payment.paymentPkId, 'APPROVED')
                                  }
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                                >
                                  Approve
                                </button>
                              ) : (
                                <span className="text-red-500 font-semibold">-</span>
                              )}

                              {payment.status === 'PENDING' ? (
                                <button
                                  onClick={() =>
                                    handlePaymentAction(payment.paymentPkId, 'REJECTED')
                                  }
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                                >
                                  Reject
                                </button>
                              ) : (
                                <span className="text-red-500 font-semibold">-</span>
                              )}


                            </div>
                          </td>

                        </tr>
                      ))

                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="text-gray-400">
                            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">No ranks found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <span>Row Per Page</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-white text-sm"
                  >
                    <option value={5} className="bg-gray-700">5</option>
                    <option value={10} className="bg-gray-700">10</option>
                    <option value={25} className="bg-gray-700">25</option>
                    <option value={50} className="bg-gray-700">50</option>
                  </select>
                  <span>Entries</span>
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
            </>
          )}
        </div>

        {/* Admin Modal for Add/Edit */}
        <AdminModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          title={editingRank ? 'Edit Rank' : 'Add New Rank'}
          fields={rankFields}
          initialData={editingRank}
          isLoading={isSubmitting}
          error={modalError}
        />
        <PopupModal
          isOpen={showDeletePopup}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Rank"
          message={
            rankToDelete
              ? `Are you sure you want to delete the rank ${rankToDelete.rankName}`
              : "Are you sure you want to delete this rank?"
          }
          type="error"
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          showCheckmark={false}
        />
      </div>
    </>
  );
}