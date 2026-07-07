import React, { useEffect, useState } from 'react';
import { deliveryTrackerService } from '../services/deliveryTrackerService';
import { teamMemberService } from '../services/teamMemberService';
import type { DeliveryItem } from '../services/mockData';

const STATUS_OPTIONS: DeliveryItem['status'][] = ['Open', 'In Progress', 'UAT', 'Ready for Live', 'Completed', 'On Hold'];
const REGION_OPTIONS = ['AE', 'SA', 'IN', 'KW', 'QA', 'UK'];
const ENV_OPTIONS = ['Portal', 'Meta', 'Google'];

export const DeliveryTracker: React.FC = () => {
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming-live' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  
  // Form state
  const [jiraId, setJiraId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [resource, setResource] = useState('');
  const [status, setStatus] = useState<DeliveryItem['status']>('Open');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionEnvironments, setRegionEnvironments] = useState<Record<string, string[]>>({});
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);

  const loadItems = async () => {
    const data = await deliveryTrackerService.getAll();
    setItems(data);
  };

  useEffect(() => {
    loadItems();
    const cached = teamMemberService.getMembers();
    setTeamMembers(cached);
    if (cached.length > 0) {
      setResource(cached[0]);
    }
    teamMemberService.fetchAndCache()
      .then(fresh => {
        setTeamMembers(fresh);
        setResource(prev => {
          if (!prev || !fresh.includes(prev)) {
            return fresh[0] || '';
          }
          return prev;
        });
      })
      .catch(err => console.warn('Could not fetch fresh team members:', err));
  }, []);

  const handleRegionToggle = (region: string, checked: boolean) => {
    setSelectedRegions(prev => {
      let updated: string[];
      if (region === 'All') {
        updated = checked ? [...REGION_OPTIONS] : [];
      } else {
        if (checked) {
          updated = [...prev, region];
        } else {
          updated = prev.filter(r => r !== region);
        }
      }
      
      // Sync environment mapping
      setRegionEnvironments(prevEnvs => {
        const fresh = { ...prevEnvs };
        Object.keys(fresh).forEach(key => {
          if (!updated.includes(key)) {
            delete fresh[key];
          }
        });
        updated.forEach(key => {
          if (!fresh[key]) {
            fresh[key] = [];
          }
        });
        return fresh;
      });
      return updated;
    });
  };

  const handleEnvToggle = (region: string, env: string, checked: boolean) => {
    setRegionEnvironments(prev => {
      const current = prev[region] || [];
      let updated: string[];
      if (env === 'All') {
        updated = checked ? [...ENV_OPTIONS] : [];
      } else {
        if (checked) {
          updated = [...current, env];
        } else {
          updated = current.filter(e => e !== env);
        }
      }
      return { ...prev, [region]: updated };
    });
  };

  const handleEditClick = (item: DeliveryItem) => {
    setEditingItem(item);
    setJiraId(item.jiraId);
    setTaskName(item.taskName);
    setResource(item.resource);
    setStatus(item.status);
    const regions = Object.keys(item.liveUpdates || {});
    setSelectedRegions(regions);
    setRegionEnvironments(item.liveUpdates || {});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraId || !taskName || !resource) return;

    let liveUpdates = {};
    if (status === 'Completed') {
      if (selectedRegions.length === 0) {
        alert('Please select at least one region.');
        return;
      }

      for (const r of selectedRegions) {
        if (!regionEnvironments[r] || regionEnvironments[r].length === 0) {
          alert(`Please select at least one environment for region ${r}.`);
          return;
        }
      }
      liveUpdates = regionEnvironments;
    }

    if (editingItem) {
      await deliveryTrackerService.updateEntry(editingItem.id, {
        jiraId,
        taskName,
        resource,
        status,
        liveUpdates
      });
    } else {
      await deliveryTrackerService.addEntry({
        jiraId,
        taskName,
        resource,
        status,
        liveUpdates
      });
    }

    setJiraId('');
    setTaskName('');
    setResource(teamMembers[0] || '');
    setStatus('Open');
    setSelectedRegions([]);
    setRegionEnvironments({});
    setEditingItem(null);
    setIsModalOpen(false);
    loadItems();
  };

  const handleStatusChange = async (id: string, newStatus: DeliveryItem['status']) => {
    await deliveryTrackerService.updateStatus(id, newStatus);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deliverable?')) {
      try {
        await deliveryTrackerService.deleteEntry(id);
        await loadItems();
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(err.message || 'Failed to delete deliverable');
      }
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return item.status === 'In Progress' || item.status === 'UAT' || item.status === 'Open';
    }
    if (activeTab === 'upcoming-live') {
      return item.status === 'Ready for Live';
    }
    if (activeTab === 'completed') {
      return item.status === 'Completed' || item.status === 'On Hold';
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
  const activeCount = items.filter(i => i.status === 'In Progress' || i.status === 'UAT').length;
  const openCount = items.filter(i => i.status === 'Open').length;
  const readyCount = items.filter(i => i.status === 'Ready for Live').length;
  const onHoldCount = items.filter(i => i.status === 'On Hold').length;

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
            Track Jira ticket lifecycles, task names, and regional/environment live update statuses.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setEditingItem(null);
              setJiraId('');
              setTaskName('');
              setResource(teamMembers[0] || '');
              setStatus('Open');
              setSelectedRegions([]);
              setRegionEnvironments({});
              setIsModalOpen(true);
            }}
            className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl text-xs border border-primary/20 flex items-center gap-2 hover:bg-primary-fixed-dim hover:text-primary-fixed transition-all cursor-pointer shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="font-label-caps text-label-caps">Add Deliverable</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex border-b border-white/5 space-x-6 text-xs font-semibold">
        {(['all', 'active', 'upcoming-live', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 border-b-2 transition-all font-mono tracking-wider cursor-pointer uppercase ${
              activeTab === tab
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            {tab === 'all' && `All Tasks (${items.length})`}
            {tab === 'active' && `In Flight (${openCount + activeCount})`}
            {tab === 'upcoming-live' && `Ready for Live (${readyCount})`}
            {tab === 'completed' && `Completed (${completedCount + onHoldCount})`}
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
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Jira ID</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Task Name</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Owner</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Task Status</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Live Updates</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredItems.map((item) => {
                    return (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded">
                            {item.jiraId}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-on-surface">{item.taskName}</td>
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
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                            {item.liveUpdates && Object.keys(item.liveUpdates).length > 0 ? (
                              Object.entries(item.liveUpdates).map(([region, envs]) => (
                                <span key={region} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-on-surface flex items-center gap-1">
                                  <strong className="text-primary">{region}</strong>: {envs.join(', ')}
                                </span>
                              ))
                            ) : (
                              <span className="text-on-surface-variant/40 italic">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="text-on-surface-variant/60 hover:text-primary p-1 rounded hover:bg-primary/10 transition-all cursor-pointer"
                              title="Edit Deliverable"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-on-surface-variant/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete Deliverable"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant/60 text-xs font-mono">
                        No deliverables match this selection.
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
                <span className="text-on-surface-variant/80">Active (In Flight)</span>
                <span className="text-yellow-400 font-bold">{activeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant/80">Backlog (Open)</span>
                <span className="text-blue-400 font-bold">{openCount}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Glassmorphic Add/Edit Deliverable Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel inner-glow w-full max-w-md rounded-2xl p-6 relative space-y-4">
            <button 
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsRegionDropdownOpen(false);
                setEditingItem(null);
              }}
              className="absolute top-4 right-4 text-on-surface-variant/80 hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              {editingItem ? 'Edit Deliverable' : 'Add Deliverable'}
            </h3>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Jira ID
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
                  Task Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Add validation for payments"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Assignee / Owner
                </label>
                <select
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-semibold"
                  required
                >
                  {teamMembers.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#171f33] text-on-surface font-semibold font-mono">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Task Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DeliveryItem['status'])}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-semibold"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#171f33] text-on-surface font-semibold">{opt}</option>
                  ))}
                </select>
              </div>

              {/* Live Updated Region Selection */}
              {status === 'Completed' && (
                <>
                  <div>
                    <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-2">
                      Live Updated Region
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        key="all-regions"
                        type="button"
                        onClick={() => {
                          const allSelected = selectedRegions.length === REGION_OPTIONS.length;
                          handleRegionToggle('All', !allSelected);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                          selectedRegions.length === REGION_OPTIONS.length
                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(78,162,255,0.15)]'
                            : 'bg-white/5 border-white/10 text-on-surface-variant/80 hover:border-white/20'
                        }`}
                      >
                        ALL
                      </button>
                      {REGION_OPTIONS.map(reg => {
                        const isSelected = selectedRegions.includes(reg);
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => handleRegionToggle(reg, !isSelected)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(78,162,255,0.15)]'
                                : 'bg-white/5 border-white/10 text-on-surface-variant/80 hover:border-white/20'
                            }`}
                          >
                            {reg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Updated Environment Selection (Per-Region configuration) */}
                  {selectedRegions.length > 0 && (
                    <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/5 max-h-[220px] overflow-y-auto w-full">
                      <span className="block font-mono text-[9px] text-primary/80 uppercase tracking-widest font-bold">
                        Environments by Region
                      </span>
                      {selectedRegions.map(region => (
                        <div key={region} className="space-y-1.5 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                          <span className="text-[10px] font-mono text-on-surface-variant font-semibold">
                            {region} Environment:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              key={`${region}-all-envs`}
                              type="button"
                              onClick={() => {
                                const allEnvsSelected = (regionEnvironments[region] || []).length === ENV_OPTIONS.length;
                                handleEnvToggle(region, 'All', !allEnvsSelected);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                (regionEnvironments[region] || []).length === ENV_OPTIONS.length
                                  ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_8px_rgba(78,222,163,0.15)]'
                                  : 'bg-white/5 border-white/10 text-on-surface-variant/80 hover:border-white/20'
                              }`}
                            >
                              ALL
                            </button>
                            {ENV_OPTIONS.map(env => {
                              const isSelected = (regionEnvironments[region] || []).includes(env);
                              return (
                                <button
                                  key={`${region}-${env}`}
                                  type="button"
                                  onClick={() => handleEnvToggle(region, env, !isSelected)}
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                                    isSelected
                                      ? 'bg-secondary/20 border-secondary text-secondary shadow-[0_0_8px_rgba(78,222,163,0.15)]'
                                      : 'bg-white/5 border-white/10 text-on-surface-variant/80 hover:border-white/20'
                                  }`}
                                >
                                  {env}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsModalOpen(false);
                  setIsRegionDropdownOpen(false);
                  setEditingItem(null);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2.5 rounded-lg text-xs border border-white/10"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-primary hover:opacity-90 text-on-primary font-semibold py-2.5 rounded-lg text-xs shadow-lg shadow-primary/10"
              >
                {editingItem ? 'Save Changes' : 'Add Deliverable'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default DeliveryTracker;
