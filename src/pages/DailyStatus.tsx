import React, { useEffect, useState } from 'react';
import { teamStatusService } from '../services/teamStatusService';
import { leaveTrackerService } from '../services/leaveTrackerService';
import { teamMemberService } from '../services/teamMemberService';
import type { DailyStatus as StatusType, LeaveEntry } from '../services/mockData';

export const DailyStatus: React.FC = () => {
  const [statuses, setStatuses] = useState<StatusType[]>([]);
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [resource, setResource] = useState('');
  const [focus, setFocus] = useState('');
  const [remarks, setRemarks] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editResource, setEditResource] = useState('');
  const [editFocus, setEditFocus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editDate, setEditDate] = useState('');

  // Deleting State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    const statusData = await teamStatusService.getAll();
    const leaveData = await leaveTrackerService.getAll();
    setStatuses(statusData);
    setLeaves(leaveData);
  };

  useEffect(() => {
    loadData();
    // Load cached/default team members immediately
    const cached = teamMemberService.getMembers();
    setTeamMembers(cached);
    if (cached.length > 0) {
      setResource(cached[0]);
    }
    // Fetch latest from Supabase in background
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || !focus) return;
    await teamStatusService.addEntry({
      date,
      resource,
      focus,
      remarks
    });
    setResource(teamMembers[0] || '');
    setFocus('');
    setRemarks('');
    setDate(todayStr);
    loadData();
  };

  const startEdit = (status: StatusType) => {
    setEditingId(status.id);
    setEditResource(status.resource);
    setEditFocus(status.focus);
    setEditRemarks(status.remarks || '');
    setEditDate(status.date);
  };

  const handleUpdate = async (id: string) => {
    if (!editResource || !editFocus || !editDate) return;
    try {
      await teamStatusService.updateEntry(id, {
        date: editDate,
        resource: editResource,
        focus: editFocus,
        remarks: editRemarks
      });
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Error updating status. Please try again.');
    }
  };

  // Safe calculation for days difference (avoids timezone shift off-by-ones)
  const getDaysAgo = (dateStr: string) => {
    const today = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = currentDate.getTime() - targetDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateLabel = (dateStr: string) => {
    const diffDays = getDaysAgo(dateStr);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 2) return 'Day before yesterday';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays === -2) return 'Day after tomorrow';
    if (diffDays > 2 && diffDays <= 7) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      return targetDate.toLocaleDateString(undefined, { weekday: 'long' });
    }
    return dateStr;
  };

  // Filter & Sort statuses to keep future dates and last 7 days in date descending order
  const oneWeekStatuses = [...statuses]
    .filter((status) => {
      const diff = getDaysAgo(status.date);
      return diff <= 7; // includes future dates (diff < 0) and past 7 days (diff <= 7)
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Calculations for Summary
  const todayLeaves = leaves.filter(l => todayStr >= l.startDate && todayStr <= l.endDate);
  const plannedLeaveCount = todayLeaves.filter(l => l.leaveType === 'Planned').length;
  const emergencyLeaveCount = todayLeaves.filter(l => l.leaveType === 'Emergency').length;
  
  const uniqueResourcesOnDuty = new Set(statuses.filter(s => s.date === todayStr).map(s => s.resource));
  const workingCount = uniqueResourcesOnDuty.size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex text-[10px] font-mono text-on-surface-variant/70 mb-2 gap-2 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Sprints</span>
            <span>/</span>
            <span className="text-primary font-bold">Daily Feed</span>
          </nav>
          <h2 className="font-display-lg text-2xl font-bold">Daily Team Status</h2>
          <p className="text-on-surface-variant/80 text-xs max-w-xl">
            Report and track daily sprint tasks, blockers, and resource counts.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-xl border border-white/5 font-mono text-xs">
          <span className="text-on-surface-variant/60">DATE:</span>
          <span className="text-primary font-bold">{todayStr}</span>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="glass-panel inner-glow p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -mr-10 -mt-10"></div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/80">Working Count</p>
            <h3 className="mt-1 text-2xl font-bold text-secondary">{workingCount} Active</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">groups</span>
          </div>
        </div>

        <div className="glass-panel inner-glow p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-10 -mt-10"></div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/80">Planned Leaves</p>
            <h3 className="mt-1 text-2xl font-bold text-primary">{plannedLeaveCount} Logged</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">event_busy</span>
          </div>
        </div>

        <div className="glass-panel inner-glow p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 blur-3xl -mr-10 -mt-10"></div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/80">Emergency Leaves</p>
            <h3 className="mt-1 text-2xl font-bold text-tertiary">{emergencyLeaveCount} Logged</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary">warning</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form left, Feed right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Container */}
        <div className="glass-panel inner-glow p-6 rounded-2xl space-y-4 h-fit">
          <h3 className="text-md font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assignment_add</span>
            Log Today's Focus
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                Resource Name
              </label>
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface font-semibold"
                required
              >
                {teamMembers.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#171f33] text-on-surface font-semibold">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                Today's Focus
              </label>
              <textarea
                placeholder="What tasks or Jira tickets are you working on today?"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                Blockers / Remarks
              </label>
              <input
                type="text"
                placeholder="e.g. Awaiting API endpoints integration"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-lg text-xs hover:opacity-95 transition-all shadow-lg shadow-primary/10 cursor-pointer"
            >
              Post Status Update
            </button>
          </form>
        </div>

        {/* Daily Feed Timeline */}
        <div className="lg:col-span-2 glass-panel inner-glow p-6 rounded-2xl space-y-4">
          <h3 className="text-md font-bold flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">assignment_turned_in</span>
            Daily Feed Timeline
          </h3>

          <div className="space-y-6 relative before:content-[''] before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
            {oneWeekStatuses.map((status) => {
              const isEditing = editingId === status.id;
              const isDeleting = deletingId === status.id;
              const userInitials = status.resource.split(' ').map(n => n[0]).join('').toUpperCase();
              return (
                <div key={status.id} className="flex gap-6 items-start relative group">
                  {/* Monogram circle avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 z-10 font-bold text-xs text-primary bg-[#0b1326]">
                    {userInitials}
                  </div>
                  
                  <div className="flex-1 pb-6 border-b border-white/5 space-y-2">
                    {isEditing ? (
                      <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div>
                          <label className="block font-mono text-[9px] text-on-surface-variant/70 uppercase mb-1">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-1.5 text-xs focus:outline-none text-on-surface font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-on-surface-variant/70 uppercase mb-1">Resource</label>
                          <select
                            value={editResource}
                            onChange={(e) => setEditResource(e.target.value)}
                            className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-1.5 text-xs focus:outline-none text-on-surface font-semibold"
                          >
                            {teamMembers.map((opt) => (
                              <option key={opt} value={opt} className="bg-[#171f33] text-on-surface font-semibold">{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-on-surface-variant/70 uppercase mb-1">Today's Focus</label>
                          <textarea
                            value={editFocus}
                            onChange={(e) => setEditFocus(e.target.value)}
                            className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-1.5 text-xs focus:outline-none text-on-surface"
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <label className="block font-mono text-[9px] text-on-surface-variant/70 uppercase mb-1">Blockers / Remarks</label>
                          <input
                            type="text"
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-1.5 text-xs focus:outline-none text-on-surface"
                            placeholder="e.g. None"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-on-surface rounded-lg text-xs border border-white/10 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(status.id)}
                            className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : isDeleting ? (
                      <div className="flex items-center gap-3 bg-red-500/5 p-3 rounded-xl border border-red-500/15 text-xs text-on-surface">
                        <span className="material-symbols-outlined text-red-400 text-sm">warning</span>
                        <span className="font-semibold text-red-400">Are you sure you want to delete this status update?</span>
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-[11px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await teamStatusService.deleteEntry(status.id);
                                setDeletingId(null);
                                loadData();
                              } catch (err) {
                                console.error('Failed to delete status:', err);
                                alert('Error deleting status. Please try again.');
                              }
                            }}
                            className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-lg shadow-red-500/10"
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{status.resource}</span>
                            <span className="text-[10px] font-mono text-on-surface-variant/60">• {formatDateLabel(status.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(status)}
                              className="text-on-surface-variant/50 hover:text-primary p-1 rounded hover:bg-primary/10 transition-all cursor-pointer"
                              title="Edit Update"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingId(status.id)}
                              className="text-on-surface-variant/50 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete Update"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-on-surface-variant/90 leading-relaxed font-mono">
                          {status.focus}
                        </p>
                        
                        {status.remarks && (
                          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5 text-[11px] italic text-on-surface-variant/80">
                            <span className="material-symbols-outlined text-sm text-tertiary">warning_amber</span>
                            <span>Blockers: {status.remarks}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {oneWeekStatuses.length === 0 && (
              <div className="text-center text-on-surface-variant/60 text-xs py-12 font-mono">
                No statuses posted yet in the last week. Use the left form to check in.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
