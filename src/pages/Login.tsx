import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../services/mockData';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('sameer');
  const [password, setPassword] = useState('smrp@123*');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Display Name is required for registration.');
        }
        const user = await authService.signup(username, name, password);
        onLoginSuccess(user);
      } else {
        const user = await authService.login(username, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-on-surface font-body-md mesh-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl -top-20 -left-20"></div>
      <div className="absolute w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -bottom-20 -right-20"></div>

      <div className="glass-panel inner-glow w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>deployed_code</span>
            OpsPortal
          </div>
          <p className="font-label-caps text-label-caps text-on-surface-variant/70 tracking-widest uppercase">Engineering Command Center</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant/80 hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant/80 hover:text-on-surface'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 bg-tertiary-container/20 text-tertiary rounded-xl border border-tertiary/20 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
              Command Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., sameer"
              className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-mono"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sameer"
                className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-mono"
                required
              />
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl text-xs hover:opacity-95 transition-all shadow-lg shadow-primary/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">
              {isRegister ? 'how_to_reg' : 'login'}
            </span>
            <span>{loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
