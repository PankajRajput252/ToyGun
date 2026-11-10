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
 
  // Pagination (client-side, applied after search so search covers all users)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const page = Math.min(currentPage, totalPages); // clamp if the list shrank
  const startIndex = (page - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    if (from > 2) pages.push("...");
    for (let i = from; i <= to; i++) pages.push(i);
    if (to < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
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
            pagedUsers.map((user) => {
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

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="text-white">{startIndex + 1}</span>–
              <span className="text-white">{Math.min(startIndex + pageSize, filteredUsers.length)}</span> of{" "}
              <span className="text-white">{filteredUsers.length}</span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-700"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setCurrentPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-700 bg-gray-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Prev
            </button>
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`gap-${i}`} className="px-2">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded border ${
                    p === page
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-gray-700 bg-gray-800 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTable;