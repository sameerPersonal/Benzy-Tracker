import { supabase } from '../api/supabaseClient';
import type { DeliveryItem } from './mockData';

export const deliveryTrackerService = {
  getAll: async (): Promise<DeliveryItem[]> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .select('*')
      .order('expected_delivery_date', { ascending: true });

    if (error) {
      console.error('Error fetching delivery tracker:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      jiraId: row.jira_id,
      resource: row.resource,
      status: row.status as DeliveryItem['status'],
      expectedDeliveryDate: row.expected_delivery_date,
      liveDate: row.live_date || undefined,
    }));
  },

  addEntry: async (entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .insert([{
        jira_id: entry.jiraId,
        resource: entry.resource,
        status: entry.status,
        expected_delivery_date: entry.expectedDeliveryDate,
        live_date: entry.liveDate || null,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add delivery item: ${error.message}`);
    }

    return {
      id: data.id,
      jiraId: data.jira_id,
      resource: data.resource,
      status: data.status as DeliveryItem['status'],
      expectedDeliveryDate: data.expected_delivery_date,
      liveDate: data.live_date || undefined,
    };
  },

  updateStatus: async (id: string, status: DeliveryItem['status'], liveDate?: string): Promise<DeliveryItem> => {
    const computedLiveDate = liveDate || (status === 'Completed' ? new Date().toISOString().split('T')[0] : null);

    const { data, error } = await supabase
      .from('delivery_tracker')
      .update({
        status,
        live_date: computedLiveDate,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }

    return {
      id: data.id,
      jiraId: data.jira_id,
      resource: data.resource,
      status: data.status as DeliveryItem['status'],
      expectedDeliveryDate: data.expected_delivery_date,
      liveDate: data.live_date || undefined,
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('delivery_tracker')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete delivery item: ${error.message}`);
    }
  }
};
