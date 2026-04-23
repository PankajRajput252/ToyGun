import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

// Assume these icons are imported from an icon library
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "dashboard",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z"
          className="fill-current" />
      </svg>
    ),
    name: "Settings",
    subItems: [
      { name: "Profile", path: "profile", pro: false },
      // { name: "wallet", path: "wallet", pro: false },
      { name: "Wallet Address", path: "walletAddress", pro: false },
    ],
    path: "settings",
  },

  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V17H20V19ZM20 14H4V8H20V14Z"
          className="fill-current" />
      </svg>
    ),
    name: "Service package",
    path: "service-package",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2ZM12 5.18L17.82 7L12 8.82L6.18 7L12 5.18ZM2 17L12 22L22 17V9.27L12 14.27L2 9.27V17ZM4 10.73L12 15.73L20 10.73V16.27L12 20L4 16.27V10.73Z"
          className="fill-current" />
      </svg>
    ),
    name: "Mining package",
    path: "mining-package",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8 17.5C6.62 17.5 5.5 16.38 5.5 15C5.5 13.62 6.62 12.5 8 12.5C9.38 12.5 10.5 13.62 10.5 15C10.5 16.38 9.38 17.5 8 17.5ZM9.5 8C9.5 6.62 10.62 5.5 12 5.5C13.38 5.5 14.5 6.62 14.5 8C14.5 9.38 13.38 10.5 12 10.5C10.62 10.5 9.5 9.38 9.5 8ZM16 17.5C14.62 17.5 13.5 16.38 13.5 15C13.5 13.62 14.62 12.5 16 12.5C17.38 12.5 18.5 13.62 18.5 15C18.5 16.38 17.38 17.5 16 17.5Z"
          className="fill-current" />
      </svg>
    ),
    name: "Network",
    subItems: [
      { name: " Direct Team", path: "directTeam", pro: false },
      { name: "All Team", path: "allTeam", pro: false },
      // { name: "Business History", path: "businessHistory", pro: false },
    ],
  },



];

const componentsItems: NavItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
          className="fill-current" />
      </svg>
    ),
    name: "Incomes",
    subItems: [

      { name: "Service Generation", path: "serviceGeneration", pro: false },
      { name: "Matching Income", path: "matchingIncome", pro: false },
      { name: "Club Income", path: "clubIncome", pro: false },
      { name: "Reward Income", path: "rewardIncome", pro: false },
      { name: "Fast Track Bonus", path: "fastTrackBonus", pro: false },
      { name: "Mining Profit Sharing", path: "miningProfitSharing", pro: false },
      { name: "Mining Generation", path: "miningGeneration", pro: false },
      { name: "Node Business Sharing", path: "nodeBusinessSharing", pro: false },],
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 14V6C19 4.9 18.1 4 17 4H3C1.9 4 1 4.9 1 6V14C1 15.1 1.9 16 3 16H17C18.1 16 19 15.1 19 14ZM10 13C7.79 13 6 11.21 6 9C6 6.79 7.79 5 10 5C12.21 5 14 6.79 14 9C14 11.21 12.21 13 10 13ZM23 7V18C23 19.1 22.1 20 21 20H4C4 21.1 4.9 22 6 22H21C22.1 22 23 21.1 23 20V7Z"
          className="fill-current" />
      </svg>
    ),
    name: "Deposit",
    subItems: [
     
      { name: "Deposit Fund (online)", path: "depositFund", pro: false },
      { name: "Deposit Invoice", path: "depositInvoice", pro: false },
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L5 6.99H8V14H10V6.99H13L9 3ZM16 17.01V10H14V17.01H11L15 21L19 17.01H16Z"
          className="fill-current" />
      </svg>
    ),
    name: "Transfer",
    subItems: [

      { name: "Transfer to Node Wallet", path: "transferToNodeWallet", pro: false },
      { name: "Transfer to Capital Wallet", path: "transferToCapitalWallet", pro: false },
      { name: "Transfer Report", path: "transferReport", pro: false },
      { name: "Receive Report", path: "receiveReport", pro: false },
      ],
  },
  // {
  //   icon: (
  //     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  //       <path d="M21 7H3C1.9 7 1 7.9 1 9V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V9C23 7.9 22.1 7 21 7ZM21 19H3V9H21V19ZM12 12C13.1 12 14 11.1 14 10C14 8.9 13.1 8 12 8C10.9 8 10 8.9 10 10C10 11.1 10.9 12 12 12ZM12 14C9.79 14 8 12.21 8 10C8 7.79 9.79 6 12 6C14.21 6 16 7.79 16 10C16 12.21 14.21 14 12 14Z"
  //         className="fill-current" />
  //     </svg>
  //   ),
  //   name: "My Wallet",
  //   path: "user-wallet",
  // },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z"
          className="fill-current" />
      </svg>
    ),
    name: "Financial",
    subItems: [

      { name: "Withdraw Fund", path: "withdrawFund", pro: false },
      { name: "Withdraw Report", path: "withdrawReport", pro: false },
      { name: "Account Statement", path: "accountStatement", pro: false },
      { name: "Income Summary", path: "incomeSummary", pro: false },
      // { name: "Individual Income Summary", path: "individual-income-summary", pro: false },

  
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"
          className="fill-current" />
      </svg>
    ),
    name: "Rank & Reward",
    path: "rankAndReward",
  },
];

