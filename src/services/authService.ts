import { supabase } from '../api/supabaseClient';
import type { User } from './mockData';

const SESSION_KEY = 'ops_portal_user';

export const authService = {
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(SESSION_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },

  login: async (email: string, _password?: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
    if (!data) {
      throw new Error('User not found. Use admin@ops.portal to log in or register.');
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data as User;
  },

  signup: async (email: string, name: string): Promise<User> => {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Lookup failed: ${checkError.message}`);
    }
    if (existingUser) {
      throw new Error('User already exists');
    }

    const id = Math.random().toString(36).substr(2, 9);
    const { data, error } = await supabase
      .from('users')
      .insert([{ id, email, name }])
      .select()
      .single();

    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return data as User;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(SESSION_KEY);
  }
};
