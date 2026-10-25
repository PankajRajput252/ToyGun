import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import UserDropdown from "../components/header/UserDropdown";
// import navbarLogo from "../components/images/navbar-Log-1.png";
import { isUserAdmin } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { DropdownItem } from "../components/ui/dropdown/DropdownItem";
import SupportSidebar from "../components/ui/support/SupportSidebar";
import Header from "../pages/Header";
import realLogo from "../components/images/RealLogo.jpeg";
import { AdminDesktopNav, AdminMobileNav } from "./AdminNav";
import { useNavigate } from "react-router-dom";


const AppHeader: React.FC = () => {

  const navigate = useNavigate();
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
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
              <button
                type="button"
                aria-label="Go to Bandookwale home"
                onClick={() => navigate("/")}
                className="group relative flex-shrink-0 rounded-full p-[3px] cursor-pointer
                           bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700
                           shadow-[0_0_18px_rgba(234,179,8,0.35)]
                           transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(234,179,8,0.6)]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
              >
                <span className="block w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white ring-2 ring-black/60">
                  <img
                    src={realLogo}
                    alt="Bandookwale logo"
                    className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6"
                  />
                </span>
              </button>

              {/* LOGO */}
              {/* <div className="text-xl font-semibold text-gray-800 cursor-pointer">
                AdminPanel
              </div> */}
              {/* <Link
                to="/"
                className="text-gray-600 hover:text-blue-600 text-sm font-medium transition"
              >
                AdminPanel
              </Link> */}

              {/* NAV LINKS */}
              <AdminDesktopNav />
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
            <AdminMobileNav onNavigate={() => setIsMobileMenuOpen(false)} />
          )}
        </header>) : (
        <Header />
      )}
    </>
  );
};

export default AppHeader;
