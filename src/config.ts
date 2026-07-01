export const CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://script.google.com/macros/s/MOCK_SCRIPT_ID/exec',
  env: import.meta.env.VITE_ENV || 'development',
  isDev: import.meta.env.VITE_ENV !== 'production',
};
