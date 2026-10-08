import React, { useState } from 'react';
import { User, WalletData, usersApi } from '../../services/api';

interface TransactionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  user?: User;
  walletData?: WalletData;
}

const TransactionApprovalModal: React.FC<TransactionApprovalModalProps> = ({
  isOpen,
  onClose,
  userId,
  user,
  walletData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [walletType, setWalletType] = useState<'mine' | 'node' | 'capital'>('mine');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (approved: boolean) => {
    try {
      setIsLoading(true);
      setError('');

      // In a real implementation, this would call the actual transaction approval API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock API call - replace with actual API call
      console.log('Transaction approval:', {
        userId,
        approved,
        transactionType,
        amount: parseFloat(amount),
        walletType,
        notes
      });

      alert(`Transaction ${approved ? 'approved' : 'rejected'} successfully!`);
      onClose();
    } catch (err) {
      setError('Failed to process transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTransactionType('deposit');
    setAmount('');
    setWalletType('mine');
    setNotes('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Transaction Approval
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* User Information */}
          {user && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {user.name}</p>
                <p><span className="font-medium">Node ID:</span> {user.nodeId}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Country:</span> {user.country}</p>
              </div>
            </div>
          )}

          {/* Current Wallet Balances */}
          {walletData && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Current Wallet Balances</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Mine Wallet:</span> ${walletData.mineWallet.toFixed(2)}</p>
                <p><span className="font-medium">Node Wallet:</span> ${walletData.nodeWallet.toFixed(2)}</p>
                <p><span className="font-medium">Capital Wallet:</span> ${walletData.capitalWallet.toFixed(2)}</p>
                <p><span className="font-medium">Total Credit:</span> ${walletData.totalCredit.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Transaction Details Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Transaction Type
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as 'deposit' | 'withdrawal')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Type
              </label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as 'mine' | 'node' | 'capital')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="mine">Mine Wallet</option>
                <option value="node">Node Wallet</option>
                <option value="capital">Capital Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this transaction..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isLoading || !amount}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Reject'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isLoading || !amount}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionApprovalModal;
