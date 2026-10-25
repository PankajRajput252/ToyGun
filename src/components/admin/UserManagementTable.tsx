import React, { useState } from "react";
import { User, usersApi } from "../../services/api";


interface UserManagementTableProps {
  users?: User[];                // optional to avoid undefined crash
  loading: boolean;
  loadUsers: () => void; // <-- NEW
  onTransactionApproval?: (userId: number) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users = [],
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
 
  const isUserActiveStatus = (user: User) => user.activeStateCodeFkId === "ACTIVE";

  // Toggle: send the opposite of the user's current status
  const handleToggleUser = async (user: User) => {
    try {
      const nextStatus = isUserActiveStatus(user) ? "INACTIVE" : "ACTIVE";
      await usersApi.updateStatus(user.userPkId, nextStatus);

      loadUsers(); // reload table data
    } catch (e) {
      setIsUserActive(false);
    }
  }

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
            <th className="p-3 whitespace-nowrap">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={6}className="text-center p-4 text-gray-400">
                No users found.
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => {
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
                    {isUserActiveStatus(user) ? (
                      <span className="text-green-400">Active</span>
                    ) : (
                      <span className="text-red-400">Inactive</span>
                    )}
                  </td>

                  <td className="p-3 whitespace-nowrap">
                    <button
                      // onClick={() => onTransactionApproval?.(user.userPkId)}
                      onClick={() => handleToggleUser(user)}
                      className={`px-3 py-1 rounded text-white ${
                        isUserActiveStatus(user)
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                    >
                    {isUserActiveStatus(user) ? "Inactive" : "Active"}

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