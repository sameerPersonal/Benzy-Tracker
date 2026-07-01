import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { User } from '../services/mockData';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@ops.portal');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await authService.login(email);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
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

        {error && (
          <div className="p-3 bg-tertiary-container/20 text-tertiary rounded-xl border border-tertiary/20 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
              Command Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl text-xs hover:opacity-95 transition-all shadow-lg shadow-primary/10 cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            <span>Access Command Console</span>
          </button>
        </form>

        <div className="pt-4 border-t border-white/5 text-center text-xs text-on-surface-variant/60 font-mono space-y-1">
          <p>Superuser Credentials Bypass:</p>
          <p>
            Use <code className="bg-white/10 px-1.5 py-0.5 rounded text-secondary font-bold">admin@ops.portal</code>
          </p>
        </div>
      </div>
    </div>
  );
};
