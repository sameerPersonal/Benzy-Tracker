import { supabase } from '../api/supabaseClient';
import type { DeliveryItem } from './mockData';

export const deliveryTrackerService = {
  getAll: async (): Promise<DeliveryItem[]> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching delivery tracker:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      jiraId: row.jira_id,
      taskName: row.task_name || '',
      resource: row.resource,
      status: row.status as DeliveryItem['status'],
      liveUpdates: row.live_updates || {},
    }));
  },

  addEntry: async (entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .insert([{
        jira_id: entry.jiraId,
        task_name: entry.taskName,
        resource: entry.resource,
        status: entry.status,
        live_updates: entry.liveUpdates || {},
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add delivery item: ${error.message}`);
    }

    return {
      id: data.id,
      jiraId: data.jira_id,
      taskName: data.task_name || '',
      resource: data.resource,
      status: data.status as DeliveryItem['status'],
      liveUpdates: data.live_updates || {},
    };
  },

  updateStatus: async (id: string, status: DeliveryItem['status']): Promise<DeliveryItem> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .update({
        status,
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
      taskName: data.task_name || '',
      resource: data.resource,
      status: data.status as DeliveryItem['status'],
      liveUpdates: data.live_updates || {},
    };
  },

  updateEntry: async (id: string, entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    const { data, error } = await supabase
      .from('delivery_tracker')
      .update({
        jira_id: entry.jiraId,
        task_name: entry.taskName,
        resource: entry.resource,
        status: entry.status,
        live_updates: entry.liveUpdates || {},
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deliverable: ${error.message}`);
    }

    return {
      id: data.id,
      jiraId: data.jira_id,
      taskName: data.task_name || '',
      resource: data.resource,
      status: data.status as DeliveryItem['status'],
      liveUpdates: data.live_updates || {},
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
