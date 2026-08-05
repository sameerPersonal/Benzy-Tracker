import React from 'react';
import type { ProductionRegistryEntry, LeaveEntry } from '../services/mockData';

export interface AlertItem {
  id: string;
  code: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  status: 'active' | 'acknowledged' | 'resolved';
  actionTab?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recentDeploys: ProductionRegistryEntry[];
  leaves: LeaveEntry[];
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: string) => void;
  onResolveAlert: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  recentDeploys,
  leaves,
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingLeaves = leaves.filter(l => l.endDate >= todayStr);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0b1326] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container-low/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-xl">notifications_active</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-on-surface">Notification Center</h2>
                <p className="text-xs text-on-surface-variant/70">Real-time alerts, deploys & leave events</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-white/5 transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* System Priority Alerts Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-tertiary flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-sm">error</span>
                  System Health & Priority Alerts ({alerts.filter(a => a.status !== 'resolved').length})
                </h3>
              </div>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      alert.status === 'resolved'
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : alert.type === 'critical'
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-amber-950/20 border-amber-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-[10px] uppercase font-bold text-tertiary">
                        {alert.code}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          alert.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : alert.status === 'acknowledged'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {alert.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-on-surface mb-3">{alert.message}</p>

                    {alert.status !== 'resolved' && (
                      <div className="flex gap-2 justify-end text-xs">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-on-surface rounded-md text-[11px] font-medium transition-all"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-md text-[11px] font-medium transition-all"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Deployment Sync Stream */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-sm">deployed_code</span>
                Recent Live Deployments
              </h3>
              <div className="space-y-2.5">
                {recentDeploys.map(d => (
                  <div key={d.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex gap-3 items-center">
                    <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface truncate">
                        {d.project} ({d.version})
                      </p>
                      <p className="text-[10px] text-on-surface-variant/70">
                        Region: <span className="font-mono text-primary font-bold">{d.region}</span> • {d.updatedDate}
                      </p>
                    </div>
                  </div>
                ))}
                {recentDeploys.length === 0 && (
                  <p className="text-xs text-on-surface-variant/60 italic">No recent deployment sync entries.</p>
                )}
              </div>
            </div>

            {/* Team Coverage & Leaves */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Active & Upcoming Leaves
              </h3>
              <div className="space-y-2.5">
                {upcomingLeaves.map(l => (
                  <div key={l.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex gap-3 items-center">
                    <span className="material-symbols-outlined text-amber-400 text-sm">person_off</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface">{l.resource}</p>
                      <p className="text-[10px] text-on-surface-variant/70">
                        {l.leaveType} Leave: {l.startDate} to {l.endDate}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingLeaves.length === 0 && (
                  <p className="text-xs text-on-surface-variant/60 italic">No team leaves logged for this week.</p>
                )}
              </div>
            </div>

          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-white/10 bg-surface-container-lowest text-center">
            <button
              onClick={onClose}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-on-surface rounded-xl text-xs font-semibold transition-all"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
