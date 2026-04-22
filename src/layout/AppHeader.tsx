import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
// import navbarLogo from "../components/images/navbar-Log-1.png";
import { isUserAdmin } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";
import SupportSidebar from "../components/ui/support/SupportSidebar";
import Header from "../pages/Header";
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
    <>
      {isUserAdmin(user) ?
        <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-black to-yellow-500 border-b">
          <div className="flex flex-col items-center justify-between flex-grow lg:flex-row">

            {/* LEFT SECTION */}
            <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 lg:border-b-0 lg:px-0 lg:py-4">

              <div className="flex items-center w-full pl-12">

                {/* LOGO */}
                {/* <img
              src={navbarLogo}
              className="h-14 w-auto object-contain cursor-pointer"
              alt="Logo"
            /> */}

                {/* DESKTOP NAV */}
                <nav className="hidden lg:flex items-center gap-8 ml-12">

                  {isUserAdmin(user) && <Link
                    to="/bandookwale/dashboard"
                    className="text-white text-sm font-medium hover:text-blue-400 transition whitespace-nowrap"
                  >
                    Home
                  </Link>}


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
                          to="/bandookwale/all-user"
                          onClick={() => setIsUsersOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          All Users
                        </Link>

                        <Link
                          to="/bandookwale/active-user"
                          onClick={() => setIsUsersOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Active Users
                        </Link>

                        <Link
                          to="/bandookwale/inactive-user"
                          onClick={() => setIsUsersOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Inactive Users
                        </Link>

                        <Link
                          to="/bandookwale/admin-user"
                          onClick={() => setIsUsersOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Admin Users
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

              <SupportSidebar />
              <div className="flex items-center gap-3">
                <ThemeToggleButton />
              </div>

              <UserDropdown />
            </div>
          </div>
        </header> :
        <Header />}
    </>
  );
};

export default AppHeader;
