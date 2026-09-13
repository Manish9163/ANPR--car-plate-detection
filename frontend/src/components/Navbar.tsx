import React from 'react';
import {
  Camera,
  Activity,
  Layers,
  Clock,
  BookOpen,
  Shield,
  LogOut,
  User as UserIcon,
  Cpu,
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  systemHealth: any;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  systemHealth,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[rgba(6,9,17,0.85)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab('scanner')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Camera className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                PLATE<span className="text-cyan-400">VISION</span>
              </span>
              <span className="badge badge-info text-[0.65rem] px-1.5 py-0.5">
                AI / CV
              </span>
            </div>
            <p className="text-[0.68rem] text-[var(--text-muted)] tracking-wider">
              PORTFOLIO ANPR PLATFORM
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[rgba(15,23,42,0.6)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            className={`btn px-3 py-1.5 text-xs ${
              activeTab === 'scanner' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setActiveTab('scanner')}
          >
            <Camera className="w-3.5 h-3.5" />
            Scanner
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${
              activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Activity className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${
              activeTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setActiveTab('pipeline')}
          >
            <Layers className="w-3.5 h-3.5" />
            CV Visualizer
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${
              activeTab === 'history' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <Clock className="w-3.5 h-3.5" />
            History
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${
              activeTab === 'viva' ? 'btn-primary' : 'btn-secondary'
            }`}
            onClick={() => setActiveTab('viva')}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Viva Guide
          </button>
        </nav>

        {/* System Health & Auth */}
        <div className="flex items-center gap-3">
          {/* Health status badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{systemHealth?.acceleration?.device || 'Engine Active'}</span>
          </div>

          {/* User Auth Info */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[rgba(15,23,42,0.8)] border border-[var(--border-subtle)]">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-white">
                  {currentUser.username}
                </span>
                <span className="badge badge-success text-[0.65rem] px-1.5 py-0.5">
                  {currentUser.role}
                </span>
              </div>
              <button
                className="btn btn-secondary p-2 text-rose-400 hover:text-rose-300"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary text-xs py-1.5" onClick={onOpenAuth}>
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
