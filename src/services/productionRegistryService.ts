import { supabase } from '../api/supabaseClient';
import { getDB, saveDB } from './mockData';
import type { ProductionRegistryEntry } from './mockData';

export const productionRegistryService = {
  getAll: async (): Promise<ProductionRegistryEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('production_registry')
        .select('*')
        .order('updated_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          region: row.region,
          project: row.project,
          version: row.version,
          updatedDate: row.updated_date,
          remarks: row.remarks || '',
        }));
      }
    } catch (err) {
      console.warn('Supabase query failed, using local storage fallback:', err);
    }
    return getDB().productionRegistry;
  },

  addEntry: async (entry: Omit<ProductionRegistryEntry, 'id' | 'updatedDate'>): Promise<ProductionRegistryEntry> => {
    try {
      const { data, error } = await supabase
        .from('production_registry')
        .insert([{
          region: entry.region,
          project: entry.project,
          version: entry.version,
          remarks: entry.remarks,
        }])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          region: data.region,
          project: data.project,
          version: data.version,
          updatedDate: data.updated_date,
          remarks: data.remarks || '',
        };
      }
    } catch (err) {
      console.warn('Supabase add failed, saving locally:', err);
    }

    const db = getDB();
    const newEntry: ProductionRegistryEntry = {
      ...entry,
      id: 'p_' + Math.random().toString(36).substr(2, 9),
      updatedDate: new Date().toISOString().split('T')[0],
    };
    db.productionRegistry.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  updateEntry: async (id: string, entry: Omit<ProductionRegistryEntry, 'id' | 'updatedDate'>): Promise<ProductionRegistryEntry> => {
    try {
      const { data, error } = await supabase
        .from('production_registry')
        .update({
          region: entry.region,
          project: entry.project,
          version: entry.version,
          remarks: entry.remarks,
          updated_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          region: data.region,
          project: data.project,
          version: data.version,
          updatedDate: data.updated_date,
          remarks: data.remarks || '',
        };
      }
    } catch (err) {
      console.warn('Supabase update failed, updating locally:', err);
    }

    const db = getDB();
    const updatedDate = new Date().toISOString().split('T')[0];
    db.productionRegistry = db.productionRegistry.map((item) =>
      item.id === id ? { ...item, ...entry, updatedDate } : item
    );
    saveDB(db);
    return { id, ...entry, updatedDate };
  },

  deleteEntry: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('production_registry')
        .delete()
        .eq('id', id);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase delete failed, deleting locally:', err);
    }

    const db = getDB();
    db.productionRegistry = db.productionRegistry.filter((e) => e.id !== id);
    saveDB(db);
  }
};
