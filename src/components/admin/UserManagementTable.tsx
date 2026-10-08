import React, { useState } from "react";
import { User, WalletData ,usersApi} from "../../services/api";


interface UserManagementTableProps {
  users?: User[];                // optional to avoid undefined crash
  walletData?: WalletData[];     // optional to avoid undefined crash
  loading: boolean;
  loadUsers: () => void; // <-- NEW
  onTransactionApproval?: (userId: number) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users = [],
  walletData = [],
  loadUsers,
  onTransactionApproval
}) => {

  const [searchTerm, setSearchTerm] = useState("");
  const [isUserActive,setIsUserActive]=useState(false);
    console.log("UserManagementTable rendered with users:", users);
  const token = localStorage.getItem("token");

  // Safe filtering (no crash even if users = undefined)
  const filteredUsers = users.filter((user) => {
    return (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nodeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
 
  const handleConfirmUser = async (nodeId:string)=>{
    console.log("Calling API for:", nodeId);
    
    try {
      await usersApi.confirmUser(nodeId);
      
      loadUsers(); // reload table data
    } catch (e) {
      setIsUserActive(false);
    }

  }

  const getWallet = (userId: number) => {
    return walletData.find((w) => w.userFkId === userId);
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, node ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 w-full"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 text-white rounded-lg border border-gray-700">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-3 whitespace-nowrap">User ID</th>
            <th className="p-3 whitespace-nowrap">Name</th>
            <th className="p-3 whitespace-nowrap">Email</th>
            <th className="p-3 whitespace-nowrap">Node ID</th>
            <th className="p-3 whitespace-nowrap">Status</th>
            <th className="p-3 whitespace-nowrap">Wallet</th>
            <th className="p-3 whitespace-nowrap">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center p-4 text-gray-400">
                No users found.
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => {
              const wallet = getWallet(user.userPkId);
              console.log("Rendering user: all is well", wallet);

              return (
                <tr
                  key={user.userPkId}
                  className="border-b border-gray-700 hover:bg-gray-750"
                >
                  <td className="p-3 whitespace-nowrap">{user.userPkId}</td>
                  <td className="p-3 whitespace-nowrap">{user.name}</td>
                  <td className="p-3 whitespace-nowrap">{user.email}</td>
                  <td className="p-3 whitespace-nowrap">{user.nodeId}</td>

                  <td className="p-3 whitespace-nowrap">
                    {user.enabled ? (
                      <span className="text-green-400">Active</span>
                    ) : (
                      <span className="text-red-400">Inactive</span>
                    )}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    {wallet ? (
                      <>
                        <p>Mine: {wallet.mineWallet}</p>
                        <p>Node: {wallet.nodeWallet}</p>
                        <p>Capital: {wallet.capitalWallet}</p>
                      </>
                    ) : (
                      <span className="text-gray-400">No wallet</span>
                    )}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <button
                      // onClick={() => onTransactionApproval?.(user.userPkId)}
                      onClick={() => handleConfirmUser(user.nodeId)}
                      className="px-3 py-1 bg-blue-500 rounded text-white hover:bg-blue-600"
                    >
                    {user?.userStatus==="ACTIVE" ? "Active" : "Confirm User"}

                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default UserManagementTable;