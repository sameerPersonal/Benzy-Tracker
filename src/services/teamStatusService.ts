import { supabase } from '../api/supabaseClient';
import type { DailyStatus } from './mockData';

export const teamStatusService = {
  getAll: async (): Promise<DailyStatus[]> => {
    const { data, error } = await supabase
      .from('daily_status')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching team status:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      resource: row.resource,
      focus: row.focus,
      remarks: row.remarks || '',
    }));
  },

  addEntry: async (entry: Omit<DailyStatus, 'id'>): Promise<DailyStatus> => {
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

    if (error) {
      throw new Error(`Failed to add daily status: ${error.message}`);
    }

    return {
      id: data.id,
      date: data.date,
      resource: data.resource,
      focus: data.focus,
      remarks: data.remarks || '',
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_status')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete daily status: ${error.message}`);
    }
  }
};
