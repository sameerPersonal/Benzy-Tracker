import { getDB, saveDB } from './mockData';
import type { LeaveEntry } from './mockData';

export const leaveTrackerService = {
  getAll: async (): Promise<LeaveEntry[]> => {
    return getDB().leaveTracker;
  },

  addEntry: async (entry: Omit<LeaveEntry, 'id'>): Promise<LeaveEntry> => {
    const db = getDB();
    const newEntry: LeaveEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };
    db.leaveTracker.push(newEntry);
    saveDB(db);
    return newEntry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    const db = getDB();
    db.leaveTracker = db.leaveTracker.filter(item => item.id !== id);
    saveDB(db);
  }
};
