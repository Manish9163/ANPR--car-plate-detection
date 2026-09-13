import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Video,
  Webcam,
  Clock,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/services/api';
import type { User } from '@/types';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/recognize', icon: ScanLine, label: 'Recognize' },
  { to: '/live', icon: Webcam, label: 'Live' },
  { to: '/video', icon: Video, label: 'Video' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const ADMIN_ITEMS = [
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(api.getSavedUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (api.getSavedUser()) {
      api.getMe().then((u) => {
        setUser(u);
        api.setSavedUser(u);
      }).catch(() => {
        api.removeToken();
        setUser(null);
      });
    }
  }, []);

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
    navigate('/');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`
          hidden lg:flex flex-col border-r border-border-subtle bg-bg-surface
          transition-all duration-300 ease-[var(--ease-default)] shrink-0
          ${collapsed ? 'w-16' : 'w-56'}
        `}
      >
        {/* Brand */}
        <div className={`h-14 flex items-center border-b border-border-subtle px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <ScanLine className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold text-text-primary tracking-tight">
              PlateVision
            </span>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-accent-muted text-accent-text'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className={`pt-4 pb-1 ${collapsed ? 'px-0' : 'px-3'}`}>
                {!collapsed && (
                  <span className="text-[0.625rem] font-semibold text-text-disabled uppercase tracking-widest">
                    Admin
                  </span>
                )}
                {collapsed && <div className="border-t border-border-subtle" />}
              </div>
              {ADMIN_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-accent-muted text-accent-text'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border-subtle p-2 space-y-1">
          {user && !collapsed && (
            <div className="px-3 py-2 rounded-lg bg-bg-elevated">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent/20 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-text-primary truncate">{user.username}</p>
                  <p className="text-[0.625rem] text-text-muted">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>

          {user && (
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error-muted transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
              title="Sign out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-1.5 text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] lg:hidden bg-bg-surface border-t border-border-subtle">
        <nav className="flex items-center justify-around py-1.5 px-2">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg text-[0.625rem] font-medium
                transition-colors duration-150
                ${isActive ? 'text-accent-text' : 'text-text-muted'}
              `}
            >
              <item.icon className="w-4.5 h-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-2 text-[0.625rem] font-medium text-text-muted cursor-pointer"
          >
            <Menu className="w-4.5 h-4.5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-bg-surface border-l border-border-subtle animate-slide-in-right p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-text-primary">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {[...NAV_ITEMS, ...(isAdmin ? ADMIN_ITEMS : [])].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${isActive ? 'bg-accent-muted text-accent-text' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'}
                `}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {user && (
              <div className="pt-4 mt-4 border-t border-border-subtle">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-text-primary">{user.username}</span>
                  <Badge variant="default">{user.role}</Badge>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-error transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <Outlet context={{ user, setUser }} />
      </main>
    </div>
  );
}
