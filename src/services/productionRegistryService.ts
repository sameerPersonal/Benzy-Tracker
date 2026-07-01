import { getDB, saveDB } from './mockData';
import type { ProductionRegistryEntry } from './mockData';

export const productionRegistryService = {
  getAll: async (): Promise<ProductionRegistryEntry[]> => {
    return getDB().productionRegistry;
  },

  addEntry: async (entry: Omit<ProductionRegistryEntry, 'id' | 'updatedDate'>): Promise<ProductionRegistryEntry> => {
    const db = getDB();
    const newEntry: ProductionRegistryEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      updatedDate: new Date().toISOString().split('T')[0],
    };
    db.productionRegistry.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    const db = getDB();
    db.productionRegistry = db.productionRegistry.filter(e => e.id !== id);
    saveDB(db);
  }
};
