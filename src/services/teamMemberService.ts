import { supabase } from '../api/supabaseClient';

export const capitalizeName = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const DEFAULT_MEMBERS = [
  'Sameer',
  'Thomas',
  'Nilha',
  'Sreeyuktha',
  'Sidharth',
  'Shehana Sherin'
];

const CACHE_KEY = 'ops_portal_team_members';

export const teamMemberService = {
  // Returns cached list immediately from localStorage (falls back to DEFAULT_MEMBERS)
  getMembers: (): string[] => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map(capitalizeName);
        }
      } catch (e) {
        console.error('Error parsing team members cache:', e);
      }
    }
    return DEFAULT_MEMBERS;
  },

  // Fetches team members from Supabase, updates local cache, and returns the fresh list
  fetchAndCache: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('team_members')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      // Throw error to let the caller handle it (e.g. log / ignore)
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    if (data && data.length > 0) {
      const names = data.map((row: { name: string }) => capitalizeName(row.name));
      localStorage.setItem(CACHE_KEY, JSON.stringify(names));
      return names;
    }

    // If table is empty, store and return default members
    localStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULT_MEMBERS));
    return DEFAULT_MEMBERS;
  }
};