const adminItems: NavItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z"
          className="fill-current" />
      </svg>
    ),
    name: "Dashboard",
    path: "",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
          className="fill-current" />
      </svg>
    ),
    name: "Admin",
    subItems: [
      { name: "Manage Ranks", path: "admin/ranks", pro: false },
      { name: "Manage Income Types", path: "admin/income-types", pro: false },
      { name: "Manage Subscription", path: "admin/subscription", pro: false },
      { name: "Manage Withdrawal", path: "admin/withdrawal", pro: false },
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          className="fill-current" />
      </svg>
    ),
    name: "Users",
    subItems: [
      { name: "All Users", path: "admin/users", pro: false },
      { name: "Active Users", path: "admin/users?status=active", pro: false },
      { name: "Inactive Users", path: "admin/users?status=inactive", pro: false },
      { name: "Admin Users", path: "admin/users?role=admin", pro: false },
    ],
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 14V6C19 4.9 18.1 4 17 4H3C1.9 4 1 4.9 1 6V14C1 15.1 1.9 16 3 16H17C18.1 16 19 15.1 19 14ZM10 13C7.79 13 6 11.21 6 9C6 6.79 7.79 5 10 5C12.21 5 14 6.79 14 9C14 11.21 12.21 13 10 13ZM23 7V18C23 19.1 22.1 20 21 20H4C4 21.1 4.9 22 6 22H21C22.1 22 23 21.1 23 20V7Z"
          className="fill-current" />
      </svg>
    ),
    name: "Transactions",
    subItems: [
      { name: "Deposits", path: "admin/deposits", pro: false },
      { name: "Wallet Transactions", path: "admin/wallet-transactions", pro: false },
    ],
  },

];

const othersItems: NavItem[] = [
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.68 15.07 11.25Z"
          className="fill-current" />
      </svg>
    ),
    name: "Support",
    path: "support",
  },
  {
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 3H3C1.9 3 1 3.9 1 5V17C1 18.1 1.9 19 3 19H8V21H16V19H21C22.1 19 23 18.1 23 17V5C23 3.9 22.1 3 21 3ZM21 17H3V5H21V17Z"
          className="fill-current" />
      </svg>
    ),
    name: "Presentation",
    path: "presentation",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "components" | "others" | "admin";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => {
      if (path === "/StyloCoin/" && location.pathname === "/StyloCoin/") {
        return true;
      }
      return location.pathname.includes(path) && path !== "/StyloCoin/";
    },
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    const menuTypes = ["main", "components", "others"];
    
    // Add admin menu if user is admin
    if (isAdmin) {
      menuTypes.push("admin");
    }
    
    menuTypes.forEach((menuType) => {
      const items = menuType === "main" ? navItems : 
                   menuType === "components" ? componentsItems : 
                   menuType === "admin" ? adminItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "components" | "others" | "admin",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, isAdmin]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "components" | "others" | "admin") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "components" | "others" | "admin") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path.startsWith('/StyloCoin/') ? nav.path : `/StyloCoin/${nav.path}`}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={`/StyloCoin/${subItem.path}`}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/StyloCoin/">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              StyloCoin
            </span>
          ) : (
            <span className="text-xl font-bold text-brand-500 dark:text-brand-400">
              SC
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Show regular sections only for non-admin users */}
            {!isAdmin && (
              <>
                <div>
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "Main"
                    ) : (
                      <HorizontaLDots className="size-6" />
                    )}
                  </h2>
                  {renderMenuItems(navItems, "main")}
                </div>
                <div className="">
                  <h2
                    className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                      }`}
                  >
                    {isExpanded || isHovered || isMobileOpen ? (
                      "Components"
                    ) : (
                      <HorizontaLDots />
                    )}
                  </h2>
                  {renderMenuItems(componentsItems, "components")}
                </div>
              </>
            )}

            {/* Show admin section only for admin users */}
            {isAdmin && (
              <div className="rounded-lg p-3">
                <h2
                  className={`mb-4 text-lg uppercase flex leading-[20px] text-orange-400 font-bold ${!isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                    }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Admin"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(adminItems, "admin")}
              </div>
            )}
            
            {/* Separator line before Others section */}
            <div className="my-6 border-t border-gray-600 dark:border-gray-700"></div>
            
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
              <ul className="flex flex-col gap-4 mt-4">
                <li>
                  <button
                    onClick={() => {
                      signOut();
                      navigate("/bandookwale/signin");
                    }}
                    className="menu-item group menu-item-inactive w-full"
                  >
                    <span className="menu-item-icon-size menu-item-icon-inactive">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
                          className="fill-current" />
                      </svg>
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">Logout</span>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
