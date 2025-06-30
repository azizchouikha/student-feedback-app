import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// Types
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

// Extended interface for request config with retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Configuration
const API_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
};

// Create axios instance
const api: AxiosInstance = axios.create(API_CONFIG);

// Token management
const getStoredTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;
  
  const access_token = localStorage.getItem('access_token');
  const refresh_token = localStorage.getItem('refresh_token');
  
  if (!access_token || !refresh_token) return null;
  
  return { access_token, refresh_token };
};

const setStoredTokens = (tokens: AuthTokens): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
};

const clearStoredTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStoredTokens();
    
    if (tokens?.access_token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const tokens = getStoredTokens();
      
      if (tokens?.refresh_token) {
        try {
          // Try to refresh the token
          const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh/`, {
            refresh_token: tokens.refresh_token,
          });
          
          const newTokens = response.data;
          setStoredTokens(newTokens);
          
          // Retry the original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          clearStoredTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        clearStoredTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    // Handle other errors
    const errorMessage = error.response?.data?.error || error.message || 'Une erreur est survenue';
    
    // Don't show toast for 401 errors (handled above)
    if (error.response?.status !== 401) {
      toast.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login/', credentials);
    const { access_token, refresh_token, user } = response.data;
    setStoredTokens({ access_token, refresh_token });
    return { user, access_token, refresh_token };
  },
  
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    surname: string;
    role?: string;
  }) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      // Ignore logout errors
    } finally {
      clearStoredTokens();
    }
  },
  
  refresh: async () => {
    const response = await api.post('/auth/refresh/');
    const { access_token } = response.data;
    // Note: refresh token is handled automatically by the interceptor
    return { access_token };
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data.user;
  },
  
  changePassword: async (passwords: { current_password: string; new_password: string }) => {
    const response = await api.post('/auth/change-password/', passwords);
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password/', { email });
    return response.data;
  },
};

export const problemsAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    urgency?: number;
    status?: string;
    room?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get('/problems/', { params });
    return response.data.problems || [];
  },
  
  getAllProblems: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    urgency?: number;
    status?: string;
    room?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get('/problems/all', { params });
    return response.data.problems || [];
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/problems/${id}/`);
    return response.data.problem;
  },
  
  create: async (problemData: any, files?: File[]) => {
    const formData = new FormData();
    
    // Add problem data
    Object.keys(problemData).forEach(key => {
      if (problemData[key] !== undefined && problemData[key] !== null) {
        if (key === 'tags' || key === 'location_coordinates') {
          formData.append(key, JSON.stringify(problemData[key]));
        } else {
          formData.append(key, problemData[key]);
        }
      }
    });
    
    // Add files
    if (files) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    
    const response = await api.post('/problems/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  update: async (id: number, updateData: any) => {
    const response = await api.put(`/problems/${id}/`, updateData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/problems/${id}/`);
    return response.data;
  },
  
  like: async (id: number) => {
    const response = await api.post(`/problems/${id}/like/`);
    return response.data;
  },
  
  addComment: async (id: number, commentData: { content: string; is_internal?: boolean }) => {
    const response = await api.post(`/problems/${id}/comments/`, commentData);
    return response.data;
  },
  
  getHistory: async (id: number) => {
    const response = await api.get(`/problems/${id}/history/`);
    return response.data.history;
  },
  
  getCategories: async () => {
    const response = await api.get('/problems/categories/');
    return response.data.categories;
  },
  
  getStats: async () => {
    const response = await api.get('/problems/stats/');
    return response.data.stats;
  },
};

export const notificationsAPI = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
    type?: string;
  }) => {
    const response = await api.get('/notifications/', { params });
    return response.data;
  },
  
  markAsRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/read/`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all/');
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/notifications/${id}/`);
    return response.data;
  },
  
  clearAll: async () => {
    const response = await api.delete('/notifications/clear-all/');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count/');
    return response.data.unread_count;
  },
  
  getSettings: async () => {
    const response = await api.get('/notifications/settings/');
    return response.data.settings;
  },
  
  updateSettings: async (settings: any) => {
    const response = await api.put('/notifications/settings/', settings);
    return response.data;
  },
  
  getTypes: async () => {
    const response = await api.get('/notifications/types/');
    return response.data.types;
  },
};

export const adminAPI = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard/');
    return response.data;
  },
  
  getUsers: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },
  
  updateUser: async (id: number, userData: any) => {
    const response = await api.put(`/admin/users/${id}/`, userData);
    return response.data;
  },
  
  bulkUpdateProblems: async (data: {
    problem_ids: number[];
    action: string;
    new_status?: string;
  }) => {
    const response = await api.post('/admin/problems/bulk-update/', data);
    return response.data;
  },
  
  getAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    group_by?: string;
  }) => {
    const response = await api.get('/admin/analytics/', { params });
    return response.data;
  },
  
  createNotification: async (data: {
    title: string;
    message: string;
    user_ids?: number[];
    broadcast?: boolean;
  }) => {
    const response = await api.post('/admin/notifications/', data);
    return response.data;
  },
  
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health/');
    return response.data;
  },
};

// Export the api instance for direct use
export default api; 