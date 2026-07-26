import { supabase } from '../api/supabaseClient';
import { getDB, saveDB, type User, type PagePermissions } from './mockData';

const SESSION_KEY = 'ops_portal_user';

const usernameToEmail = (username: string): string => {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@opsportal.com`;
};

const DEFAULT_READ_PERMISSIONS: PagePermissions = {
  production: 'read',
  delivery: 'read',
  leave: 'read',
  status: 'read'
};

const DEFAULT_WRITE_PERMISSIONS: PagePermissions = {
  production: 'write',
  delivery: 'write',
  leave: 'write',
  status: 'write'
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
    const isSameer = username.trim().toLowerCase() === 'sameer' || email.startsWith('sameer@');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (profile) {
          const userStatus = profile.status || (isSameer ? 'approved' : 'pending');
          const userRole = profile.role || (isSameer ? 'admin' : 'user');
          const userPermissions = profile.permissions || (isSameer ? DEFAULT_WRITE_PERMISSIONS : DEFAULT_READ_PERMISSIONS);

          if (userStatus === 'pending') {
            throw new Error('Your registration is pending Super Admin approval. Please contact Sameer.');
          }
          if (userStatus === 'rejected') {
            throw new Error('Your account access request was declined by Super Admin.');
          }

          const userObj: User = {
            id: profile.id || profile.user_id,
            email: profile.email,
            name: profile.name,
            role: userRole,
            status: userStatus,
            permissions: userPermissions
          };

          localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
          return userObj;
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('pending Super Admin') || err.message.includes('declined by Super Admin'))) {
        throw err;
      }
      console.warn('Supabase auth query failed, evaluating local users:', err);
    }

    // Local / Dev Fallback: evaluate local user status and role
    const db = getDB();
    const existingLocalUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.id.toLowerCase() === username.trim().toLowerCase());

    if (existingLocalUser) {
      if (existingLocalUser.status === 'pending') {
        throw new Error('Your registration is pending Super Admin approval. Please contact Sameer.');
      }
      if (existingLocalUser.status === 'rejected') {
        throw new Error('Your account access request was declined by Super Admin.');
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(existingLocalUser));
      return existingLocalUser;
    }

    // New local fallback user creation
    const formattedName = username.trim().split('@')[0];
    const userRole = isSameer ? 'admin' : 'user';
    const userStatus = isSameer ? 'approved' : 'pending';
    const userPermissions = isSameer ? DEFAULT_WRITE_PERMISSIONS : DEFAULT_READ_PERMISSIONS;

    const user: User = {
      id: username.trim().toLowerCase(),
      email,
      name: formattedName.charAt(0).toUpperCase() + formattedName.slice(1),
      role: userRole,
      status: userStatus,
      permissions: userPermissions
    };

    db.users.push(user);
    saveDB(db);

    if (userStatus === 'pending') {
      throw new Error('Your registration is pending Super Admin approval. Please contact Sameer.');
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  signup: async (username: string, name: string, password?: string): Promise<User> => {
    if (!password) {
      throw new Error('Password is required for registration.');
    }
    const email = usernameToEmail(username);
    const isSameer = username.trim().toLowerCase() === 'sameer' || email.startsWith('sameer@');
    const role: User['role'] = isSameer ? 'admin' : 'user';
    const status: User['status'] = isSameer ? 'approved' : 'pending';
    const permissions: PagePermissions = isSameer ? DEFAULT_WRITE_PERMISSIONS : DEFAULT_READ_PERMISSIONS;

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username/Email is already registered.');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (!authError && authData?.user) {
        const id = Math.random().toString(36).substr(2, 9);
        const { data: profile, error: dbError } = await supabase
          .from('users')
          .insert([{
            id,
            user_id: authData.user.id,
            email,
            name,
            role,
            status,
            permissions
          }])
          .select()
          .single();

        if (!dbError && profile) {
          const userObj: User = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role,
            status,
            permissions
          };

          if (status === 'pending') {
            throw new Error('Registration submitted! Account is pending Super Admin approval.');
          }

          localStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
          return userObj;
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('already registered') || err.message.includes('submitted! Account is pending'))) {
        throw err;
      }
      console.warn('Supabase registration unavailable, using local fallback:', err);
    }

    const user: User = {
      id: username.trim().toLowerCase(),
      email,
      name: name || username,
      role,
      status,
      permissions
    };

    const db = getDB();
    const existingIndex = db.users.findIndex(u => u.id === user.id || u.email === user.email);
    if (existingIndex >= 0) {
      db.users[existingIndex] = user;
    } else {
      db.users.push(user);
    }
    saveDB(db);

    if (status === 'pending') {
      throw new Error('Registration submitted! Account is pending Super Admin approval.');
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id || row.user_id,
          email: row.email,
          name: row.name,
          role: row.role || 'user',
          status: row.status || 'approved',
          permissions: row.permissions || DEFAULT_READ_PERMISSIONS
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch users failed, returning local users:', err);
    }
    return getDB().users;
  },

  updateUserStatus: async (userId: string, status: 'approved' | 'rejected'): Promise<void> => {
    try {
      await supabase
        .from('users')
        .update({ status })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase update status failed, updating local storage:', err);
    }

    const db = getDB();
    db.users = db.users.map(u => u.id === userId ? { ...u, status } : u);
    saveDB(db);
  },

  updateUserPermissions: async (userId: string, permissions: PagePermissions): Promise<void> => {
    try {
      await supabase
        .from('users')
        .update({ permissions })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase update permissions failed, updating local storage:', err);
    }

    const db = getDB();
    db.users = db.users.map(u => u.id === userId ? { ...u, permissions } : u);
    saveDB(db);
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase delete user failed, deleting from local storage:', err);
    }

    const db = getDB();
    db.users = db.users.filter(u => u.id !== userId);
    saveDB(db);
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
