import React, { useEffect, useState } from 'react';
import { deliveryTrackerService } from '../services/deliveryTrackerService';
import type { DeliveryItem } from '../services/mockData';

const STATUS_OPTIONS: DeliveryItem['status'][] = ['Open', 'In Progress', 'UAT', 'Ready for Live', 'Completed', 'On Hold'];

export const DeliveryTracker: React.FC = () => {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'upcoming-live' | 'delayed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [jiraId, setJiraId] = useState('');
  const [resource, setResource] = useState('');
  const [status, setStatus] = useState<DeliveryItem['status']>('Open');
  const [expectedDate, setExpectedDate] = useState('');

  const loadItems = async () => {
    const data = await deliveryTrackerService.getAll();
    setItems(data);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraId || !resource || !expectedDate) return;
    await deliveryTrackerService.addEntry({
      jiraId,
      resource,
      status,
      expectedDeliveryDate: expectedDate
    });
    setJiraId('');
    setResource('');
    setExpectedDate('');
    setStatus('Open');
    setIsModalOpen(false);
    loadItems();
  };

  const handleStatusChange = async (id: string, newStatus: DeliveryItem['status']) => {
    await deliveryTrackerService.updateStatus(id, newStatus);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deliverable?')) {
      await deliveryTrackerService.deleteEntry(id);
      loadItems();
    }
  };

  // Filter calculations
  const today = new Date().toISOString().split('T')[0];
  
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') {
      return item.status !== 'Completed' && item.expectedDeliveryDate >= today;
    }
    if (activeTab === 'upcoming-live') {
      return item.status === 'Ready for Live';
    }
    if (activeTab === 'delayed') {
      return item.status !== 'Completed' && item.expectedDeliveryDate < today;
    }
    return true;
  });

  const getStatusColor = (st: DeliveryItem['status']) => {
    switch(st) {
      case 'Completed': return 'text-secondary bg-secondary/10 border-secondary/20';
      case 'Ready for Live': return 'text-primary bg-primary/10 border-primary/20';
      case 'UAT': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'In Progress': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'On Hold': return 'text-on-surface-variant/70 bg-white/5 border-white/10';
      default: return 'text-on-surface-variant/80 bg-white/5 border-white/5';
    }
  };

  // Metrics calculations
  const totalCount = items.length;
  const completedCount = items.filter(i => i.status === 'Completed').length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const delayedCount = items.filter(i => i.status !== 'Completed' && i.expectedDeliveryDate < today).length;
  const readyCount = items.filter(i => i.status === 'Ready for Live').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex text-[10px] font-mono text-on-surface-variant/70 mb-2 gap-2 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Sprints</span>
            <span>/</span>
            <span className="text-primary font-bold">Sprint Deliverables</span>
          </nav>
          <h2 className="font-display-lg text-2xl font-bold">Delivery Tracker</h2>
          <p className="text-on-surface-variant/80 text-xs max-w-xl">
            Track Jira ticket lifecycles, expected deployment live dates, and sprint velocity.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl text-xs border border-primary/20 flex items-center gap-2 hover:bg-primary-fixed-dim hover:text-primary-fixed transition-all cursor-pointer shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="font-label-caps text-label-caps">Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex border-b border-white/5 space-x-6 text-xs font-semibold">
        {(['all', 'upcoming', 'upcoming-live', 'delayed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-all font-mono tracking-wider cursor-pointer uppercase ${
              activeTab === tab
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            {tab === 'all' && `All Deliveries (${items.length})`}
            {tab === 'upcoming' && `Upcoming (${items.filter(i => i.status !== 'Completed' && i.expectedDeliveryDate >= today).length})`}
            {tab === 'upcoming-live' && `Ready for Live (${readyCount})`}
            {tab === 'delayed' && `Delayed (${delayedCount})`}
          </button>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Deliverables List Column */}
        <div className="lg:col-span-9">
          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/40 border-b border-white/5">
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Jira Ticket</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Owner</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Release Status</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Expected Date</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Live Release Date</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => {
                    const isOverdue = item.status !== 'Completed' && item.expectedDeliveryDate < today;
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
                            {item.jiraId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">{item.resource}</td>
                        <td className="px-6 py-4">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as DeliveryItem['status'])}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-mono font-bold focus:outline-none transition-all cursor-pointer ${getStatusColor(item.status)}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt} className="bg-[#171f33] text-on-surface font-semibold">{opt}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={isOverdue ? 'text-tertiary font-bold' : 'text-on-surface-variant/80'}>
                              {item.expectedDeliveryDate}
                            </span>
                            {isOverdue && (
                              <span className="material-symbols-outlined text-tertiary text-sm animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/60">
                          {item.liveDate || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-on-surface-variant/30 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant/60 text-xs font-mono">
                        No sprint deliverables match this selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Statistics */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Sprint progress meter */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface-variant font-mono uppercase tracking-widest">Sprint Velocity</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-display-lg text-2xl font-bold text-secondary">{completionRate}%</span>
                <span className="text-[10px] text-on-surface-variant/60 font-mono">COMPLETED DELIVERIES</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${completionRate}%` }}></div>
              </div>
              <p className="text-[10px] text-on-surface-variant/50 italic">
                {completedCount} of {totalCount} tickets resolved this cycle.
              </p>
            </div>
          </div>

          {/* Quick Metrics lists */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-on-surface-variant">DELIVERY STATUS</h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-on-surface-variant/80">Canary (Live Ready)</span>
                <span className="text-primary font-bold">{readyCount}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-on-surface-variant/80">Sprint Blockers (Delayed)</span>
                <span className="text-tertiary font-bold">{delayedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/80">In Flight (Active)</span>
                <span className="text-yellow-400 font-bold">
                  {items.filter(i => i.status === 'In Progress' || i.status === 'UAT').length}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Glassmorphic Add Deliverable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel inner-glow w-full max-w-md rounded-2xl p-6 relative">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant/80 hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Add Sprint Deliverable
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Jira Ticket ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. OPS-105"
                  value={jiraId}
                  onChange={(e) => setJiraId(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Assignee / Owner
                </label>
                <input
                  type="text"
                  placeholder="Developer Name"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    Sprint Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DeliveryItem['status'])}
                    className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-semibold"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2.5 rounded-lg text-xs border border-white/10"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-primary hover:opacity-90 text-on-primary font-semibold py-2.5 rounded-lg text-xs shadow-lg shadow-primary/10"
              >
                Add Deliverable
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
