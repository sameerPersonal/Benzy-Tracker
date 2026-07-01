import { getDB, saveDB } from './mockData';
import type { DailyStatus } from './mockData';

export const teamStatusService = {
  getAll: async (): Promise<DailyStatus[]> => {
    return getDB().dailyStatus;
  },

  addEntry: async (entry: Omit<DailyStatus, 'id'>): Promise<DailyStatus> => {
    const db = getDB();
    const newEntry: DailyStatus = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };
    db.dailyStatus.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    const db = getDB();
    db.dailyStatus = db.dailyStatus.filter(item => item.id !== id);
    saveDB(db);
  }
};
