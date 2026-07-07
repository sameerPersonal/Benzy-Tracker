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

    // Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }
    if (!authData.user) {
      throw new Error('Authentication succeeded, but user data is missing.');
    }

    // Fetch user details from public.users table
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (dbError) {
      throw new Error(`Profile load failed: ${dbError.message}`);
    }
    if (!profile) {
      throw new Error('User profile not found in public database.');
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile as User;
  },

  signup: async (username: string, name: string, password?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required for registration.');
    }
    const email = usernameToEmail(username);

    // Check if profile already exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Lookup failed: ${checkError.message}`);
    }
    if (existingUser) {
      throw new Error('Username/Email is already registered.');
    }

    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      throw new Error(`Registration failed: ${authError.message}`);
    }
    if (!authData.user) {
      throw new Error('Registration failed: no user returned.');
    }

    const id = Math.random().toString(36).substr(2, 9);
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .insert([{ id, user_id: authData.user.id, email, name }])
      .select()
      .single();

    if (dbError) {
      throw new Error(`Profile creation failed: ${dbError.message}`);
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile as User;
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
  }
};
