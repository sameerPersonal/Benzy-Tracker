import { supabase } from '../api/supabaseClient';
import type { AssetEntry } from './mockData';

export const assetRegistryService = {
  getAll: async (): Promise<AssetEntry[]> => {
    const { data, error } = await supabase
      .from('asset_registry')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching asset registry:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      region: row.region,
      environment: row.environment as AssetEntry['environment'],
      assetType: row.asset_type as AssetEntry['assetType'],
      ipAddress: row.ip_address,
      remarks: row.remarks || '',
    }));
  },

  addEntry: async (entry: Omit<AssetEntry, 'id'>): Promise<AssetEntry> => {
    const { data, error } = await supabase
      .from('asset_registry')
      .insert([{
        region: entry.region,
        environment: entry.environment,
        asset_type: entry.assetType,
        ip_address: entry.ipAddress,
        remarks: entry.remarks,
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add asset entry: ${error.message}`);
    }

    return {
      id: data.id,
      region: data.region,
      environment: data.environment as AssetEntry['environment'],
      assetType: data.asset_type as AssetEntry['assetType'],
      ipAddress: data.ip_address,
      remarks: data.remarks || '',
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('asset_registry')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete asset entry: ${error.message}`);
    }
  }
};
