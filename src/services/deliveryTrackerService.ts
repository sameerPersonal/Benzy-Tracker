import { getDB, saveDB } from './mockData';
import type { DeliveryItem } from './mockData';

export const deliveryTrackerService = {
  getAll: async (): Promise<DeliveryItem[]> => {
    return getDB().deliveryTracker;
  },

  addEntry: async (entry: Omit<DeliveryItem, 'id'>): Promise<DeliveryItem> => {
    const db = getDB();
    const newEntry: DeliveryItem = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
    };
    db.deliveryTracker.unshift(newEntry);
    saveDB(db);
    return newEntry;
  },

  updateStatus: async (id: string, status: DeliveryItem['status'], liveDate?: string): Promise<DeliveryItem> => {
    const db = getDB();
    const index = db.deliveryTracker.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    db.deliveryTracker[index].status = status;
    if (liveDate) {
      db.deliveryTracker[index].liveDate = liveDate;
    } else if (status === 'Completed' && !db.deliveryTracker[index].liveDate) {
      db.deliveryTracker[index].liveDate = new Date().toISOString().split('T')[0];
    }
    saveDB(db);
    return db.deliveryTracker[index];
  },

  deleteEntry: async (id: string): Promise<void> => {
    const db = getDB();
    db.deliveryTracker = db.deliveryTracker.filter(item => item.id !== id);
    saveDB(db);
  }
};
