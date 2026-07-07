import { supabase } from '../api/supabaseClient';
import type { LeaveEntry } from './mockData';

export const leaveTrackerService = {
  getAll: async (): Promise<LeaveEntry[]> => {
    const { data, error } = await supabase
      .from('leave_tracker')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching leave tracker:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      resource: row.resource,
      leaveType: row.leave_type as LeaveEntry['leaveType'],
      startDate: row.start_date,
      endDate: row.end_date,
    }));
  },

  addEntry: async (entry: Omit<LeaveEntry, 'id'>): Promise<LeaveEntry> => {
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

    if (error) {
      throw new Error(`Failed to add leave entry: ${error.message}`);
    }

    return {
      id: data.id,
      resource: data.resource,
      leaveType: data.leave_type as LeaveEntry['leaveType'],
      startDate: data.start_date,
      endDate: data.end_date,
    };
  },

  updateEntry: async (id: string, entry: Omit<LeaveEntry, 'id'>): Promise<LeaveEntry> => {
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

    if (error) {
      throw new Error(`Failed to update leave entry: ${error.message}`);
    }

    return {
      id: data.id,
      resource: data.resource,
      leaveType: data.leave_type as LeaveEntry['leaveType'],
      startDate: data.start_date,
      endDate: data.end_date,
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('leave_tracker')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete leave entry: ${error.message}`);
    }
  }
};
