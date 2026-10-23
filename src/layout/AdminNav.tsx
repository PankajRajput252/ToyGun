import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown, LayoutDashboard, Users, UserCheck, UserX, ShieldCheck,
  BadgeIndianRupee, PackagePlus, CheckCircle2, Landmark, type LucideIcon,
} from "lucide-react";

// Admin header navigation: links + dropdown menus, shared by desktop and mobile.
interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export const DASHBOARD_LINK = { to: "/bandookwale/admin", label: "Dashboard", icon: LayoutDashboard };

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Users",
    items: [
      { to: "/bandookwale/all-user", label: "All Users", description: "Everyone registered on Bandookwale", icon: Users },
      { to: "/bandookwale/active-user", label: "Active Users", description: "Accounts that are currently active", icon: UserCheck },
      { to: "/bandookwale/inactive-user", label: "Inactive Users", description: "Deactivated or pending accounts", icon: UserX },
      { to: "/bandookwale/admin-user", label: "Admin Users", description: "Team members with admin access", icon: ShieldCheck },
    ],
  },
  {
    label: "Manage Users",
    items: [
      { to: "/bandookwale/admin/subscription", label: "Subscription", description: "Plans and user subscriptions", icon: BadgeIndianRupee },
      { to: "/bandookwale/admin/store", label: "Add Store Items", description: "List products in the store", icon: PackagePlus },
    ],
  },
  {
    label: "Payments",
    items: [
      { to: "/bandookwale/admin/payments", label: "Payment Approvals", description: "Review manual bank / UPI payments", icon: CheckCircle2 },
      { to: "/bandookwale/admin/payment-methods", label: "Payment Methods", description: "Bank and UPI details buyers pay to", icon: Landmark },
    ],
  },
];

const triggerClass = (active: boolean) =>
  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition
   ${active ? "text-gold-400 bg-white/5" : "text-gray-200 hover:text-white hover:bg-white/5"}`;

function NavMenuItem({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onSelect}
      className={`group flex items-start gap-3 rounded-xl p-2.5 transition
                  ${active ? "bg-gold-500/10" : "hover:bg-white/5"}`}
    >
      <span
        className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center transition
                    ${active
                      ? "bg-gold-500 text-white"
                      : "bg-gray-800 text-gold-400 group-hover:bg-gold-500 group-hover:text-white"}`}
      >
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${active ? "text-gold-400" : "text-white"}`}>
          {item.label}
        </span>
        <span className="block text-xs text-gray-400 leading-snug mt-0.5">{item.description}</span>
      </span>
    </Link>
  );
}

function NavDropdown({
  group, isOpen, onToggle, onClose, pathname,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pathname: string;
}) {
  const hasActiveItem = group.items.some((i) => i.to === pathname);
  return (
    <div className="relative">
      <button onClick={onToggle} aria-expanded={isOpen} className={triggerClass(hasActiveItem || isOpen)}>
        {group.label}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="dropdown-in absolute top-full left-0 mt-2 w-72 z-50 rounded-2xl p-2
                     bg-gray-900/95 backdrop-blur border border-gray-700/80
                     shadow-2xl shadow-black/50 ring-1 ring-gold-500/10"
        >
          {/* Little pointer connecting the card to its button */}
          <span className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-gray-900 border-l border-t border-gray-700/80" />
          <p className="px-2.5 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavMenuItem key={item.to} item={item} active={item.to === pathname} onSelect={onClose} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Desktop nav (lg and up): Dashboard link + one dropdown per group, only one open at a time.
export function AdminDesktopNav() {
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenu]);

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-1">
      <Link to={DASHBOARD_LINK.to} className={triggerClass(pathname === DASHBOARD_LINK.to)}>
        <DASHBOARD_LINK.icon className="w-4 h-4" />
        {DASHBOARD_LINK.label}
      </Link>
      {ADMIN_NAV_GROUPS.map((group) => (
        <NavDropdown
          key={group.label}
          group={group}
          pathname={pathname}
          isOpen={openMenu === group.label}
          onToggle={() => setOpenMenu((m) => (m === group.label ? null : group.label))}
          onClose={() => setOpenMenu(null)}
        />
      ))}
    </nav>
  );
}

// Mobile / tablet nav: same links as the desktop dropdowns, listed in sections.
export function AdminMobileNav({ onNavigate }: { onNavigate: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="lg:hidden border-t border-white/10 px-3 sm:px-4 pb-3 pt-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <Link
        to={DASHBOARD_LINK.to}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition
                    ${pathname === DASHBOARD_LINK.to ? "bg-gold-500/10 text-gold-400" : "text-white hover:bg-white/5"}`}
      >
        <DASHBOARD_LINK.icon className="w-5 h-5 text-gold-400" />
        {DASHBOARD_LINK.label}
      </Link>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {group.label}
          </p>
          {group.items.map((item) => (
            <NavMenuItem key={item.to} item={item} active={item.to === pathname} onSelect={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}
