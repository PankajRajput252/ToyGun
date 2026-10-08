import React from 'react';

interface AdminWalletCardProps {
  walletType: 'mine' | 'node' | 'capital' | 'credit';
  totalAmount: number;
  userCount: number;
  onClick: () => void;
}

const AdminWalletCard: React.FC<AdminWalletCardProps> = ({ 
  walletType, 
  totalAmount, 
  userCount, 
  onClick 
}) => {
  
  const getWalletConfig = () => {
    switch (walletType) {
      case 'mine':
        return {
          title: 'Mine Wallet',
          colorClass: 'bg-gradient-to-br from-orange-500 to-red-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          )
        };
      case 'node':
        return {
          title: 'Node Wallet',
          colorClass: 'bg-gradient-to-br from-blue-500 to-indigo-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        };
      case 'capital':
        return {
          title: 'Capital Wallet',
          colorClass: 'bg-gradient-to-br from-green-500 to-emerald-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          )
        };
      case 'credit':
        return {
          title: 'Total Credit / Debit',
          colorClass: 'bg-gradient-to-br from-purple-500 to-pink-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        };
      default:
        return {
          title: 'Wallet',
          colorClass: 'bg-gradient-to-br from-gray-500 to-gray-600',
          icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        };
    }
  };

  const config = getWalletConfig();
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  return (
    <div 
      className={`flex flex-col p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${config.colorClass}`}
      onClick={onClick}
    >
      {/* Top line with amount and icon */}
      <div className="flex justify-between items-center gap-2 h-12">
        <div className="text-2xl sm:text-3xl font-bold text-white truncate">
          ${formatAmount(totalAmount)}
        </div>
        <div className="flex items-center flex-shrink-0">
          {config.icon}
        </div>
      </div>
      
      {/* Title */}
      <div className="text-sm font-medium text-white/90 mt-2">
        {config.title}
      </div>
      
      {/* User count */}
      <div className="text-xs text-white/80 mt-1">
        {userCount} users
      </div>
      
      {/* Click indicator */}
      <div className="text-xs text-white/70 mt-2 flex items-center">
        Click to view users →
      </div>
    </div>
  );
};

export default AdminWalletCard;
