import axios from 'axios';

// Configure axios defaults for development bypass
if (import.meta.env.DEV) {
  axios.defaults.headers.common['x-dev-bypass-token'] = 
    import.meta.env.VITE_DEV_BYPASS_TOKEN || 'local-dev-only-choose-a-long-random-string';
}

// Create configured axios instance
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  // Add dev bypass token in development
  if (import.meta.env.DEV) {
    config.headers['x-dev-bypass-token'] = 
      import.meta.env.VITE_DEV_BYPASS_TOKEN || 'local-dev-only-choose-a-long-random-string';
  }
  
  return config;
});

// Helper to get consistent headers for fetch calls
export const getApiHeaders = (includeAuth = true): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add dev bypass token in development
  if (import.meta.env.DEV) {
    headers['x-dev-bypass-token'] = 
      import.meta.env.VITE_DEV_BYPASS_TOKEN || 'local-dev-only-choose-a-long-random-string';
  }
  
  return headers;
};

export default apiClient;