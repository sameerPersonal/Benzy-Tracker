import { supabase } from '../api/supabaseClient';
import { getDB, saveDB } from './mockData';
import type { LeaveEntry } from './mockData';

export const leaveTrackerService = {
  getAll: async (): Promise<LeaveEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('leave_tracker')
        .select('*')
        .order('start_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          resource: row.resource,
          leaveType: row.leave_type as LeaveEntry['leaveType'],
          startDate: row.start_date,
          endDate: row.end_date,
        }));
      }
    } catch (err) {
      console.warn('Supabase leave fetch failed, using local storage fallback:', err);
    }
    return getDB().leaveTracker;
  },

  addEntry: async (entry: Omit<LeaveEntry, 'id'>): Promise<LeaveEntry> => {
    try {
      const { data, error } = await supabase
        .from('leave_tracker')
        .insert([{
          resource: entry.resource,
          leave_type: entry.leaveType,
          start_date: entry.startDate,
          end_date: entry.endDate,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          resource: data.resource,
          leaveType: data.leave_type as LeaveEntry['leaveType'],
          startDate: data.start_date,
          endDate: data.end_date,
        };
      }
    } catch (err) {
      console.warn('Supabase add leave failed, saving locally:', err);
    }

    const db = getDB();
    const newEntry: LeaveEntry = {
      ...entry,
      id: 'l_' + Math.random().toString(36).substr(2, 9),
    };
    db.leaveTracker.push(newEntry);
    saveDB(db);
    return newEntry;
  },

  updateEntry: async (id: string, entry: Omit<LeaveEntry, 'id'>): Promise<LeaveEntry> => {
    try {
      const { data, error } = await supabase
        .from('leave_tracker')
        .update({
          resource: entry.resource,
          leave_type: entry.leaveType,
          start_date: entry.startDate,
          end_date: entry.endDate,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          resource: data.resource,
          leaveType: data.leave_type as LeaveEntry['leaveType'],
          startDate: data.start_date,
          endDate: data.end_date,
        };
      }
    } catch (err) {
      console.warn('Supabase update leave failed, updating locally:', err);
    }

    const db = getDB();
    const updated = { id, ...entry };
    db.leaveTracker = db.leaveTracker.map((item) => (item.id === id ? updated : item));
    saveDB(db);
    return updated;
  },

  deleteEntry: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('leave_tracker')
        .delete()
        .eq('id', id);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase delete leave failed, deleting locally:', err);
    }

    const db = getDB();
    db.leaveTracker = db.leaveTracker.filter((e) => e.id !== id);
    saveDB(db);
  }
};
