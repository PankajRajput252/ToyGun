import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import { User, usersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users, UserCheck, UserX, ShieldCheck, User as UserIcon,
  TrendingUp, TrendingDown, ShoppingBag, Package,
  Activity, BarChart2, PieChart, ArrowUpRight
} from 'lucide-react';

// ─── Donut Chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ active, inactive }: { active: number; inactive: number }) {
  const total = active + inactive || 1;
  const activePercent = Math.round((active / total) * 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const activeDash = (active / total) * circ;

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* track */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2a3a" strokeWidth="14" />
        {/* inactive arc */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#374151" strokeWidth="14"
          strokeDasharray={`${circ - activeDash} ${activeDash}`}
          strokeDashoffset={-activeDash}
          strokeLinecap="round"
        />
        {/* active arc */}
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="#f59e0b" strokeWidth="14"
          strokeDasharray={`${activeDash} ${circ - activeDash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{activePercent}%</span>
        <span className="text-xs text-gray-400">Active</span>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, total, color }: {
  label: string; value: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="text-white font-medium">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  subLabel,
  onClick,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number | string;
  sub?: number | string;
  subLabel?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#1a1a2e] border border-gray-800 rounded-2xl p-5
                 cursor-pointer hover:border-yellow-500/40 hover:bg-[#1e1e35]
                 transition-all duration-300 overflow-hidden"
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-yellow-500
                                    transition-colors duration-200" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-white leading-none mb-2">{value}</p>

        {sub !== undefined && subLabel && (
          <p className="text-xs text-gray-500">
            {subLabel}: <span className="text-gray-300 font-medium">{sub}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse] = await Promise.all([
        usersApi.getAll(0, 100, 'ACTIVE', user?.nodeId || null)
      ]);
      setUsers(usersResponse?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUsers([
        {
          userPkId: 1, versionId: 'test-1', nodeId: 'NODE001',
          name: 'John Doe', email: 'john@example.com', password: '',
          country: 'USA', mobile: '1234567890', referralCode: '',
          position: 'Left', isUserIsAdmin: false, userStatus: "ACTIVE",
          roles: [{ roleId: 502, name: 'NORMAL_USER' }], enabled: true,
          authorities: [{ authority: 'NORMAL_USER' }], username: 'john@example.com',
          accountNonExpired: true, accountNonLocked: true,
          credentialsNonExpired: true, isDeleted: false, isGenericFlag: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const activeUsers  = users.filter(u => u.enabled).length;
  const inactiveUsers = users.filter(u => !u.enabled).length;
  const adminUsers   = users.filter(u => u.roles?.some(r => r.name === 'ADMIN_USER')).length;
  const normalUsers  = users.filter(u => u.roles?.some(r => r.name === 'NORMAL_USER')).length;
  const totalUsers   = users.length;

  const go = (path: string) => navigate(path);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-yellow-500 border-t-transparent
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Admin Dashboard - Bandookwale"
        description="Admin dashboard for managing users and products"
      />

      <div className="min-h-screen bg-[#0f0f1a] text-white p-6 md:p-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Welcome back, {user?.name || "Admin"} 👋
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400
                             border border-green-500/20 px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Stat Cards Row 1 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <StatCard
            icon={Users}
            iconBg="bg-yellow-500/10"
            iconColor="text-yellow-400"
            label="Total Users"
            value={totalUsers}
            sub={`${activeUsers} active`}
            subLabel="Status"
            onClick={() => go('/bandookwale/admin/users')}
          />
          <StatCard
            icon={UserCheck}
            iconBg="bg-green-500/10"
            iconColor="text-green-400"
            label="Active Users"
            value={activeUsers}
            sub={inactiveUsers}
            subLabel="Inactive"
            onClick={() => go('/bandookwale/admin/users?status=active')}
          />
          <StatCard
            icon={UserX}
            iconBg="bg-red-500/10"
            iconColor="text-red-400"
            label="Inactive Users"
            value={inactiveUsers}
            sub={totalUsers}
            subLabel="Total Users"
            onClick={() => go('/bandookwale/admin/users?status=inactive')}
          />
        </div>

        {/* ── Stat Cards Row 2 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={ShieldCheck}
            iconBg="bg-purple-500/10"
            iconColor="text-purple-400"
            label="Admin Users"
            value={adminUsers}
            sub={normalUsers}
            subLabel="Normal Users"
            onClick={() => go('/bandookwale/admin/users?role=admin')}
          />
          <StatCard
            icon={UserIcon}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-400"
            label="Normal Users"
            value={normalUsers}
            sub={adminUsers}
            subLabel="Admins"
            onClick={() => go('/bandookwale/admin/users?role=normal')}
          />
          <StatCard
            icon={Activity}
            iconBg="bg-orange-500/10"
            iconColor="text-orange-400"
            label="Total Products"
            value="—"
            sub="View all"
            subLabel="Status"
            onClick={() => go('/bandookwale/admin/users')}
          />
        </div>

        {/* ── Bottom Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* User Distribution */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-yellow-400" />
                User Distribution
              </h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                All time
              </span>
            </div>

            <div className="flex items-center gap-6">
              <DonutChart active={activeUsers} inactive={inactiveUsers} />

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Active Users</p>
                    <p className="text-xl font-bold text-white">{activeUsers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Inactive Users</p>
                    <p className="text-xl font-bold text-white">{inactiveUsers}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-sm font-semibold text-gray-200">{totalUsers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Breakdown */}
          <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-yellow-400" />
                User Breakdown
              </h3>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                All time
              </span>
            </div>

            <div className="space-y-5">
              <ProgressBar
                label="Active Users"
                value={activeUsers}
                total={totalUsers}
                color="#f59e0b"
              />
              <ProgressBar
                label="Inactive Users"
                value={inactiveUsers}
                total={totalUsers}
                color="#6b7280"
              />
              <ProgressBar
                label="Admin Users"
                value={adminUsers}
                total={totalUsers}
                color="#a78bfa"
              />
              <ProgressBar
                label="Normal Users"
                value={normalUsers}
                total={totalUsers}
                color="#60a5fa"
              />
            </div>

            {/* Quick actions */}
            <div className="mt-6 pt-5 border-t border-gray-700 grid grid-cols-2 gap-3">
              <button
                onClick={() => go('/bandookwale/admin/users')}
                className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400
                           py-2 rounded-xl hover:bg-yellow-500/20 transition font-medium"
              >
                Manage Users
              </button>
              <button
                onClick={() => go('/bandookwale')}
                className="text-xs bg-gray-800 border border-gray-700 text-gray-300
                           py-2 rounded-xl hover:bg-gray-700 transition font-medium"
              >
                View Products
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}