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
import bandookwaleImage from "../components/images/bandg.png";
import { useNavigate } from "react-router-dom";


const AppHeader: React.FC = () => {

  const navigate = useNavigate();
  const usersRef = useRef(null);
  const manageUsersRef = useRef(null);
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isManageUserOpen, setIsManageUserOpen] = useState(false);
  const [withdrawl, setWithdrawl] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { user } = useAuth();

  const isAdmin = user && isUserAdmin(user);

  // const handleToggle = () => {
  //   if (window.innerWidth >= 991) {
  //     toggleSidebar();
  //   } else {
  //     toggleMobileSidebar();
  //   }
  // };
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (usersRef.current && !usersRef.current.contains(target)) {
        setIsUsersOpen(false);
      }

      if (manageUsersRef.current && !manageUsersRef.current.contains(target)) {
        setIsManageUserOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsUsersOpen(false);
        setIsManageUserOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>{console.log("user datga --->", user)}

      {!user ? (
        <Header />
      ) : isAdmin ? (
        // <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-black to-yellow-500 border-b">
        <header className="sticky top-0 w-full z-50 bg-[#111827] border-b-2 border-[#f5b301] shadow-lg">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">

            {/* LEFT: LOGO + NAV */}
            <div className="flex items-center gap-4 lg:gap-10">
                  <div
          className="w-16 h-16 rounded-full overflow-hidden shadow-lg flex-shrink-0 cursor-pointer flex items-center justify-center bg-black"
          onClick={() => navigate("/bandookwale/")}
        >
          <img
            src={bandookwaleImage}
            alt="Store Logo"
            className="w-full h-full object-contain"
          />
        </div>

              {/* LOGO */}
              {/* <div className="text-xl font-semibold text-gray-800 cursor-pointer">
                AdminPanel
              </div> */}
              {/* <Link
                to="/bandookwale"
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
              >
                AdminPanel
              </Link> */}

              {/* NAV LINKS */}
              <nav className="hidden lg:flex items-center gap-6">

                {isUserAdmin(user) && (
                  <Link
                    to="/bandookwale/admin"
                    className="text-white hover:text-blue-600 text-sm font-medium transition"
                  >
                    Dashboard
                  </Link>
                )}

                {/* USERS DROPDOWN */}
                {isUserAdmin(user) && (
                  <div className="relative" ref={usersRef}>
                    <button
                      onClick={() => setIsUsersOpen(!isUsersOpen)}
                      className="flex items-center gap-1 text-white hover:text-blue-600 text-sm font-medium transition"
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

                {/* MANAGE USER */}
                {isUserAdmin(user) && (
                  <div className="relative" ref={manageUsersRef}>
                    <button
                      onClick={() => {
                        setIsManageUserOpen(!isManageUserOpen);
                        setIsUsersOpen(false);
                      }}
                      className="flex items-center gap-1 text-white hover:text-blue-600 text-sm font-medium transition"
                    >
                      Manage Users
                      <span className={`transition-transform ${isUsersOpen ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {isManageUserOpen && (
                      <div className="absolute top-10 left-0 w-48 bg-white border rounded-lg shadow-lg py-2">
                        <Link
                          to="/bandookwale/admin/subscription"
                          onClick={() => setIsManageUserOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Subscription
                        </Link>

                        <Link
                          to="/bandookwale/admin/store"
                          onClick={() => setIsManageUserOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Add Store Items
                        </Link>
                        {/* <Link
                          to="/bandookwale/active-user"
                          onClick={() => setIsManageUserOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Active Users
                        </Link> */}

                      </div>
                    )}



                  </div>
                )}
              </nav>
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-4">

              {/* SEARCH (Optional) */}
              <input
                type="text"
                placeholder="Search..."
                className="hidden lg:block px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* SUPPORT */}
              <SupportSidebar />

              {/* THEME */}
              {/* <ThemeToggleButton /> */}

              {/* USER */}
              <UserDropdown />

              {/* MOBILE / TABLET MENU TOGGLE */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition"
              >
                {isMobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* MOBILE / TABLET NAV (same links as the desktop nav) */}
          {isMobileMenuOpen && isUserAdmin(user) && (
            <nav className="lg:hidden border-t border-white/10 px-3 sm:px-4 pb-3 pt-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <Link
                to="/bandookwale/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-lg text-white text-sm font-medium hover:bg-white/10"
              >
                Dashboard
              </Link>

              <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Users</p>
              <Link to="/bandookwale/all-user" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                All Users
              </Link>
              <Link to="/bandookwale/active-user" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                Active Users
              </Link>
              <Link to="/bandookwale/inactive-user" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                Inactive Users
              </Link>
              <Link to="/bandookwale/admin-user" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                Admin Users
              </Link>

              <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Manage Users</p>
              <Link to="/bandookwale/admin/subscription" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                Subscription
              </Link>
              <Link to="/bandookwale/admin/store" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-white text-sm hover:bg-white/10">
                Add Store Items
              </Link>
            </nav>
          )}
        </header>) : (
        <Header />
      )}
    </>
  );
};

export default AppHeader;
