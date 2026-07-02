import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import UserManagementTable from '../../components/admin/UserManagementTable';
import TransactionApprovalModal from '../../components/admin/TransactionApprovalModal';
//  import { User, WalletData, usersApi, walletDataApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
interface User {
  userPkId: number;
  versionId: string;
  nodeId: string;
  name: string;
  email: string;
  password: string;
  country: string;
  mobile: string;
  referralCode: string;
  position: string;
  isUserIsAdmin: boolean;
  roles: Array<{ roleId: number; name: string }>;
  enabled: boolean;
  authorities: Array<{ authority: string }>;
  username: string;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  isDeleted: boolean;
  isGenericFlag: boolean;
  userStatus:string;
  isConfirmed?: boolean; // User confirmation status for mining access
  imageUrl?: string | null; // User profile image URL (deprecated, use profileImageUrl)
  profileImageUrl?: string | null; // User profile image URL from API
  imageId?: string | null; // User profile image ID
  // Additional fields
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}

interface WalletData {
  walletPkId: number;
  mineWallet: number;
  nodeWallet: number;
  capitalWallet: number;
  totalCredit: number;
  totalDebit: number;
  userFkId: number;
  userNodeCode?: string;
  isGenericFlag?: boolean;
  isDeleted?: boolean;
  notesG11nBigTxt?: string | null;
  effectiveDateTime?: string;
  saveStateCodeFkId?: string;
  activeStateCodeFkId?: string;
  recordStateCodeFkId?: string;
  createdDatetime?: string;
  lastModifiedDateTime?: string;
}
export default function AdminUsers() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [walletData, setWalletData] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Get filter parameters from URL
  const statusFilter = searchParams.get('status');
  const roleFilter = searchParams.get('role');

  // Fetch users and wallet data
  useEffect(() => {
    fetchData();
  }, [statusFilter, roleFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const apiStatusFilter =
        statusFilter === "active"
          ? "ACTIVE"
          : statusFilter === "inactive"
            ? "INACTIVE"
            : null;
      // const [usersResponse, walletResponse] = await Promise.all([
      //   usersApi.getAll(0, 100, apiStatusFilter, user?.nodeId || null),
      // walletDataApi.getAll(0, 100, apiStatusFilter, user?.nodeId || null)
      // ]);
      let page = 0;
      let size = 100;

      const url = `https://api.bandookwale.in/api/users/getUser?page=0&size=25&filterBy=${apiStatusFilter}&inputPkId=null&inputFkId=null`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "SUCCESS" && data.data?.length > 0) {
        const userData = data.data;
        let filteredUsers = userData;

        if (roleFilter === 'admin') {
          filteredUsers = filteredUsers.filter(usr =>
            usr.roles?.some(role => role.name === 'ADMIN_USER')
          );
        }
        if (statusFilter === 'active') {
          filteredUsers = filteredUsers.filter(user =>
            user.activeStateCodeFkId === "ACTIVE"
          );
        } else if (statusFilter === 'inactive') {
          filteredUsers = filteredUsers.filter(user =>
            user.activeStateCodeFkId === "INACTIVE"
          );
        }
        

        setUsers(filteredUsers);
      }
      else {
        setUsers([]); // <- Important
      }

      const walletUrl = `https://api.bandookwale.in/api/individual/getWalletData?page=${page}&size=${size}&filterBy=${apiStatusFilter}&inputPkId=null&inputFkId=null`;
      const walletResponse = await fetch(walletUrl);
      const walletDdata = await walletResponse.json();


      if (walletDdata.status === "SUCCESS" && walletDdata.data?.length > 0) {
        const userwalletData = walletDdata.data;
        setWalletData(userwalletData);
      }



    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data for development

    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionApproval = (userId: number) => {
    setSelectedUserId(userId);
    setTransactionModalOpen(true);
  };

  const getSelectedUser = () => {
    if (!selectedUserId) return null;
    return users.find(user => user.userPkId === selectedUserId) || null;
  };

  const getSelectedUserWallet = () => {
    if (!selectedUserId) return null;
    return walletData.find(wallet => wallet.userFkId === selectedUserId) || null;
  };

  const getPageTitle = () => {
    if (statusFilter === 'active') return 'Active Users';
    if (statusFilter === 'inactive') return 'Inactive Users';
    if (roleFilter === 'admin') return 'Admin Users';
    return 'All Users';
  };

  const getFilterDescription = () => {
    if (statusFilter === 'active') return 'Showing only active users';
    if (statusFilter === 'inactive') return 'Showing only inactive users';
    if (roleFilter === 'admin') return 'Showing only admin users';
    return 'Showing all users';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${getPageTitle()} - Admin`}
        description="Admin user management interface"
      />

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-900 min-h-screen">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-title-md2 font-semibold text-white">
            {getPageTitle()}
          </h2>
          <nav>
            <ol className="flex items-center gap-2">
              <li><a className="font-medium text-gray-300 hover:text-white" href="/StyloCoin/admin">Admin Dashboard /</a></li>
              <li className="font-medium text-orange-500">{getPageTitle()}</li>
            </ol>
          </nav>
        </div>

        {/* Filter Info */}
        <div className="mb-6 p-4 bg-gray-800 mt-15 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">{getPageTitle()}</h3>
              <p className="text-gray-400 text-sm">{getFilterDescription()}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
          </div>
        </div>

        {/* User Management Table */}
        <UserManagementTable
          users={users}
          walletData={walletData}
          loading={isLoading}
          loadUsers={fetchData}
          onTransactionApproval={handleTransactionApproval}
        />

      </div>
    </>
  );
}
