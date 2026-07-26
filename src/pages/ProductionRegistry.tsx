import React, { useEffect, useState } from 'react';
import { productionRegistryService } from '../services/productionRegistryService';
import type { ProductionRegistryEntry } from '../services/mockData';

const BranchBadge: React.FC<{ branchName: string; customStyle?: { bg: string; border: string; text: string } | null }> = ({ branchName, customStyle }) => {
  if (!branchName || branchName === '-') {
    return <span className="text-on-surface-variant/30 font-mono text-xs">-</span>;
  }
  
  const fallback = { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)', text: '#e2e8f0' };
  const style = customStyle || fallback;
  
  return (
    <span 
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        color: style.text,
      }}
      className="inline-block px-2.5 py-1 rounded border text-xs font-mono font-bold max-w-full break-all text-center shadow-sm"
    >
      {branchName}
    </span>
  );
};

export const ProductionRegistry: React.FC = () => {
  const [entries, setEntries] = useState<ProductionRegistryEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionRegistryEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<ProductionRegistryEntry | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<'project' | 'version' | 'region' | 'updatedDate' | 'remarks'>('updatedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Form State
  const [project, setProject] = useState('Flights');
  const [version, setVersion] = useState('');
  const [region, setRegion] = useState('SA');
  const [remarks, setRemarks] = useState('');

  const loadEntries = async () => {
    const data = await productionRegistryService.getAll();
    setEntries(data);
  };

  const handleSort = (field: 'project' | 'version' | 'region' | 'updatedDate' | 'remarks') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: 'project' | 'version' | 'region' | 'updatedDate' | 'remarks') => {
    if (sortField !== field) return null;
    return (
      <span className="material-symbols-outlined text-[12px] align-middle ml-1 font-bold text-secondary select-none">
        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const valA = a[sortField]?.toLowerCase() || '';
    const valB = b[sortField]?.toLowerCase() || '';
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !version) return;
    try {
      if (editingEntry) {
        await productionRegistryService.updateEntry(editingEntry.id, { region, project, version, remarks });
      } else {
        await productionRegistryService.addEntry({ region, project, version, remarks });
      }
      setProject('Flights');
      setVersion('');
      setRegion('SA');
      setRemarks('');
      setEditingEntry(null);
      setIsModalOpen(false);
      loadEntries();
    } catch (err: any) {
      console.error('Error saving entry:', err);
      alert(err.message || 'Failed to save entry');
    }
  };

  const handleEdit = (entry: ProductionRegistryEntry) => {
    setEditingEntry(entry);
    setProject(entry.project);
    setVersion(entry.version);
    setRegion(entry.region);
    setRemarks(entry.remarks || '');
    setIsModalOpen(true);
  };

  const handleDelete = (entry: ProductionRegistryEntry) => {
    setDeleteConfirmEntry(entry);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmEntry) return;
    try {
      await productionRegistryService.deleteEntry(deleteConfirmEntry.id);
      setDeleteConfirmEntry(null);
      await loadEntries();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-md text-2xl font-bold text-on-surface tracking-tight">Live Branch Details</h2>
          <p className="text-on-surface-variant/70 text-xs">Tracking git branch deployment across regions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCompareOpen(true)}
            className="glass-panel px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 text-xs text-on-surface font-semibold cursor-pointer border border-white/10"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">compare_arrows</span>
            <span className="font-label-caps text-label-caps">Compare Regions</span>
          </button>
          <button 
            onClick={() => {
              setEditingEntry(null);
              setProject('Flights');
              setVersion('');
              setRegion('SA');
              setRemarks('');
              setIsModalOpen(true);
            }}
            className="bg-secondary text-on-secondary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-secondary/10 text-xs font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-caps text-label-caps">Add Branch Details</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Table (Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Column: Services Table */}
        <div className="lg:col-span-12 space-y-6">
          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-md border border-white/5">
                  <span className="font-mono text-[10px] text-on-surface-variant/70">Environment:</span>
                  <span className="font-mono text-[10px] text-secondary font-bold">Live</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant/70 text-xs">
                <span className="material-symbols-outlined text-sm">filter_alt</span>
                <span className="font-label-caps text-[10px] font-mono">Active Regions: ME / APAC / Europe</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b-2 border-white/10">
                    <th 
                      onClick={() => handleSort('project')}
                      className="px-6 py-5 font-mono text-xs font-bold text-on-surface/90 tracking-widest uppercase cursor-pointer hover:text-primary hover:bg-white/[0.02] transition-colors select-none"
                    >
                      Project {renderSortIcon('project')}
                    </th>
                    <th 
                      onClick={() => handleSort('version')}
                      className="px-6 py-5 font-mono text-xs font-bold text-on-surface/90 tracking-widest uppercase cursor-pointer hover:text-primary hover:bg-white/[0.02] transition-colors select-none"
                    >
                      Git Branch {renderSortIcon('version')}
                    </th>
                    <th 
                      onClick={() => handleSort('region')}
                      className="px-6 py-5 font-mono text-xs font-bold text-on-surface/90 tracking-widest uppercase cursor-pointer hover:text-primary hover:bg-white/[0.02] transition-colors select-none"
                    >
                      Region {renderSortIcon('region')}
                    </th>
                    <th 
                      onClick={() => handleSort('updatedDate')}
                      className="px-6 py-5 font-mono text-xs font-bold text-on-surface/90 tracking-widest uppercase cursor-pointer hover:text-primary hover:bg-white/[0.02] transition-colors select-none"
                    >
                      Released Date {renderSortIcon('updatedDate')}
                    </th>
                    <th 
                      onClick={() => handleSort('remarks')}
                      className="px-6 py-5 font-mono text-xs font-bold text-on-surface/90 tracking-widest uppercase cursor-pointer hover:text-primary hover:bg-white/[0.02] transition-colors select-none"
                    >
                      Remarks {renderSortIcon('remarks')}
                    </th>
                    <th className="px-6 py-5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedEntries.map((entry) => {
                    return (
                      <tr key={entry.id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]"></div>
                            <span className="font-semibold text-sm">{entry.project}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/80">{entry.version}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold">{entry.region}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-on-surface-variant/80">{entry.updatedDate}</td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant/80 max-w-xs truncate" title={entry.remarks || ''}>
                          {entry.remarks || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="text-on-surface-variant/60 hover:text-primary p-1 rounded hover:bg-white/5 transition-all cursor-pointer"
                              title="Edit Branch Details"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(entry)}
                              className="text-on-surface-variant/60 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete Branch Details"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant/60 text-xs font-mono">
                        No project branch details logged yet. Click "Add Branch Details" to log a branch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>



      {/* Glassmorphic Add Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="glass-panel inner-glow w-full max-w-md rounded-2xl p-6 relative">
            <button 
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingEntry(null);
              }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">
                {editingEntry ? 'edit' : 'add_circle'}
              </span>
              {editingEntry ? 'Edit Branch Details' : 'Add Branch Details'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Project
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface font-semibold"
                  required
                >
                  <option value="Flights">Flights</option>
                  <option value="Utils">Utils</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Git Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. main, release/v2.1"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-secondary/50 focus:outline-none text-on-surface font-semibold"
                >
                  <option value="SA">SA (Saudi Arabia)</option>
                  <option value="AE">AE (UAE)</option>
                  <option value="IN">IN (India)</option>
                  <option value="KW">KW (Kuwait)</option>
                  <option value="QA">QA (Qatar)</option>
                  <option value="UK">UK (United Kingdom)</option>
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
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEntry(null);
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2.5 rounded-lg text-xs border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-secondary hover:opacity-90 text-on-secondary font-semibold py-2.5 rounded-lg text-xs shadow-lg shadow-secondary/10 cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Glassmorphic Delete Confirmation Modal */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel inner-glow w-full max-w-sm rounded-2xl p-6 relative border-t-4 border-t-tertiary">
            <button 
              onClick={() => setDeleteConfirmEntry(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined">warning</span>
              Confirm Deletion
            </h3>
            
            <p className="text-xs text-on-surface-variant/80 mb-6 leading-relaxed">
              Are you sure you want to delete the branch details for <strong className="text-on-surface">{deleteConfirmEntry.project}</strong> in region <strong className="text-on-surface">{deleteConfirmEntry.region}</strong>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmEntry(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface font-semibold py-2 rounded-lg text-xs border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-tertiary hover:opacity-90 text-on-tertiary font-semibold py-2 rounded-lg text-xs shadow-lg shadow-tertiary/10 cursor-pointer"
              >
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Glassmorphic Compare Regions Modal */}
      {isCompareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel inner-glow w-full max-w-6xl rounded-2xl p-8 relative shadow-2xl border border-white/10 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setIsCompareOpen(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Close Modal"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            
            <div className="mb-6 flex-shrink-0">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">compare_arrows</span>
                Regional Branch Matrix
              </h3>
              <p className="text-xs text-on-surface-variant/80">
                Cross-region git branch synchronization. Identical branch names are highlighted with matching color tags.
              </p>
            </div>

            <div className="overflow-x-auto overflow-y-auto rounded-xl border border-white/5 bg-white/[0.01] mb-6 flex-grow">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-high/60 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <th className="px-6 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase w-[16%]">Project</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">SA</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">AE</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">IN</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">KW</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">QA</th>
                    <th className="px-4 py-4 font-label-caps text-[10px] font-mono text-on-surface-variant/70 tracking-widest uppercase text-center w-[14%]">UK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {Array.from(new Set(['Flights', 'Utils', ...entries.map(e => e.project)])).map(project => {
                    const saVer = entries.find(e => e.project === project && e.region === 'SA')?.version || '-';
                    const aeVer = entries.find(e => e.project === project && e.region === 'AE')?.version || '-';
                    const inVer = entries.find(e => e.project === project && e.region === 'IN')?.version || '-';
                    const kwVer = entries.find(e => e.project === project && e.region === 'KW')?.version || '-';
                    const qaVer = entries.find(e => e.project === project && e.region === 'QA')?.version || '-';
                    const ukVer = entries.find(e => e.project === project && e.region === 'UK')?.version || '-';
                    
                    const activeBranches = [saVer, aeVer, inVer, kwVer, qaVer, ukVer].filter(v => v && v !== '-');
                    const uniqueBranches = Array.from(new Set(activeBranches));
                    
                    let isSynced = true;
                    if (activeBranches.length > 1) {
                      isSynced = activeBranches.every(v => v === activeBranches[0]);
                    }
                    
                    const syncInfo = isSynced 
                      ? { status: 'Synced', icon: 'check_circle', color: 'text-secondary bg-secondary/10 border-secondary/20' }
                      : { status: 'Mismatched', icon: 'warning', color: 'text-tertiary bg-tertiary/10 border-tertiary/20' };

                    const distinctStyles = [
                      { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)', text: '#38bdf8' },
                      { bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.35)', text: '#fb923c' },
                      { bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.35)', text: '#c084fc' },
                      { bg: 'rgba(74, 222, 128, 0.12)', border: 'rgba(74, 222, 128, 0.35)', text: '#4ade80' },
                      { bg: 'rgba(251, 113, 133, 0.12)', border: 'rgba(251, 113, 133, 0.35)', text: '#fb7185' },
                      { bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.35)', text: '#2dd4bf' },
                      { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)', text: '#f43f5e' },
                      { bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.35)', text: '#818cf8' }
                    ];

                    const getRowBadgeStyle = (branch: string) => {
                      if (!branch || branch === '-') return null;
                      const idx = uniqueBranches.indexOf(branch);
                      if (idx === -1) return null;
                      return distinctStyles[idx % distinctStyles.length];
                    };

                    return (
                      <tr key={project} className="hover:bg-white/[0.02] transition-all">
                        <td className="px-6 py-5 font-semibold text-on-surface text-sm border-r border-white/5">
                          <div className="flex flex-col gap-1.5">
                            <span>{project}</span>
                            {activeBranches.length > 0 && (
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] w-fit font-mono font-bold ${syncInfo.color}`}>
                                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{syncInfo.icon}</span>
                                <span>{syncInfo.status}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={saVer} customStyle={getRowBadgeStyle(saVer)} /></td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={aeVer} customStyle={getRowBadgeStyle(aeVer)} /></td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={inVer} customStyle={getRowBadgeStyle(inVer)} /></td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={kwVer} customStyle={getRowBadgeStyle(kwVer)} /></td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={qaVer} customStyle={getRowBadgeStyle(qaVer)} /></td>
                        <td className="px-4 py-5 text-center"><BranchBadge branchName={ukVer} customStyle={getRowBadgeStyle(ukVer)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end flex-shrink-0">
              <button 
                onClick={() => setIsCompareOpen(false)}
                className="bg-primary hover:opacity-90 text-on-primary font-semibold px-6 py-2.5 rounded-lg text-xs cursor-pointer shadow-lg shadow-primary/10"
              >
                Close Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
