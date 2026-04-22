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
          <div className="flex items-center justify-between px-6 py-3">

            {/* LEFT: LOGO + NAV */}
            <div className="flex items-center gap-10">

              {/* LOGO */}
              <div className="text-xl font-semibold text-gray-800 cursor-pointer">
                AdminPanel
              </div>

              {/* NAV LINKS */}
              <nav className="hidden lg:flex items-center gap-6">

                {isUserAdmin(user) && (
                  <Link
                    to="/bandookwale/admin"
                    className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
                  >
                    Dashboard
                  </Link>
                )}

                {/* USERS DROPDOWN */}
                {isUserAdmin(user) && (
                  <div className="relative">
                    <button
                      onClick={() => setIsUsersOpen(!isUsersOpen)}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 text-sm font-medium transition"
                    >
                      Users
                      <span className={`transition-transform ${isUsersOpen ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {isUsersOpen && (
                      <div className="absolute top-10 left-0 w-48 bg-white border rounded-lg shadow-lg py-2">
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
                  </div>
                )}
              </nav>
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="flex items-center gap-4">

              {/* SEARCH (Optional) */}
              <input
                type="text"
                placeholder="Search..."
                className="hidden lg:block px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* SUPPORT */}
              <SupportSidebar />

              {/* THEME */}
              <ThemeToggleButton />

              {/* USER */}
              <UserDropdown />
            </div>
          </div>
        </header> :
        <Header />}
    </>
  );
};

export default AppHeader;
