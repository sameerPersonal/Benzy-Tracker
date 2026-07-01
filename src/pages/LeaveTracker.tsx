import React, { useEffect, useState } from 'react';
import { leaveTrackerService } from '../services/leaveTrackerService';
import type { LeaveEntry } from '../services/mockData';

export const LeaveTracker: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [resource, setResource] = useState('');
  const [leaveType, setLeaveType] = useState<'Planned' | 'Emergency'>('Planned');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string; entries: LeaveEntry[] } | null>(null);

  const loadLeaves = async () => {
    const data = await leaveTrackerService.getAll();
    setLeaves(data);
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || !startDate || !endDate) return;
    await leaveTrackerService.addEntry({ resource, leaveType, startDate, endDate });
    setResource('');
    setStartDate('');
    setEndDate('');
    setIsModalOpen(false);
    loadLeaves();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this leave entry?')) {
      await leaveTrackerService.deleteEntry(id);
      loadLeaves();
      setSelectedDayInfo(null);
    }
  };

  // Monthly Calendar configuration (June 2026)
  const year = 2026;
  const month = 5; // June (0-indexed)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = new Date(year, month, 1).getDay();

  const getLeavesForDate = (dateStr: string): LeaveEntry[] => {
    return leaves.filter(leave => {
      return dateStr >= leave.startDate && dateStr <= leave.endDate;
    });
  };

  const handleDayClick = (dayStr: string, dayLeaves: LeaveEntry[]) => {
    setSelectedDayInfo({ date: dayStr, entries: dayLeaves });
  };

  const renderCalendarDays = () => {
    const calendarCells = [];
    
    // Empty cells before start of month (adjusting so Monday is the first column as in Stitch)
    // Sunday start day is index 0. Monday is 1. If startDayOfWeek = 1 (June 1st is Monday), we do 0 empty cells.
    // Stitch starts Mon, Tue, Wed, Thu, Fri, Sat, Sun.
    // Shift days of week so Monday is first (index 0).
    const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    for (let i = 0; i < adjustedStart; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="border-r border-b border-white/5 p-3 opacity-20 bg-[#060e20]/40 min-h-[120px]"></div>
      );
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLeaves = getLeavesForDate(dayStr);
      const isToday = day === 30; // June 30th as today matching local mock time

      calendarCells.push(
        <div
          key={dayStr}
          onClick={() => handleDayClick(dayStr, dayLeaves)}
          className={`group border-r border-b border-white/5 p-3 min-h-[120px] transition-all hover:bg-white/5 cursor-pointer relative ${
            isToday ? 'bg-primary/5' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span 
              className={`font-mono text-xs ${
                isToday 
                  ? 'bg-primary text-on-primary w-6 h-6 rounded-full flex items-center justify-center font-bold' 
                  : 'text-on-surface-variant/80'
              }`}
            >
              {day}
            </span>
          </div>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[80px]">
            {dayLeaves.map((leave) => {
              const isPlanned = leave.leaveType === 'Planned';
              const indicatorColor = isPlanned 
                ? 'bg-primary/20 border-primary/30 text-primary' 
                : 'bg-secondary/20 border-secondary/30 text-secondary';
              const dotColor = isPlanned ? 'bg-primary' : 'bg-secondary';
              
              return (
                <div 
                  key={leave.id}
                  className={`flex items-center gap-1.5 p-1 rounded border text-[9px] font-mono leading-none ${indicatorColor}`}
                  title={`${leave.resource} (${leave.leaveType})`}
                >
                  <div className={`w-1 h-2 rounded-full ${dotColor}`}></div>
                  <span className="truncate">{leave.resource.toUpperCase().split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Padding cells at the end to make complete rows (multiples of 7)
    const totalCells = adjustedStart + daysInMonth;
    const paddingCells = 7 - (totalCells % 7);
    if (paddingCells < 7) {
      for (let i = 0; i < paddingCells; i++) {
        calendarCells.push(
          <div key={`empty-end-${i}`} className="border-r border-b border-white/5 p-3 opacity-20 bg-[#060e20]/40 min-h-[120px]"></div>
        );
      }
    }

    return calendarCells;
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <nav className="flex text-[10px] font-mono text-on-surface-variant/70 mb-2 gap-2 uppercase tracking-widest">
            <span className="hover:text-primary cursor-pointer">Sprints</span>
            <span>/</span>
            <span className="text-primary font-bold">Leave Calendar</span>
          </nav>
          <h2 className="font-display-lg text-2xl font-bold">Resource Availability</h2>
          <p className="text-on-surface-variant/80 text-xs max-w-xl">
            Track planned holidays, emergency availability limits, and shift indicators.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-surface-container-low rounded-xl p-1 border border-white/5">
            <button className="p-1 px-2.5 hover:bg-white/5 rounded-lg transition-all text-on-surface-variant/80 text-xs">
              <span className="material-symbols-outlined text-sm align-middle">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-xs font-mono font-bold align-middle">June 2026</span>
            <button className="p-1 px-2.5 hover:bg-white/5 rounded-lg transition-all text-on-surface-variant/80 text-xs">
              <span className="material-symbols-outlined text-sm align-middle">chevron_right</span>
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-xl text-xs border border-primary/20 flex items-center gap-2 hover:bg-primary-fixed-dim hover:text-primary-fixed transition-all cursor-pointer shadow-lg shadow-primary/10 animate-pulse"
          >
            <span className="material-symbols-outlined">event_available</span>
            <span className="font-label-caps text-label-caps">Book Leave</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left, details right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar Area */}
        <div className="lg:col-span-9">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-surface-container-low/50 font-mono text-[10px] font-bold text-on-surface-variant/80 tracking-widest uppercase">
              <div className="py-4 text-center">Mon</div>
              <div className="py-4 text-center">Tue</div>
              <div className="py-4 text-center">Wed</div>
              <div className="py-4 text-center">Thu</div>
              <div className="py-4 text-center">Fri</div>
              <div className="py-4 text-center text-secondary">Sat</div>
              <div className="py-4 text-center text-secondary">Sun</div>
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 bg-[#0b1326]/20">
              {renderCalendarDays()}
            </div>
          </div>
        </div>

        {/* Selected Details Widget */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="font-headline-sm text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Leave Highlights
            </h3>
            
            {selectedDayInfo ? (
              <div className="space-y-4">
                <p className="text-[11px] font-mono text-on-surface-variant/80 border-b border-white/5 pb-2">
                  DATE: {selectedDayInfo.date}
                </p>
                {selectedDayInfo.entries.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/60">No resource leave scheduled on this day.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayInfo.entries.map((entry) => (
                      <div key={entry.id} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-on-surface">{entry.resource}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            entry.leaveType === 'Emergency' ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
                          }`}>
                            {entry.leaveType}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-on-surface-variant/60">
                          <span>{entry.startDate} to {entry.endDate}</span>
                          <button 
                            onClick={() => handleDelete(entry.id)}
                            className="text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            Cancel Leave
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-on-surface-variant/60 py-6 text-center italic">
                Click any calendar date to view leave details or cancel schedule records.
              </div>
            )}
          </div>

          {/* Quick Stats Widget */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-on-surface-variant">METRICS SUMMARY</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="text-[9px] text-on-surface-variant font-mono">PLANNED LEAVES</div>
                <div className="text-lg font-bold text-primary">{leaves.filter(l => l.leaveType === 'Planned').length}</div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                <div className="text-[9px] text-on-surface-variant font-mono">EMERGENCY LEAVES</div>
                <div className="text-lg font-bold text-secondary">{leaves.filter(l => l.leaveType === 'Emergency').length}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Glassmorphic Book Leave Modal */}
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
              <span className="material-symbols-outlined text-primary">event_available</span>
              Book Resource Leave
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alice Smith"
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                  Leave Class
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as 'Planned' | 'Emergency')}
                  className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                >
                  <option value="Planned">Planned Leave (Vacation/Off-site)</option>
                  <option value="Emergency">Emergency Leave (Sick/Personal)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg bg-surface-container-low border border-white/10 px-3 py-2 text-xs focus:ring-1 focus:ring-primary/50 focus:outline-none text-on-surface"
                    required
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant/80 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                Log Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
