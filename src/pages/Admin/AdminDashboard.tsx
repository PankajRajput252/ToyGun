import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { User,  usersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';


export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch users and wallet data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse] = await Promise.all([
        usersApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null)
      ]);
      console.log("usersResponse", usersResponse)

      setUsers(usersResponse?.data || []);
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
          userStatus: "ACTIVE",
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

    } finally {
      setIsLoading(false);
    }
  };

  // Calculate comprehensive dashboard data
  const getDashboardData = () => {


    // Calculate additional metrics
    const activeUsers = users.filter(user => user.enabled).length;
    const inactiveUsers = users.filter(user => !user.enabled).length;
    const adminUsers = users.filter(user => user.roles?.some(role => role.name === 'ADMIN_USER')).length;
    const normalUsers = users.filter(user => user.roles?.some(role => role.name === 'NORMAL_USER')).length;



    return {
      // User metrics
      totalUsers: users.length,
      activeUsers,
      inactiveUsers,
      adminUsers,
      normalUsers,


    };
  };

  const dashboardData = getDashboardData();

  // Click handlers for cards
  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'totalUsers':
        navigate('/bandookwale/admin/users');
        break;
      case 'activeUsers':
        navigate('/bandookwale/admin/users?status=active');
        break;
      case 'inactiveUsers':
        navigate('/bandookwale/admin/users?status=inactive');
        break;
      case 'adminUsers':
        navigate('/bandookwale/admin/users?role=admin');
        break;
      case 'normalUsers':
        navigate('/bandookwale/admin/users?role=normal');
        break;
      case 'totalWallet':
      case 'mineWallet':
      case 'nodeWallet':
      case 'capitalWallet':
        // Navigate to wallet details or show wallet-specific users
        navigate('/bandookwale/admin/users');
        break;
      case 'totalInvestments':
      case 'roiIncome':
      case 'directIncome':
      case 'totalRevenue':
        // Navigate to financial reports or income details
        navigate('/bandookwale/admin/users');
        break;
      case 'totalDeposits':
      case 'totalWithdrawals':
      case 'totalCredit':
      case 'totalDebit':
        // Navigate to transaction details
        navigate('/bandookwale/admin/users');
        break;
      case 'netProfit':
        // Navigate to financial summary
        navigate('/bandookwale/admin/users');
        break;
      default:
        navigate('/bandookwale/admin/users');
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
              {/* <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/">Home /</a></li> */}
              <li className="font-medium text-orange-500">Admin Dashboard</li>
            </ol>
          </nav>
        </div>

        {/* Dashboard Overview */}
        <div className="mb-8">
          {/* <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Dashboard Overview
          </h3> */}


        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => handleCardClick('totalUsers')} className="bg-gray-800 p-6 rounded cursor-pointer">
            <h4 className="text-gray-400">Total Users</h4>
            <p className="text-2xl text-white">{dashboardData.totalUsers}</p>
          </div>

          <div onClick={() => handleCardClick('activeUsers')} className="bg-gray-800 p-6 rounded cursor-pointer">
            <h4 className="text-gray-400">Active Users</h4>
            <p className="text-2xl text-green-400">{dashboardData.activeUsers}</p>
          </div>

          <div onClick={() => handleCardClick('inactiveUsers')} className="bg-gray-800 p-6 rounded cursor-pointer">
            <h4 className="text-gray-400">Inactive Users</h4>
            <p className="text-2xl text-red-400">{dashboardData.inactiveUsers}</p>
          </div>
        </div>


      </div>
    </>
  );
}
