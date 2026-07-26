import { supabase } from '../api/supabaseClient';
import { getDB, saveDB } from './mockData';
import type { DailyStatus } from './mockData';

export const teamStatusService = {
  getAll: async (): Promise<DailyStatus[]> => {
    try {
      const { data, error } = await supabase
        .from('daily_status')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          date: row.date,
          resource: row.resource,
          focus: row.focus,
          remarks: row.remarks || '',
        }));
      }
    } catch (err) {
      console.warn('Supabase status fetch failed, using local storage fallback:', err);
    }
    return getDB().dailyStatus;
  },

  addEntry: async (entry: Omit<DailyStatus, 'id'>): Promise<DailyStatus> => {
    try {
      const { data, error } = await supabase
        .from('daily_status')
        .insert([{
          date: entry.date,
          resource: entry.resource,
          focus: entry.focus,
          remarks: entry.remarks,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          date: data.date,
          resource: data.resource,
          focus: data.focus,
          remarks: data.remarks || '',
        };
      }
    } catch (err) {
      console.warn('Supabase add status failed, saving locally:', err);
    }

    const db = getDB();
    const newEntry: DailyStatus = {
      ...entry,
      id: 's_' + Math.random().toString(36).substr(2, 9),
    };
    db.dailyStatus.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('daily_status')
        .delete()
        .eq('id', id);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase delete status failed, deleting locally:', err);
    }

    const db = getDB();
    db.dailyStatus = db.dailyStatus.filter((e) => e.id !== id);
    saveDB(db);
  },

  updateEntry: async (id: string, entry: Partial<Omit<DailyStatus, 'id'>>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('daily_status')
        .update({
          date: entry.date,
          resource: entry.resource,
          focus: entry.focus,
          remarks: entry.remarks,
        })
        .eq('id', id);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase update status failed, updating locally:', err);
    }

    const db = getDB();
    db.dailyStatus = db.dailyStatus.map((item) => (item.id === id ? { ...item, ...entry } : item));
    saveDB(db);
  }
};
