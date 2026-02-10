import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
import navbarLogo from "../components/images/navbar-Log-1.png";
import { isUserAdmin } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isWithDrawlOpen, setIsWithDrawlOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  console.log('User in AppHeader:', isUserAdmin(user));
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-[#1f2937] border-gray-200 z-50 lg:border-b">
      <div className="flex flex-col items-center justify-between flex-grow lg:flex-row">

        {/* LEFT SECTION */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 lg:border-b-0 lg:px-0 lg:py-4">

          <div className="flex items-center w-full pl-12">

            {/* LOGO */}
            <img
              src={navbarLogo}
              className="h-14 w-auto object-contain cursor-pointer"
              alt="Logo"
            />

            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center gap-10 ml-12">

              {!isUserAdmin(user) && <Link
                to="/containerShipment/dashboard"
                className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
              >
                Home
              </Link>}

              {!isUserAdmin(user) && <Link
                to="/containerShipment/buy"
                className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
              >
                Buy
              </Link>}

              {!isUserAdmin(user) && <Link
                to="/containerShipment/rent"
                className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
              >
                Rent
              </Link>}
              {!isUserAdmin(user) && <Link
                to="/containerShipment/sell"
                className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
              >
                Sell
              </Link>}
               {!isUserAdmin(user) && <Link
                to="/containerShipment/sellMonthlyInterest"
                className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
              >
                Monthly Interest
              </Link>}
              {/* Withdrawal DROPDOWN */}
              {isUserAdmin(user) && <div className="relative">
                <button
                  onClick={() => setIsWithDrawlOpen(!isWithDrawlOpen)}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  Transactions
                  <span className={`text-xs transition-transform ${isWithDrawlOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {isWithDrawlOpen && (
                  <div className="absolute left-0 mt-2 w-42 bg-white rounded-md shadow-lg py-2 z-50">
                    <Link
                      to="/containerShipment/sell-request"
                      onClick={() => setIsWithDrawlOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sell Request
                    </Link>
                    <Link
                      to="/containerShipment/deposit-approval"
                      onClick={() => setIsWithDrawlOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Deposit Approval
                    </Link>
                  </div>
                )}
              </div>}
              {/* USERS DROPDOWN */}
              {isUserAdmin(user) && <div className="relative">
                <button
                  onClick={() => setIsUsersOpen(!isUsersOpen)}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  Users
                  <span className={`text-xs transition-transform ${isUsersOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {isUsersOpen && (
                  <div className="absolute left-0 mt-2 w-42 bg-white rounded-md shadow-lg py-2 z-50">
                    <Link
                      to="/containerShipment/all-user"
                      onClick={() => setIsUsersOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      All Users
                    </Link>

                    <Link
                      to="/containerShipment/active-user"
                      onClick={() => setIsUsersOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Active Users
                    </Link>

                    <Link
                      to="/containerShipment/inactive-user"
                      onClick={() => setIsUsersOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Inactive Users
                    </Link>

                    <Link
                      to="/containerShipment/admin-user"
                      onClick={() => setIsUsersOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Admin Users
                    </Link>
                  </div>
                )}

              </div>}
              {isUserAdmin(user) && <div className="relative">
                <button
                  onClick={() => setBankOpen(!bankOpen)}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  Bank Details
                  <span className={`text-xs transition-transform ${bankOpen ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {bankOpen && (
                  <div className="absolute left-0 mt-2 w-44 bg-white rounded-md shadow-lg py-2 z-50">
                    <Link
                      to="/containerShipment/bank-details"
                      onClick={() => setBankOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Bank
                    </Link>
                  </div>
                )}

              </div>}
            </nav>

          </div>
        </div>

        {/* RIGHT SECTION */}
        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"
            } items-center justify-between w-full gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0`}
        >
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
          </div>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
