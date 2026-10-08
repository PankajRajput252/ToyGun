import { useState, useEffect } from 'react';
import { walletDataApi, WalletData, AddWalletDataRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserWallet = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingWalletId, setDeletingWalletId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AddWalletDataRequest>({
    walletPkId: null,
    mineWallet: 0,
    nodeWallet: 0,
    capitalWallet: 0,
    totalCredit: 0,
    totalDebit: 0,
    userFkId: 1 // Default user ID, you might want to get this from auth context
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await walletDataApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null);
      
      // Ensure all numeric values are properly converted
      const processedWalletData = response.content.map(wallet => ({
        ...wallet,
        mineWallet: Number(wallet.mineWallet) || 0,
        nodeWallet: Number(wallet.nodeWallet) || 0,
        capitalWallet: Number(wallet.capitalWallet) || 0,
        totalCredit: Number(wallet.totalCredit) || 0,
        totalDebit: Number(wallet.totalDebit) || 0,
        userFkId: Number(wallet.userFkId) || 1
      }));
      
      console.log('Processed wallet data from API:', processedWalletData);
      setWalletData(processedWalletData);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const addWallet = async () => {
    try {
      setIsAdding(true);
      setError(null);
      
      console.log('Adding wallet with data:', formData);
      
      const newWallet = await walletDataApi.add(formData);
      
      console.log('API response for add wallet:', newWallet);
      
      // If the API response doesn't contain the expected data, use the form data instead
      let walletToAdd;
      
      if (newWallet && newWallet.walletPkId) {
        // API returned a wallet object, use it with proper number conversion
        walletToAdd = {
          ...newWallet,
          mineWallet: Number(newWallet.mineWallet) || Number(formData.mineWallet) || 0,
          nodeWallet: Number(newWallet.nodeWallet) || Number(formData.nodeWallet) || 0,
          capitalWallet: Number(newWallet.capitalWallet) || Number(formData.capitalWallet) || 0,
          totalCredit: Number(newWallet.totalCredit) || Number(formData.totalCredit) || 0,
          totalDebit: Number(newWallet.totalDebit) || Number(formData.totalDebit) || 0,
          userFkId: Number(newWallet.userFkId) || Number(formData.userFkId) || 1
        };
      } else {
        // API didn't return proper data, create wallet from form data
        console.log('API response incomplete, using form data');
        walletToAdd = {
          walletPkId: Date.now(), // Temporary ID until refresh
          mineWallet: Number(formData.mineWallet) || 0,
          nodeWallet: Number(formData.nodeWallet) || 0,
          capitalWallet: Number(formData.capitalWallet) || 0,
          totalCredit: Number(formData.totalCredit) || 0,
          totalDebit: Number(formData.totalDebit) || 0,
          userFkId: Number(formData.userFkId) || 1,
          isGenericFlag: false,
          isDeleted: false
        };
      }
      
      console.log('Final wallet data to add:', walletToAdd);
      
      setWalletData(prev => [...prev, walletToAdd]);
      setShowAddModal(false);
      
      // Reset form
      setFormData({
        walletPkId: null,
        mineWallet: 0,
        nodeWallet: 0,
        capitalWallet: 0,
        totalCredit: 0,
        totalDebit: 0,
        userFkId: 1
      });
      
      console.log('Wallet added successfully');
      
      // Optionally refresh data to get the real wallet from server
      setTimeout(() => {
        console.log('Refreshing wallet data to get updated values...');
        fetchWalletData();
      }, 1000);
      
    } catch (err) {
      console.error('Error adding wallet:', err);
      setError(`Failed to add wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleInputChange = (field: keyof AddWalletDataRequest, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateWallet = async () => {
    if (!editingWallet) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      console.log('Updating wallet with data:', formData);
      
      const updatedWallet = await walletDataApi.update(editingWallet.walletPkId, formData);
      
      console.log('API response for update wallet:', updatedWallet);
      
      // Ensure the updated wallet has proper numeric values
      const walletWithNumbers = {
        ...updatedWallet,
        mineWallet: Number(updatedWallet.mineWallet) || 0,
        nodeWallet: Number(updatedWallet.nodeWallet) || 0,
        capitalWallet: Number(updatedWallet.capitalWallet) || 0,
        totalCredit: Number(updatedWallet.totalCredit) || 0,
        totalDebit: Number(updatedWallet.totalDebit) || 0,
        userFkId: Number(updatedWallet.userFkId) || 1
      };
      
      console.log('Processed updated wallet data:', walletWithNumbers);
      
      setWalletData(prev => prev.map(wallet => 
        wallet.walletPkId === editingWallet.walletPkId ? walletWithNumbers : wallet
      ));
      setShowEditModal(false);
      setEditingWallet(null);
      
      // Reset form
      setFormData({
        walletPkId: null,
        mineWallet: 0,
        nodeWallet: 0,
        capitalWallet: 0,
        totalCredit: 0,
        totalDebit: 0,
        userFkId: 1
      });
      
      console.log('Wallet updated successfully');
      
    } catch (err) {
      console.error('Error updating wallet:', err);
      setError(`Failed to update wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteWallet = async (walletId: number) => {
    // Check if this is a wallet with all zero values (might be a placeholder)
    const walletToDelete = walletData.find(w => w.walletPkId === walletId);
    if (walletToDelete) {
      const isZeroWallet = walletToDelete.mineWallet === 0 && 
                          walletToDelete.nodeWallet === 0 && 
                          walletToDelete.capitalWallet === 0 && 
                          walletToDelete.totalCredit === 0 && 
                          walletToDelete.totalDebit === 0;
      
      if (isZeroWallet) {
        console.log('Attempting to delete zero-value wallet:', walletToDelete);
      }
    }

    if (!window.confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingWalletId(walletId);
      setError(null); // Clear any previous errors
      
      console.log('Attempting to delete wallet with ID:', walletId);
      console.log('Wallet to delete:', walletToDelete);
      console.log('API endpoint will be:', `/api/individual/deleteWalletData/${walletId}`);
      
      // Call the delete API
      await walletDataApi.delete(walletId);
      
      console.log('Delete API call successful');
      
      // Update the local state to remove the deleted wallet
      setWalletData(prev => {
        const updatedData = prev.filter(wallet => wallet.walletPkId !== walletId);
        console.log('Updated wallet data after deletion:', updatedData);
        console.log('Remaining wallets:', updatedData.length);
        return updatedData;
      });
      
      console.log('Wallet deleted successfully');
      
    } catch (err) {
      console.error('Error deleting wallet:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        walletId: walletId,
        walletData: walletToDelete,
        error: err
      });
      setError(`Failed to delete wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setDeletingWalletId(null);
    }
  };

  const handleEditWallet = (wallet: WalletData) => {
    setEditingWallet(wallet);
    setFormData({
      walletPkId: wallet.walletPkId,
      mineWallet: wallet.mineWallet,
      nodeWallet: wallet.nodeWallet,
      capitalWallet: wallet.capitalWallet,
      totalCredit: wallet.totalCredit,
      totalDebit: wallet.totalDebit,
      userFkId: wallet.userFkId
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchWalletData}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your wallet balances and transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Add Wallet</span>
        </button>
      </div>

      {walletData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Wallet Data</h3>
          <p className="text-gray-600 dark:text-gray-400">Your wallet data will appear here once available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {walletData.map((wallet) => {
            // Check if this is a zero-value wallet
            const isZeroWallet = wallet.mineWallet === 0 && 
                                wallet.nodeWallet === 0 && 
                                wallet.capitalWallet === 0 && 
                                wallet.totalCredit === 0 && 
                                wallet.totalDebit === 0;
            
            return (
              <div key={`wallet-${wallet.walletPkId}`} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 ${isZeroWallet ? 'border-2 border-red-300 dark:border-red-600' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Wallet #{wallet.walletPkId}
                    {isZeroWallet && <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">Zero Values</span>}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    User ID: {wallet.userFkId}
                  </span>
                </div>

              <div className="space-y-4">
                {/* Mine Wallet */}
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Mine Wallet</span>
                  </div>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(wallet.mineWallet)}
                  </span>
                </div>

                {/* Node Wallet */}
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">N</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Node Wallet</span>
                  </div>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(wallet.nodeWallet)}
                  </span>
                </div>

                {/* Capital Wallet */}
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">C</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">Capital Wallet</span>
                  </div>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(wallet.capitalWallet)}
                  </span>
                </div>

                {/* Total Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Credit</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(wallet.totalCredit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Debit</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(wallet.totalDebit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold text-gray-900 dark:text-white">Net Balance</span>
                    <span className={`font-bold ${
                      (wallet.totalCredit - wallet.totalDebit) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatCurrency(wallet.totalCredit - wallet.totalDebit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wallet Actions */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-wrap gap-2 mb-3">
                  <button className="flex-1 px-3 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 transition-colors">
                    Deposit
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors">
                    Withdraw
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                    Transfer
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditWallet(wallet)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => deleteWallet(wallet.walletPkId)}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>
                      {deletingWalletId === wallet.walletPkId ? 'Deleting...' : 'Delete'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 dark:text-red-200 font-medium">Error:</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={fetchWalletData}
          className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Refresh Wallet Data
        </button>
      </div>

      {/* Add Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Wallet</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); addWallet(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mine Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mineWallet}
                  onChange={(e) => handleInputChange('mineWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter mine wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Node Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nodeWallet}
                  onChange={(e) => handleInputChange('nodeWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter node wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capital Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capitalWallet}
                  onChange={(e) => handleInputChange('capitalWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter capital wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Credit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCredit}
                  onChange={(e) => handleInputChange('totalCredit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter total credit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Debit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalDebit}
                  onChange={(e) => handleInputChange('totalDebit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter total debit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="number"
                  value={formData.userFkId}
                  onChange={(e) => handleInputChange('userFkId', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter user ID"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? 'Adding...' : 'Add Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wallet Modal */}
      {showEditModal && editingWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Wallet #{editingWallet.walletPkId}</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWallet(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); updateWallet(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mine Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.mineWallet}
                  onChange={(e) => handleInputChange('mineWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter mine wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Node Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.nodeWallet}
                  onChange={(e) => handleInputChange('nodeWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter node wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capital Wallet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capitalWallet}
                  onChange={(e) => handleInputChange('capitalWallet', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter capital wallet amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Credit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalCredit}
                  onChange={(e) => handleInputChange('totalCredit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter total credit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Debit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalDebit}
                  onChange={(e) => handleInputChange('totalDebit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter total debit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="number"
                  value={formData.userFkId}
                  onChange={(e) => handleInputChange('userFkId', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter user ID"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingWallet(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Update Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWallet;
