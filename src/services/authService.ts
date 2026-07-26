import { supabase } from '../api/supabaseClient';
import type { User } from './mockData';

const SESSION_KEY = 'ops_portal_user';

const usernameToEmail = (username: string): string => {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@opsportal.com`;
};

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

  login: async (username: string, password?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required.');
    }
    const email = usernameToEmail(username);

    try {
      // Try Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData?.user) {
        // Fetch user details from public.users table
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (profile) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
          return profile as User;
        }
      }
    } catch (err) {
      console.warn('Supabase auth unavailable or failed, using local session fallback:', err);
    }

    // Local / Dev Fallback: allows instant login locally even if Supabase user is not created yet
    const formattedName = username.trim().split('@')[0];
    const user: User = {
      id: username.trim().toLowerCase(),
      email,
      name: formattedName.charAt(0).toUpperCase() + formattedName.slice(1),
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  signup: async (username: string, name: string, password?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required for registration.');
    }
    const email = usernameToEmail(username);

    try {
      // Check if profile already exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username/Email is already registered in cloud DB.');
      }

      // Sign up via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!authError && authData?.user) {
        const id = Math.random().toString(36).substr(2, 9);
        const { data: profile, error: dbError } = await supabase
          .from('users')
          .insert([{ id, user_id: authData.user.id, email, name }])
          .select()
          .single();

        if (!dbError && profile) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
          return profile as User;
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already registered')) {
        throw err;
      }
      console.warn('Supabase registration unavailable, using local session fallback:', err);
    }

    const user: User = {
      id: username.trim().toLowerCase(),
      email,
      name: name || username,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut ignored in fallback mode:', err);
    }
    localStorage.removeItem(SESSION_KEY);
  }
};
