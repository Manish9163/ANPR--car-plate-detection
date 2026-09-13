import React, { useState } from 'react';
import { X, Lock, Mail, User, Zap } from 'lucide-react';
import { api } from '../services/api';
import type { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const formData = new FormData();
        formData.append('username', email || username); // OAuth2 expects username field
        formData.append('password', password);
        const data = await api.login(formData);
        onSuccess(data.user);
        onClose();
      } else {
        const data = await api.register({
          email,
          username,
          password,
        });
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (role: 'admin' | 'operator') => {
    if (role === 'admin') {
      setEmail('admin@platevision.ai');
      setPassword('AdminPassword@123');
    } else {
      setEmail('operator@platevision.ai');
      setPassword('OperatorPassword@123');
    }
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 relative bg-[rgba(15,23,42,0.95)] border border-[var(--border-subtle)] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {tab === 'login' ? 'Sign In to PlateVision' : 'Create User Account'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Argon2id encrypted authentication with JWT token management
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl p-1 bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] mb-4">
          <button
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login' ? 'btn-primary' : 'text-[var(--text-muted)]'
            }`}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register' ? 'btn-primary' : 'text-[var(--text-muted)]'
            }`}
            onClick={() => setTab('register')}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="user@platevision.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary text-xs py-2 mt-2"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : tab === 'login' ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        {/* 1-Click Quick Demo Accounts */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-center space-y-2">
          <span className="text-[0.68rem] font-semibold text-[var(--text-muted)] flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            1-Click Demo Credentials:
          </span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="btn btn-secondary text-[0.7rem] py-1 px-2.5"
              onClick={() => fillDemoCreds('admin')}
            >
              Demo Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary text-[0.7rem] py-1 px-2.5"
              onClick={() => fillDemoCreds('operator')}
            >
              Demo Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
