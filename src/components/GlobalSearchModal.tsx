import React, { useState, useEffect } from 'react';
import type { ProductionRegistryEntry, DeliveryItem, LeaveEntry, DailyStatus } from '../services/mockData';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: 'dashboard' | 'production' | 'delivery' | 'leave' | 'status' | 'users') => void;
  branches: ProductionRegistryEntry[];
  deliveries: DeliveryItem[];
  leaves: LeaveEntry[];
  statuses: DailyStatus[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  branches,
  deliveries,
  leaves,
  statuses,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredBranches = branches.filter(
    b => b.project.toLowerCase().includes(q) || b.version.toLowerCase().includes(q) || b.region.toLowerCase().includes(q)
  );

  const filteredDeliveries = deliveries.filter(
    d => d.jiraId.toLowerCase().includes(q) || d.taskName.toLowerCase().includes(q) || d.resource.toLowerCase().includes(q) || d.status.toLowerCase().includes(q)
  );

  const filteredLeaves = leaves.filter(
    l => l.resource.toLowerCase().includes(q) || l.leaveType.toLowerCase().includes(q)
  );

  const filteredStatuses = statuses.filter(
    s => s.resource.toLowerCase().includes(q) || s.focus.toLowerCase().includes(q)
  );

  const hasResults =
    filteredBranches.length > 0 ||
    filteredDeliveries.length > 0 ||
    filteredLeaves.length > 0 ||
    filteredStatuses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-2xl bg-[#0b1326] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-surface-container-low/50">
          <span className="material-symbols-outlined text-primary text-xl mr-3">search</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Jira tickets, branches, resources, leaves, status..."
            className="w-full bg-transparent text-on-surface text-sm focus:outline-none placeholder:text-on-surface-variant/50 font-medium"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-on-surface-variant bg-white/5 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Quick Nav Bar */}
        <div className="flex gap-2 px-4 py-2 bg-white/5 border-b border-white/5 overflow-x-auto text-xs">
          <span className="text-on-surface-variant/70 self-center text-[10px] font-mono uppercase mr-1">Quick Jump:</span>
          <button
            onClick={() => { onSelectTab('production'); onClose(); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-on-surface flex items-center gap-1.5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-xs text-primary">alt_route</span>
            Live Branches
          </button>
          <button
            onClick={() => { onSelectTab('delivery'); onClose(); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-on-surface flex items-center gap-1.5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-xs text-secondary">local_shipping</span>
            Delivery Tracker
          </button>
          <button
            onClick={() => { onSelectTab('leave'); onClose(); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-on-surface flex items-center gap-1.5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-xs text-amber-400">event_busy</span>
            Leave Tracker
          </button>
          <button
            onClick={() => { onSelectTab('status'); onClose(); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-md text-on-surface flex items-center gap-1.5 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-xs text-emerald-400">assignment</span>
            Team Status
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {query.trim() === '' ? (
            <div className="text-center py-10 text-on-surface-variant/60 text-xs">
              <span className="material-symbols-outlined text-3xl mb-2 text-primary/40 block">find_in_page</span>
              Type anything to search live branches, Jira IDs, team members, or daily status across OpsPortal.
            </div>
          ) : !hasResults ? (
            <div className="text-center py-10 text-on-surface-variant/60 text-xs">
              No results found for "<span className="text-on-surface font-semibold">{query}</span>"
            </div>
          ) : (
            <>
              {/* Deliveries & Incidents */}
              {filteredDeliveries.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-secondary mb-2 flex items-center justify-between">
                    <span>Jira Deliveries & Incidents ({filteredDeliveries.length})</span>
                    <button
                      onClick={() => { onSelectTab('delivery'); onClose(); }}
                      className="hover:underline text-[10px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredDeliveries.slice(0, 4).map(d => (
                      <div
                        key={d.id}
                        onClick={() => { onSelectTab('delivery'); onClose(); }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-secondary-container/20 text-secondary border border-secondary/30">
                            {d.jiraId}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {d.taskName}
                            </p>
                            <p className="text-[10px] text-on-surface-variant/70">Assigned: {d.resource}</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/10 text-on-surface">
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Production Live Branches */}
              {filteredBranches.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-2 flex items-center justify-between">
                    <span>Live Branch Entries ({filteredBranches.length})</span>
                    <button
                      onClick={() => { onSelectTab('production'); onClose(); }}
                      className="hover:underline text-[10px]"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {filteredBranches.slice(0, 4).map(b => (
                      <div
                        key={b.id}
                        onClick={() => { onSelectTab('production'); onClose(); }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-container/20 text-primary border border-primary/30">
                            {b.region}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {b.project} <span className="font-mono text-on-surface-variant text-[11px]">({b.version})</span>
                            </p>
                            {b.remarks && <p className="text-[10px] text-on-surface-variant/70 truncate">{b.remarks}</p>}
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/60 font-mono">{b.updatedDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaves */}
              {filteredLeaves.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-2">
                    Team Leaves ({filteredLeaves.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredLeaves.slice(0, 3).map(l => (
                      <div
                        key={l.id}
                        onClick={() => { onSelectTab('leave'); onClose(); }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-amber-400 text-sm">event_busy</span>
                          <div>
                            <p className="text-xs font-semibold text-on-surface">{l.resource}</p>
                            <p className="text-[10px] text-on-surface-variant/70">{l.leaveType} Leave: {l.startDate} to {l.endDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily Team Status */}
              {filteredStatuses.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 mb-2">
                    Daily Status Logs ({filteredStatuses.length})
                  </div>
                  <div className="space-y-1.5">
                    {filteredStatuses.slice(0, 3).map(s => (
                      <div
                        key={s.id}
                        onClick={() => { onSelectTab('status'); onClose(); }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                      >
                        <div>
                          <p className="text-xs font-semibold text-on-surface">{s.resource}</p>
                          <p className="text-[10px] text-on-surface-variant/70 truncate">{s.focus}</p>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/60 font-mono">{s.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-surface-container-lowest flex justify-between items-center text-[11px] text-on-surface-variant/70">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[9px]">Ctrl+K</kbd> anywhere to trigger search</span>
          <button onClick={onClose} className="hover:text-on-surface underline">Close</button>
        </div>
      </div>
    </div>
  );
};
