import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Home,
  Shield,
  Award,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  minLevel: number;
}

const navItems: NavItem[] = [
  { title: 'Overview', icon: LayoutDashboard, path: '/dashboard', minLevel: 1 },
  { title: 'My Events', icon: Calendar, path: '/dashboard/events', minLevel: 1 },
  { title: 'Certificates', icon: Award, path: '/dashboard/certificates', minLevel: 1 },
  { title: 'Teams', icon: Users, path: '/dashboard/teams', minLevel: 3 },
  { title: 'Tasks', icon: ClipboardList, path: '/dashboard/tasks', minLevel: 2 },
  { title: 'Manage Users', icon: UserCog, path: '/dashboard/users', minLevel: 5 },
  { title: 'Roles & Permissions', icon: Shield, path: '/dashboard/roles', minLevel: 5 },
  { title: 'Overload++', icon: Zap, path: '/dashboard/overload', minLevel: 3 },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { hasMinRoleLevel, getHighestRole } = useRole();

  const filteredNav = navItems.filter((item) => hasMinRoleLevel(item.minLevel));
  const highestRole = getHighestRole();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-[#0d0d0d] border-r border-gray-800 flex flex-col transition-all duration-300 fixed h-full z-20`}
      >
        {/* Logo area */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
          {!collapsed && (
            <span className="text-white font-bold font-['Oxanium'] text-lg">Dashboard</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive =
              item.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? 'bg-[#9113ff]/20 text-[#9113ff]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={collapsed ? item.title : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
            title={collapsed ? 'Home' : undefined}
          >
            <Home size={20} className="shrink-0" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
            title={collapsed ? 'Profile' : undefined}
          >
            <User size={20} className="shrink-0" />
            {!collapsed && <span>Profile</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="border-t border-gray-800 p-4">
            <p className="text-white text-sm font-medium truncate">{user?.email}</p>
            <p className="text-gray-500 text-xs mt-0.5">{highestRole?.replace('_', ' ')}</p>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
