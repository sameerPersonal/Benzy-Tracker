import { getDB, saveDB } from './mockData';
import type { AssetEntry } from './mockData';

export const assetRegistryService = {
  getAll: async (): Promise<AssetEntry[]> => {
    return getDB().assetRegistry;
  },

  addEntry: async (entry: Omit<AssetEntry, 'id'>): Promise<AssetEntry> => {
    const db = getDB();
    const newEntry: AssetEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };
    db.assetRegistry.push(newEntry);
    saveDB(db);
    return newEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    const db = getDB();
    db.assetRegistry = db.assetRegistry.filter(item => item.id !== id);
    saveDB(db);
  }
};
