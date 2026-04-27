import React, { useEffect, useState } from "react";

interface UserData {
  nodeId: string;
  parentNodeId: string;
  name: string;
  email: string;
  country: string;
  mobile: string;
  dateOfActivation?: string;
  createdDatetime?: string;
  userStatus?: string;
  profileImageUrl?: string;
  referralCode?: string;
  position?: string;
}

const AccountDetailsCard: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 🔹 Get logged-in user from localStorage (same key used in UserMetaCard)
        const storedUser = localStorage.getItem("stylocoin_user");
        const user = storedUser ? JSON.parse(storedUser) : null;

        if (!user?.nodeId) {
          console.warn("No nodeId found in localStorage.");
          setLoading(false);
          return;
        }

        const apiUrl = `http://MineCryptos-env.eba-nsbmtw9i.ap-south-1.elasticbeanstalk.com/api/users/getUser?page=0&size=50&filterBy=ACTIVE&inputPkId=null&inputFkId=${user.nodeId}`;
        const response = await fetch(apiUrl);
        const result = await response.json();

        if (result.status === "SUCCESS" && result.data?.length > 0) {
          setUserData(result.data[0]);
        } else {
          console.warn("No user data found for node:", user.nodeId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl h-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">Loading account details...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl h-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300">No user data available.</p>
      </div>
    );
  }
  // 🔹 Compute initials if profile image not present
  const getInitials = (name: string = "") => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (
      (words[0]?.charAt(0).toUpperCase() || "") +
      (words[words.length - 1]?.charAt(0).toUpperCase() || "")
    );
  };

  const initials = getInitials(userData.name);
  const accountData = [
    { label: "Affiliate ID", value: userData?.parentNodeId || "NODE24770625" },
    { label: "Service", value: userData.userStatus || "Inactive" },
    { label: "Country", value: userData.country || "N/A" },
    { label: "Position", value: userData.position || "N/A" },
    {
      label: "Date of Registration",
      value: userData.createdDatetime
        ? new Date(userData.createdDatetime).toLocaleString()
        : "N/A",
    },
    {
      label: "Date of Activation",
      value: userData.dateOfActivation
        ? new Date(userData.dateOfActivation).toLocaleString()
        : "N/A",
    },
  ];

  return (
    <div className="p-6 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-xl h-full flex flex-col border border-gray-200 dark:border-gray-600">
      {/* User Info Section */}
      <div className="flex items-center space-x-4 mb-6">
        {userData.profileImageUrl ? (
          <img
            src={userData.profileImageUrl}
            alt={userData.name}
            className="h-12 w-12 rounded-full object-cover shadow-lg border border-gray-300 dark:border-gray-600"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {initials}
          </div>
        )}
        <div className="flex flex-col">
          <div className="font-bold text-gray-800 dark:text-white text-xl">{userData.name}</div>
          <div className="text-sm text-yellow-500 dark:text-yellow-400 font-medium">
            {userData.nodeId}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm mb-6">
        {accountData.map((item, index) => (
          <React.Fragment key={index}>
            <div className="text-gray-600 dark:text-gray-300 font-medium">{item.label}</div>
            <div className="text-gray-800 dark:text-white font-semibold text-right">{item.value}</div>
          </React.Fragment>
        ))}
      </div>

      {/* Edit Profile Link */}
      <div className="text-right mb-4">
        <a
          href="/bandookwale/profile"
          className="text-blue-500 dark:text-blue-400 text-sm hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-medium"
        >
          Edit profile →
        </a>
      </div>

      {/* Button */}
      <button className="w-full mt-auto py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition duration-300 shadow-lg">
        View Closing Report
      </button>
    </div>
  );
};

export default AccountDetailsCard;