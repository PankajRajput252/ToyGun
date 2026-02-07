import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import MetricCard from '../../components/admin/MetricCard';
import { User, WalletData, usersApi, walletDataApi,ieDataApi,DataApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UserMetricCard from './UserMetricCard';
 
export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [dataApi, setDataApi] = useState<DataApi[]>([]);
 
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
 
  // Fetch users and wallet data
  useEffect(() => {
    fetchData();
  }, []);
 
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // const [usersResponse, walletResponse, dataResponse] = await Promise.all([
      //   usersApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null),
      //   walletDataApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null),
      //   ieDataApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null),
      // ]);
 
      // console.log('Users: dataResponse', dataResponse.content)
      // setUsers(usersResponse.data);
      // setWalletData(walletResponse.content);
      // setDataApi(dataResponse.content);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data for development
      setUsers([
        {
          userPkId: 1,
          versionId: 'test-1',
          nodeId: 'NODE001',
          name: 'John Doe',
          email: 'john@example.com',
          password: '',
          country: 'USA',
          mobile: '1234567890',
          referralCode: '',
          position: 'Left',
          isUserIsAdmin: false,
          userStatus:"ACTIVE",
          roles: [{ roleId: 502, name: 'NORMAL_USER' }],
          enabled: true,
          authorities: [{ authority: 'NORMAL_USER' }],
          username: 'john@example.com',
          accountNonExpired: true,
          accountNonLocked: true,
          credentialsNonExpired: true,
          isDeleted: false,
          isGenericFlag: false
        }
      ]);
      setWalletData([
        {
          walletPkId: 1,
          mineWallet: 1000,
          nodeWallet: 2000,
          capitalWallet: 500,
          totalCredit: 3500,
          totalDebit: 0,
          userFkId: 1
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
 
  // Calculate comprehensive dashboard data
  const getDashboardData = () => {
    const totalMineWallet = walletData.reduce((sum, wallet) => sum + wallet.mineWallet, 0);
    const totalNodeWallet = walletData.reduce((sum, wallet) => sum + wallet.nodeWallet, 0);
    const totalCapitalWallet = walletData.reduce((sum, wallet) => sum + wallet.capitalWallet, 0);
    const totalCredit = walletData.reduce((sum, wallet) => sum + wallet.totalCredit, 0);
    const totalDebit = walletData.reduce((sum, wallet) => sum + wallet.totalDebit, 0);
   
    // Calculate additional metrics
    const activeUsers = users.filter(user => user.enabled).length;
    const inactiveUsers = users.filter(user => !user.enabled).length;
    const adminUsers = users.filter(user => user.roles?.some(role => role.name === 'ADMIN_USER')).length;
    const normalUsers = users.filter(user => user.roles?.some(role => role.name === 'NORMAL_USER')).length;
   
    // Calculate total investments (simulated)
    const totalInvestments = totalMineWallet + totalNodeWallet + totalCapitalWallet;
   
    // Calculate ROI income (simulated - 10% of investments)
    const roiIncome = totalInvestments * 0.1;
   
    // Calculate direct income (simulated)
    const directIncome = totalCredit * 0.05;
   
    // Calculate total deposits and withdrawals
    const totalDeposits = totalCredit;
    const totalWithdrawals = totalDebit;
 
    return {
      // User metrics
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      adminUsers,
      normalUsers,
     
      // Wallet metrics
      totalWallet: totalMineWallet + totalNodeWallet + totalCapitalWallet,
      mineWallet: totalMineWallet,
      nodeWallet: totalNodeWallet,
      capitalWallet: totalCapitalWallet,
     
      // Financial metrics
      totalInvestments,
      roiIncome,
      directIncome,
      totalDeposits,
      totalWithdrawals,
      totalCredit,
      totalDebit
    };
  };
 
  const dashboardData = getDashboardData();
 
  // Click handlers for cards
  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'totalUsers':
        navigate('/StyloCoin/admin/users');
        break;
      case 'activeUsers':
        navigate('/StyloCoin/admin/users?status=active');
        break;
      case 'inactiveUsers':
        navigate('/StyloCoin/admin/users?status=inactive');
        break;
      case 'adminUsers':
        navigate('/StyloCoin/admin/users?role=admin');
        break;
      case 'normalUsers':
        navigate('/StyloCoin/admin/users?role=normal');
        break;
      case 'totalWallet':
      case 'mineWallet':
      case 'nodeWallet':
      case 'capitalWallet':
        // Navigate to wallet details or show wallet-specific users
        navigate('/StyloCoin/admin/users');
        break;
      case 'totalInvestments':
      case 'roiIncome':
      case 'directIncome':
      case 'totalRevenue':
        // Navigate to financial reports or income details
        navigate('/StyloCoin/admin/users');
        break;
      case 'totalDeposits':
      case 'totalWithdrawals':
      case 'totalCredit':
      case 'totalDebit':
        // Navigate to transaction details
        navigate('/StyloCoin/admin/users');
        break;
      case 'netProfit':
        // Navigate to financial summary
        navigate('/StyloCoin/admin/users');
        break;
      default:
        navigate('/StyloCoin/admin/users');
    }
  };
 
  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
 
  return (
    <>
      <PageMeta
        title="Admin Dashboard - StyloCoin"
        description="Admin dashboard for managing users and wallet transactions"
      />
     
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-white">
            Admin Dashboard
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/">Home /</a></li>
              <li className="font-medium text-orange-500">Admin Dashboard</li>
            </ol>
          </nav>
        </div>
 
        {/* Dashboard Overview */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
            Dashboard Overview
          </h3>
         
         
        </div>
 
     
      </div>
    </>
  );
}
 