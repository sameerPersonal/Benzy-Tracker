import React, { useEffect, useState } from 'react';
import { productionRegistryService } from '../services/productionRegistryService';
import type { ProductionRegistryEntry } from '../services/mockData';

export const ProductionRegistry: React.FC = () => {
  const [entries, setEntries] = useState<ProductionRegistryEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Form State
  const [project, setProject] = useState('');
  const [version, setVersion] = useState('');
  const [region, setRegion] = useState('US-East');
  const [remarks, setRemarks] = useState('');

  const loadEntries = async () => {
    const data = await productionRegistryService.getAll();
    setEntries(data);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !version) return;
    await productionRegistryService.addEntry({ region, project, version, remarks });
    setProject('');
    setVersion('');
    setRemarks('');
    setIsModalOpen(false);
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this registry entry?')) {
      await productionRegistryService.deleteEntry(id);
      loadEntries();
    }
  };

  // Helper to determine mock health and uptime based on project name hash
  const getMockMetrics = (name: string) => {
    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const uptime = (99.8 + (charCodeSum % 20) / 100).toFixed(3);
    const healthNum = charCodeSum % 3;
    let health: 'Optimal' | 'Normal' | 'Degraded' = 'Optimal';
    let colorClass = 'bg-secondary';
    let glowClass = 'shadow-[0_0_8px_rgba(78,222,163,0.5)]';
    let textClass = 'text-secondary';
    let bars = [1, 1, 1, 1];

    if (healthNum === 0) {
      health = 'Degraded';
      colorClass = 'bg-tertiary';
      glowClass = 'shadow-[0_0_8px_rgba(255,178,183,0.5)]';
      textClass = 'text-tertiary';
      bars = [1, 0, 0, 0];
    } else if (healthNum === 1) {
      health = 'Normal';
      colorClass = 'bg-secondary';
      glowClass = '';
      textClass = 'text-secondary';
      bars = [1, 1, 0, 0];
    }

    return { uptime, health, colorClass, glowClass, textClass, bars };
  };

  return (
    <div className="space-y-6">
      {/* Action Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">Production Registry</h2>
          <p className="text-on-surface-variant/70 text-xs">Managing global microservices across clusters.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCompareOpen(true)}
            className="glass-panel px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 group text-xs text-on-surface font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">compare_arrows</span>
            <span className="font-label-caps text-label-caps">Compare Regions</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-secondary text-on-secondary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/10 text-xs font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-caps text-label-caps">Add Entry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Table & Feed sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Column: Services Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-md border border-white/5">
                  <span className="font-mono text-[10px] text-on-surface-variant/70">Environment:</span>
                  <span className="font-mono text-[10px] text-secondary font-bold">Production</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant/70 text-xs">
                <span className="material-symbols-outlined text-sm">filter_alt</span>
                <span className="font-label-caps text-[10px] font-mono">Active Clusters: Global</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/40 border-b border-white/5">
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Service Name</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Version</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Region</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Uptime</th>
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase">Health Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry) => {
                    const metrics = getMockMetrics(entry.project);
                    return (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${metrics.colorClass} ${metrics.glowClass}`}></div>
                            <span className="font-semibold text-sm">{entry.project}</span>
                          </div>
                          {entry.remarks && (
                            <p className="text-[11px] text-on-surface-variant/60 ml-5 truncate max-w-[200px] mt-0.5" title={entry.remarks}>
                              {entry.remarks}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/80">{entry.version}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold">{entry.region}</span>
                            <span className="text-[10px] text-on-surface-variant/60 font-mono">cluster-node</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-secondary">{metrics.uptime}%</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {metrics.bars.map((bar, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1.5 h-3 rounded-sm ${
                                    bar ? metrics.colorClass + ' opacity-' + (100 - i * 20) : 'bg-white/10'
                                  }`}
                                ></div>
                              ))}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${metrics.textClass}`}>{metrics.health}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-on-surface-variant/40 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete Registry Log"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant/60 text-xs font-mono">
                        No service microservices deployed yet. Click "Add Entry" to log a deploy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Deployment Feed */}
        <aside className="lg:col-span-4">
          <div className="glass-panel p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-headline-sm text-sm font-bold">Deployment Feed</h4>
              <span className="text-[9px] font-mono text-on-surface-variant bg-white/5 px-2 py-0.5 rounded border border-white/5">
                LIVE UPDATES
              </span>
            </div>
            
            <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5 h-[400px] overflow-y-auto pr-1">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="relative pl-6 group">
                  <div className="absolute left-[7px] top-1.5 w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]"></div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-on-surface-variant/60">{entry.updatedDate}</span>
                      <span className="bg-secondary/10 text-secondary text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Success</span>
                    </div>
                    <h5 className="text-xs font-bold group-hover:text-primary transition-colors">{entry.project}</h5>
                    <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                      Deployed version <span className="font-mono text-on-surface">{entry.version}</span> to cluster {entry.region}.
                    </p>
                    {entry.remarks && (
                      <p className="text-[9px] text-on-surface-variant/50 italic">"{entry.remarks}"</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Hardcoded system items as fallback/visual fill */}
              <div className="relative pl-6 group opacity-70">
                <div className="absolute left-[7px] top-1.5 w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(255,178,183,0.4)]"></div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-on-surface-variant/60">08:15:02 AM</span>
                    <span className="bg-tertiary/10 text-tertiary text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">Incident</span>
                  </div>
                  <h5 className="text-xs font-bold text-tertiary">Payment-Gateway Drift</h5>
                  <p className="text-[10px] text-on-surface-variant/70 leading-relaxed">
                    Detected version mismatch in Tokyo-Edge node. Auto-reversion initiated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Glassmorphic Compare Regions Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel inner-glow w-full max-w-lg rounded-2xl p-6 relative">
            <button 
              onClick={() => setIsCompareOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">compare_arrows</span>
              Compare Regions
            </h3>
            <p className="text-xs text-on-surface-variant/80 mb-4">
              Regional sync comparison metrics for logged microservices.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2 text-[10px] font-label-caps text-on-surface-variant/70">
                <span>SERVICE</span>
                <span>US-EAST</span>
                <span>EU-WEST</span>
                <span>AP-SOUTH</span>
              </div>
              {Array.from(new Set(entries.map(e => e.project))).map(project => {
                const usVer = entries.find(e => e.project === project && e.region === 'US-East')?.version || '-';
                const euVer = entries.find(e => e.project === project && e.region === 'EU-West')?.version || '-';
                const apVer = entries.find(e => e.project === project && e.region === 'AP-South')?.version || '-';
                return (
                  <div key={project} className="flex justify-between py-1 border-b border-white/5">
                    <span className="font-semibold text-on-surface">{project}</span>
                    <span className="text-on-surface-variant/80">{usVer}</span>
                    <span className="text-on-surface-variant/80">{euVer}</span>
                    <span className="text-on-surface-variant/80">{apVer}</span>
                  </div>
                );
              })}
              {entries.length === 0 && (
                <div className="text-center py-4 text-on-surface-variant/60 text-[11px]">
                  No services to compare.
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsCompareOpen(false)}
              className="mt-6 w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg text-xs"
            >
              Close Comparison
            </button>
          </div>
        </div>
      )}

      {/* Glassmorphic Add Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel inner-glow w-full max-w-md rounded-2xl p-6 relative">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">add_circle</span>
              Add Registry Entry
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Project / Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auth Service"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Version
                </label>
                <input
                  type="text"
                  placeholder="e.g. v1.2.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Region Cluster
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface"
                >
                  <option value="US-East">US-East (Ohio)</option>
                  <option value="EU-West">EU-West (Dublin)</option>
                  <option value="AP-South">AP-South (Mumbai)</option>
                  <option value="Global">Global Edge</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  placeholder="e.g. Optimised latency, Security patch"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface"
                  rows={3}
                />
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
                className="flex-1 bg-secondary hover:opacity-90 text-on-secondary font-semibold py-2.5 rounded-lg text-xs shadow-lg shadow-secondary/10"
              >
                Deploy Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
