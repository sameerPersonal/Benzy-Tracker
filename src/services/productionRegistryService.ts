import { supabase } from '../api/supabaseClient';
import type { ProductionRegistryEntry } from './mockData';

export const productionRegistryService = {
  getAll: async (): Promise<ProductionRegistryEntry[]> => {
    const { data, error } = await supabase
      .from('production_registry')
      .select('*')
      .order('updated_date', { ascending: false });

    if (error) {
      console.error('Error fetching production registry:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      region: row.region,
      project: row.project,
      version: row.version,
      updatedDate: row.updated_date,
      remarks: row.remarks || '',
    }));
  },

  addEntry: async (entry: Omit<ProductionRegistryEntry, 'id' | 'updatedDate'>): Promise<ProductionRegistryEntry> => {
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

    if (error) {
      throw new Error(`Failed to add registry entry: ${error.message}`);
    }

    return {
      id: data.id,
      region: data.region,
      project: data.project,
      version: data.version,
      updatedDate: data.updated_date,
      remarks: data.remarks || '',
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('production_registry')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete registry entry: ${error.message}`);
    }
  }
};
