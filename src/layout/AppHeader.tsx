import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
import navbarLogo from "../components/images/navbar-Log-1.png";
import { isUserAdmin } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";
import SupportSidebar from "../components/ui/support/SupportSidebar";
const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isWithDrawlOpen, setIsWithDrawlOpen] = useState(false);
  const [withdrawl, setWithdrawl] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();
  const handleToggle = () => {
    if (window.innerWidth >= 991) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };
  function closeDropdown() {
    setIsOpen(false);
  }
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
            <nav className="hidden lg:flex items-center gap-8 ml-12">

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
              {/* This is real Withdrawal */}
              {isUserAdmin(user) && <div className="relative">
                <button
                  onClick={() => setWithdrawl(!withdrawl)}
                  className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  Withdrawal
                  <span className={`text-xs transition-transform ${withdrawl ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {withdrawl && (
                  <div className="absolute left-0 mt-2 w-42 bg-white rounded-md shadow-lg py-2 z-50">
                    <Link
                      to="/containerShipment/withdrawls"
                      onClick={() => setWithdrawl(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      withdrawal
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
          {/* <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z"
                  fill=""
                />
              </svg>
              Support
            </DropdownItem>
          </li> */}
          <SupportSidebar />
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
