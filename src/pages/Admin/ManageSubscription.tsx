import { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import AdminModal, { FormField } from '../../components/admin/AdminModal';
import { PopupModal } from '../Dashboard/PopupModal'; 
import { subscriptionIncomeTypeApi, SubscriptionType, AddSubscriptionTypeRequest } from '../../services/api';

export default function ManageSubscription() {
  const [incomeTypes, setIncomeTypes] = useState<SubscriptionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncomeType, setEditingIncomeType] = useState<SubscriptionType | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Popup Modal States for Delete Confirmation
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<SubscriptionType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch SubscriptionType types from API
  const fetchIncomeTypes = async () => {
    try {
      setIsLoading(true);
      const response = await subscriptionIncomeTypeApi.getAll(currentPage - 1, rowsPerPage, 'ACTIVE');
      setIncomeTypes(response.content);
    } catch (error) {
      console.error('Error fetching income types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeTypes();
  }, [currentPage, rowsPerPage]);

  // Modal form fields
  const incomeTypeFields: FormField[] = [
    {
      name: 'subscriptionName',
      label: 'Subscription Name',
      type: 'text',
      placeholder: 'Enter subscription type name',
      required: true
    },
    {
      name: 'amount',
      label: 'Subscription Amount',
      type: 'number',
      placeholder: 'Subscription Amount',
      required: true,
    },
  ];

  const handleAddIncomeType = () => {
    setEditingIncomeType(null);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleEditIncomeType = (subscriptionType: SubscriptionType) => {
    setEditingIncomeType(subscriptionType);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (subscriptionType: SubscriptionType) => {
    setSubscriptionToDelete(subscriptionType);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subscriptionToDelete) return;

    try {
      setDeleteLoading(true);
      await subscriptionIncomeTypeApi.delete(subscriptionToDelete.subscriptionDefinitionPkId!);
      await fetchIncomeTypes(); // Refresh the list
      
      // Close the popup after successful deletion
      setShowDeletePopup(false);
      setSubscriptionToDelete(null);
    } catch (error) {
      console.error('Error deleting subscription type:', error);
      // Show error in popup or alert
      setShowDeletePopup(false);
      alert('Failed to delete subscription type. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeletePopup(false);
    setSubscriptionToDelete(null);
  };

  const handleModalSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setModalError('');

      if (editingIncomeType) {
        // Update existing income type
        await subscriptionIncomeTypeApi.update(editingIncomeType.subscriptionDefinitionPkId!, {
          subscriptionName: formData.subscriptionName,
          subscriptionAmount: Number(formData.amount),
        });
      } else {
        // Add new income type
        const addData: AddSubscriptionTypeRequest = {
          subscriptionDefinitionPkId: null,
          subscriptionName: formData.subscriptionName,
          subscriptionAmount: Number(formData.amount),
        };
        console.log(addData);
        await subscriptionIncomeTypeApi.add(addData);
      }

      await fetchIncomeTypes(); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving income type:', error);
      setModalError(error instanceof Error ? error.message : 'Failed to save income type');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and paginate income types
  const filteredIncomeTypes = (incomeTypes || []).filter(subscriptionTypes =>
    subscriptionTypes.subscriptionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subscriptionTypes.subscriptionName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredIncomeTypes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentIncomeTypes = filteredIncomeTypes.slice(startIndex, endIndex);

  const getIncomeTypeIcon = (incomeName: string) => {
    const name = incomeName.toLowerCase();
    if (name.includes('service')) return '⚙️';
    if (name.includes('matching')) return '🔗';
    if (name.includes('club')) return '👥';
    if (name.includes('reward')) return '🏆';
    if (name.includes('mining')) return '⛏️';
    if (name.includes('fast')) return '⚡';
    if (name.includes('node')) return '🟢';
    return '💰';
  };

  const formatDate = (dateValue: string | number | null | undefined) => {
  if (!dateValue) return '—';
  
  try {
    const date = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

  return (
    <>
      <PageMeta
        title="Manage Subscription - Admin"
        description="Admin panel for managing income types and percentages"
      />
      
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-white">
            Manage Subscription
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/">Home /</a></li>
              <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/admin">Admin /</a></li>
              <li className="font-medium text-orange-500">Manage Subscription</li>
            </ol>
          </nav>
        </div>

        {/* Admin Panel */}
        <div className="bg-[rgb(16_16_16_/1)] rounded-xl border border-[rgb(35_35_35_/1)] shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-white font-bold text-xl">Subscription Management</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search Subscription types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 rounded-lg border-2 border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={handleAddIncomeType}
                  className="px-4 py-2 bg-gradient-to-r from-black to-yellow-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Subscription
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading subscription types...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">#</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Subscription Type</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Amount</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Start Date</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">End Date</th>
                      <th className="text-left py-4 px-6 font-bold text-white text-sm uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {currentIncomeTypes.length > 0 ? (
                      currentIncomeTypes.map((subscriptionTypes, index) => (
                        <tr key={subscriptionTypes.subscriptionDefinitionPkId} className="hover:bg-gray-700/50 transition-colors">
                          <td className="py-4 px-6 text-white font-medium">{startIndex + index + 1}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg">
                                {getIncomeTypeIcon(subscriptionTypes.subscriptionName)}
                              </div>
                              <span className="text-white font-semibold">{subscriptionTypes.subscriptionName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-gray-300 font-semibold">
                            ${subscriptionTypes.subscriptionAmount?.toLocaleString() ?? '—'}
                          </td>
                          <td className="py-4 px-6 text-gray-300 font-mono">
                            {formatDate(subscriptionTypes.subscriptionStartDateTime)}
                          </td>
                          <td className="py-4 px-6 text-gray-300 font-mono">
                            {formatDate(subscriptionTypes.subscriptionEndDateTime)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditIncomeType(subscriptionTypes)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(subscriptionTypes)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
                            <p className="text-lg font-medium">No Subscription types found</p>
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
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        page === currentPage
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
          title={editingIncomeType ? 'Edit Subscription Type' : 'Add New Subscription Type'}
          fields={incomeTypeFields}
          initialData={editingIncomeType}
          isLoading={isSubmitting}
          error={modalError}
        />

        {/* Delete Confirmation Popup Modal */}
        <PopupModal
          isOpen={showDeletePopup}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Subscription Type"
          message={
            subscriptionToDelete 
              ? `Are you sure you want to delete the subscription type ${subscriptionToDelete.subscriptionName}`
              : "Are you sure you want to delete this subscription type?"
          }
          type="error"
          confirmText={deleteLoading ? "Deleting..." : "Delete"}
          cancelText="Cancel"
          showCheckmark={false}
          position="center"
        />
      </div>
    </>
  );
}