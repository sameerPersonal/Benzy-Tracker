import { supabase } from '../api/supabaseClient';
import { getDB, saveDB } from './mockData';
import type { DeliveryItem } from './mockData';

export const deliveryTrackerService = {
  getAll: async (): Promise<DeliveryItem[]> => {
    try {
      const { data, error } = await supabase
        .from('delivery_tracker')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          jiraId: row.jira_id,
          taskName: row.task_name || '',
          resource: row.resource,
          status: row.status as DeliveryItem['status'],
          liveUpdates: row.live_updates || {},
        }));
      }
    } catch (err) {
      console.warn('Supabase delivery fetch failed, using local storage fallback:', err);
    }
    return getDB().deliveryTracker;
  },

  addEntry: async (entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    try {
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

      if (!error && data) {
        return {
          id: data.id,
          jiraId: data.jira_id,
          taskName: data.task_name || '',
          resource: data.resource,
          status: data.status as DeliveryItem['status'],
          liveUpdates: data.live_updates || {},
        };
      }
    } catch (err) {
      console.warn('Supabase add delivery failed, saving locally:', err);
    }

    const db = getDB();
    const newEntry: DeliveryItem = {
      ...entry,
      id: 'd_' + Math.random().toString(36).substr(2, 9),
    };
    db.deliveryTracker.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  updateStatus: async (id: string, status: DeliveryItem['status']): Promise<DeliveryItem> => {
    try {
      const { data, error } = await supabase
        .from('delivery_tracker')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          jiraId: data.jira_id,
          taskName: data.task_name || '',
          resource: data.resource,
          status: data.status as DeliveryItem['status'],
          liveUpdates: data.live_updates || {},
        };
      }
    } catch (err) {
      console.warn('Supabase status update failed, updating locally:', err);
    }

    const db = getDB();
    let updatedItem: DeliveryItem | null = null;
    db.deliveryTracker = db.deliveryTracker.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, status };
        return updatedItem;
      }
      return item;
    });
    saveDB(db);
    if (!updatedItem) throw new Error('Delivery item not found');
    return updatedItem;
  },

  updateEntry: async (id: string, entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    try {
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

      if (!error && data) {
        return {
          id: data.id,
          jiraId: data.jira_id,
          taskName: data.task_name || '',
          resource: data.resource,
          status: data.status as DeliveryItem['status'],
          liveUpdates: data.live_updates || {},
        };
      }
    } catch (err) {
      console.warn('Supabase update delivery failed, updating locally:', err);
    }

    const db = getDB();
    const updated = { id, ...entry };
    db.deliveryTracker = db.deliveryTracker.map((item) => (item.id === id ? updated : item));
    saveDB(db);
    return updated;
  },

  deleteEntry: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('delivery_tracker')
        .delete()
        .eq('id', id);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase delete delivery failed, deleting locally:', err);
    }

    const db = getDB();
    db.deliveryTracker = db.deliveryTracker.filter((e) => e.id !== id);
    saveDB(db);
  }
};
