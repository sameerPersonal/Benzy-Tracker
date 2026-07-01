import { CONFIG } from '../config';

export async function apiRequest<T>(action: string, payload?: any): Promise<T> {
  if (CONFIG.isDev) {
    // Return mock data fallback or perform local simulation if needed
  }

  const url = `${CONFIG.apiUrl}?action=${encodeURIComponent(action)}`;
  
  const options: RequestInit = {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'text/plain', // GAS requires text/plain to avoid pre-flight CORS issues in some settings
    },
    body: payload ? JSON.stringify(payload) : undefined,
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API request failed for action ${action}:`, error);
    throw error;
  }
}
