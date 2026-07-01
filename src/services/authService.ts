import { getDB, saveDB } from './mockData';
import type { User } from './mockData';

export const authService = {
  getCurrentUser: (): User | null => {
    return getDB().currentUser;
  },

  login: async (email: string, _password?: string): Promise<User> => {
    const db = getDB();
    const user = db.users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found. Use admin@ops.portal to log in or Sign Up.');
    }
    db.currentUser = user;
    saveDB(db);
    return user;
  },

  signup: async (email: string, name: string): Promise<User> => {
    const db = getDB();
    if (db.users.some(u => u.email === email)) {
      throw new Error('User already exists');
    }
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name
    };
    db.users.push(newUser);
    db.currentUser = newUser;
    saveDB(db);
    return newUser;
  },

  logout: async (): Promise<void> => {
    const db = getDB();
    db.currentUser = null;
    saveDB(db);
  }
};
