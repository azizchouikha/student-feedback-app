// User types
export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  role: 'student' | 'admin' | 'moderator';
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserProfile extends User {
  problems_count: number;
}

// Problem types
export interface Problem {
  id: number;
  user_id: number;
  user: {
    name: string;
    surname: string;
    role: string;
  };
  promotion: string;
  room: string;
  category: string;
  type_of_problem: string;
  description: string;
  other?: string;
  urgency: 1 | 2 | 3;
  remark: string;
  state: 'Soumis' | 'En cours de traitement' | 'Problème traité' | 'Rejeté' | 'Doublon';
  message?: string;
  likes_count: number;
  views_count: number;
  priority_score: number;
  estimated_resolution_time?: number;
  assigned_to?: number;
  assigned_user?: {
    name: string;
    surname: string;
  };
  tags?: string[];
  location_coordinates?: {
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  is_liked?: boolean;
  likeLoading?: boolean;
}

export interface ProblemDetail extends Problem {
  comments: Comment[];
  attachments: Attachment[];
  history: ProblemHistory[];
}

export interface ProblemCreate {
  promotion: string;
  room: string;
  category: string;
  type_of_problem: string;
  description: string;
  other?: string;
  urgency: 1 | 2 | 3;
  remark: string;
  tags?: string[];
  location_coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ProblemUpdate {
  state?: string;
  message?: string;
  estimated_resolution_time?: number;
  assigned_to?: number;
}

// Comment types
export interface Comment {
  id: number;
  user_id: number;
  user: {
    name: string;
    surname: string;
    role: string;
  };
  problem_id: number;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentCreate {
  content: string;
  is_internal?: boolean;
}

// Attachment types
export interface Attachment {
  id: number;
  problem_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'system' | 'problem_update' | 'comment';
  is_read: boolean;
  data?: string; // JSON string
  created_at: string;
}

// History types
export interface ProblemHistory {
  id: number;
  problem_id: number;
  user_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  user: {
    name: string;
    surname: string;
  };
  created_at: string;
}

// Analytics types
export interface Analytics {
  id: number;
  date: string;
  total_problems: number;
  resolved_problems: number;
  avg_resolution_time: number;
  problems_by_category: string; // JSON string
  problems_by_urgency: string; // JSON string
  active_users: number;
  created_at: string;
}

export interface ProblemStats {
  total_problems: number;
  resolved_problems: number;
  in_progress: number;
  pending: number;
  resolution_rate: number;
  avg_resolution_time_hours: number;
  urgency_distribution: Array<{
    urgency: number;
    count: number;
  }>;
  top_categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface AdminDashboard {
  user_stats: {
    total_users: number;
    active_users: number;
    students: number;
    admins: number;
    moderators: number;
    new_users_this_month: number;
  };
  problem_stats: {
    total_problems: number;
    resolved_problems: number;
    in_progress: number;
    pending: number;
    high_urgency: number;
    medium_urgency: number;
    low_urgency: number;
    problems_this_month: number;
    resolution_rate: number;
    avg_resolution_time_hours: number;
  };
  recent_problems: Array<{
    id: number;
    room: string;
    category: string;
    urgency: number;
    state: string;
    user: {
      name: string;
      surname: string;
    };
    created_at: string;
  }>;
  recent_users: Array<{
    id: number;
    name: string;
    surname: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>;
  unread_notifications: number;
}

// Pagination types
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  surname: string;
  role?: 'student' | 'admin' | 'moderator';
}

export interface ChangePasswordForm {
  current_password: string;
  new_password: string;
}

// Filter types
export interface ProblemFilters {
  search?: string;
  category?: string;
  urgency?: number;
  status?: string;
  room?: string;
  sort_by?: 'created_at' | 'priority' | 'urgency' | 'likes';
  sort_order?: 'asc' | 'desc';
}

// Chart types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  count: number;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// Socket types
export interface SocketEvents {
  'problem:created': (problem: Problem) => void;
  'problem:updated': (problem: Problem) => void;
  'comment:added': (comment: Comment) => void;
  'notification:new': (notification: Notification) => void;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Dropdown types
export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Search types
export interface SearchResult {
  id: number;
  type: 'problem' | 'user' | 'category';
  title: string;
  description?: string;
  url: string;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: ProblemFilters;
}

// Settings types
export interface UserSettings {
  theme: Theme;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    problem_updates: boolean;
    comments: boolean;
    system_messages: boolean;
  };
  display: {
    items_per_page: number;
    show_animations: boolean;
  }
} 