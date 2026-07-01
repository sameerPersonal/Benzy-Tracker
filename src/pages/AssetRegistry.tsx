import React, { useEffect, useState } from 'react';
import { assetRegistryService } from '../services/assetRegistryService';
import type { AssetEntry } from '../services/mockData';

export const AssetRegistry: React.FC = () => {
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [region, setRegion] = useState('US-East');
  const [environment, setEnvironment] = useState<AssetEntry['environment']>('Live');
  const [assetType, setAssetType] = useState<AssetEntry['assetType']>('Main');
  const [ipAddress, setIpAddress] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadAssets = async () => {
    const data = await assetRegistryService.getAll();
    setAssets(data);
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipAddress) return;
    await assetRegistryService.addEntry({ region, environment, assetType, ipAddress, remarks });
    setIpAddress('');
    setRemarks('');
    setIsModalOpen(false);
    loadAssets();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this server asset?')) {
      await assetRegistryService.deleteEntry(id);
      loadAssets();
    }
  };

  // Group assets by Region
  const regions = Array.from(new Set(assets.map(a => a.region)));

  // Environment display configurations
  const envStyles = {
    Live: { dotColor: 'bg-secondary', label: 'Production Environment', textClass: 'text-secondary' },
    Beta: { dotColor: 'bg-primary', label: 'Beta Canary', textClass: 'text-primary' },
    Meta: { dotColor: 'bg-yellow-400', label: 'Meta Staging', textClass: 'text-yellow-400' },
    Google: { dotColor: 'bg-indigo-400', label: 'Google Cloud Platform', textClass: 'text-indigo-400' },
  };

  // Mock regional statistics
  const getRegionStats = (regName: string) => {
    const sum = regName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const availability = (99.9 + (sum % 10) / 100).toFixed(2);
    const provider = sum % 2 === 0 ? 'Amazon Web Services • Core Region' : 'Google Cloud Platform • Multi-Region';
    return { availability, provider };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex text-[10px] font-mono text-on-surface-variant/70 mb-2 gap-2 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Resources</span>
            <span>/</span>
            <span className="text-primary font-bold">Server Registry</span>
          </nav>
          <h2 className="font-display-lg text-2xl font-bold">Fleet Infrastructure</h2>
          <p className="text-on-surface-variant/80 text-xs max-w-xl">
            Centralized inventory management across hybrid-cloud regions. Monitoring active virtual nodes.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl text-xs border border-primary/20 flex items-center gap-2 hover:bg-primary-fixed-dim hover:text-primary-fixed transition-all cursor-pointer shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="font-label-caps text-label-caps">Register Asset</span>
          </button>
        </div>
      </div>

      {/* Regions Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {regions.map((reg) => {
          const regAssets = assets.filter(a => a.region === reg);
          const stats = getRegionStats(reg);
          
          return (
            <div key={reg} className="glass-panel rounded-3xl overflow-hidden group flex flex-col justify-between">
              {/* Region Header */}
              <div>
                <div className="px-8 py-6 flex justify-between items-center bg-white/5 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center border border-primary/20">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm font-bold text-sm text-on-surface">{reg.toUpperCase()}</h3>
                      <span className="font-mono text-[9px] text-on-surface-variant/60 uppercase tracking-tighter">{stats.provider}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-secondary">{stats.availability}%</div>
                    <div className="text-[9px] font-label-caps text-on-surface-variant/60">Availability</div>
                  </div>
                </div>

                {/* Environments List */}
                <div className="p-6 space-y-4">
                  {/* Group assets by environment inside region */}
                  {['Live', 'Beta', 'Meta', 'Google'].map((envKey) => {
                    const envAssets = regAssets.filter(a => a.environment === envKey);
                    if (envAssets.length === 0) return null;
                    const config = envStyles[envKey as AssetEntry['environment']];

                    return (
                      <div key={envKey} className="bg-surface-container-low/40 rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`}></span>
                            <span className="font-label-caps text-[10px] uppercase font-bold text-on-surface/80">{config.label}</span>
                          </div>
                          <span className="font-mono text-[10px] text-on-surface-variant/60">{envAssets.length} Nodes</span>
                        </div>

                        <div className="space-y-2">
                          {envAssets.map((asset) => (
                            <div 
                              key={asset.id} 
                              className="flex justify-between items-center p-2 rounded-lg bg-black/20 border border-white/5 group/row hover:bg-primary/5 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">terminal</span>
                                <span className="font-mono text-xs font-semibold text-on-surface/90">
                                  {asset.assetType.toLowerCase()}-{asset.id.slice(0, 4)}
                                </span>
                                {asset.remarks && (
                                  <span className="text-[10px] text-on-surface-variant/60 truncate max-w-[120px]" title={asset.remarks}>
                                    ({asset.remarks})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded">
                                  {asset.ipAddress}
                                </span>
                                <button 
                                  onClick={() => handleDelete(asset.id)}
                                  className="text-on-surface-variant/30 hover:text-red-400 p-0.5 rounded transition-all cursor-pointer opacity-0 group-hover/row:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Region Placeholder */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="rounded-3xl border-2 border-dashed border-white/5 hover:border-primary/30 transition-all flex flex-col items-center justify-center min-h-[260px] group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
            <span className="material-symbols-outlined text-3xl">add</span>
          </div>
          <h3 className="font-headline-sm font-bold text-sm text-on-surface-variant">Register Infrastructure Asset</h3>
          <p className="font-body-sm text-[11px] text-on-surface-variant opacity-50 mt-1">Connect new nodes, regions or local server clusters</p>
        </div>
      </div>

      {/* Sticky Bottom Fleet Overview Status */}
      <div className="mt-8 flex items-center justify-between p-5 glass-panel rounded-2xl border-t border-white/10 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="font-label-caps text-[9px] text-on-surface-variant font-mono">TOTAL ACTIVE NODES</span>
            <span className="font-headline-sm text-primary font-bold text-sm">{assets.length}</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col">
            <span className="font-label-caps text-[9px] text-on-surface-variant font-mono">GLOBAL SLI STATUS</span>
            <span className="font-headline-sm text-secondary font-bold text-sm">Optimal</span>
          </div>
        </div>
      </div>

      {/* Glassmorphic Add Asset Modal */}
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
              <span className="material-symbols-outlined text-primary">dns</span>
              Register Infrastructure Asset
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Region / Location Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. US-East, AP-South, Google Cloud"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as AssetEntry['environment'])}
                    className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  >
                    <option value="Live">Live (Prod)</option>
                    <option value="Beta">Beta (Canary)</option>
                    <option value="Meta">Meta (Staging)</option>
                    <option value="Google">Google (Canary)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    Asset / Server Type
                  </label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value as AssetEntry['assetType'])}
                    className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  >
                    <option value="Main">Main Core Web</option>
                    <option value="Utils">Utils Worker</option>
                    <option value="MainDB">Primary DB</option>
                    <option value="Replication DB">Replication DB</option>
                    <option value="LogDB">Elastic Log DB</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10.0.4.112"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Asset Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. primary billing cluster node"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
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
                className="flex-1 bg-primary hover:opacity-90 text-on-primary font-semibold py-2.5 rounded-lg text-xs shadow-lg shadow-primary/10"
              >
                Register Asset
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
