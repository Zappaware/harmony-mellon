const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'team_lead';
  avatar?: string;
  created_at: string;
}

export interface ApiIssue {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  created_by: string;
  project_id?: string;
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  comments?: ApiComment[];
}

export interface ApiComment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  assigned_to?: string;
  project_id?: string;
  start_date?: string;
  due_date?: string;
}

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
    }
    return token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    // Build headers object
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge any existing headers from options
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // Log warning if no token for protected endpoints
      if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        console.warn(`No token found for request to ${endpoint}`);
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        throw new Error('Unauthorized: Invalid or expired token');
      }
      
      // Handle network errors
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Network error: Unable to reach server');
      }
      
      const error = await response.json().catch(() => ({ 
        error: response.status === 404 ? 'Recurso no encontrado' : 'Error desconocido' 
      }));
      throw new Error(error.error || `Error: ${response.statusText}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<{ token: string; user: ApiUser }> {
    return this.request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string, role?: 'user' | 'admin' | 'team_lead'): Promise<{ token: string; user: ApiUser }> {
    return this.request<{ token: string; user: ApiUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role: role || 'user' }),
    });
  }

  async getMe(): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/me');
  }

  async getIssues(filters?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    project_id?: string;
  }): Promise<ApiIssue[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.project_id) params.append('project_id', filters.project_id);

    const query = params.toString();
    return this.request<ApiIssue[]>(`/issues${query ? `?${query}` : ''}`);
  }

  async getIssue(id: string): Promise<ApiIssue> {
    return this.request<ApiIssue>(`/issues/${id}`);
  }

  async createIssue(issue: CreateIssueRequest): Promise<ApiIssue> {
    return this.request<ApiIssue>('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  }

  async updateIssue(id: string, updates: Partial<CreateIssueRequest>): Promise<ApiIssue> {
    return this.request<ApiIssue>(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateIssueStatus(id: string, status: 'todo' | 'in-progress' | 'review' | 'done'): Promise<ApiIssue> {
    return this.request<ApiIssue>(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getUsers(): Promise<ApiUser[]> {
    return this.request<ApiUser[]>('/users');
  }

  async getUser(id: string): Promise<ApiUser> {
    return this.request<ApiUser>(`/users/${id}`);
  }

  async updateUser(id: string, data: { name?: string; email?: string; role?: string; avatar?: string }): Promise<ApiUser> {
    return this.request<ApiUser>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createComment(issueId: string, text: string): Promise<ApiComment> {
    return this.request<ApiComment>(`/issues/${issueId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getComments(issueId: string): Promise<ApiComment[]> {
    return this.request<ApiComment[]>(`/issues/${issueId}/comments`);
  }

  async getProjects(): Promise<ApiProject[]> {
    return this.request<ApiProject[]>('/projects');
  }

  async getProject(id: string): Promise<ApiProject> {
    return this.request<ApiProject>(`/projects/${id}`);
  }

  async createProject(project: CreateProjectRequest): Promise<ApiProject> {
    return this.request<ApiProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: Partial<CreateProjectRequest>): Promise<ApiProject> {
    return this.request<ApiProject>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification methods
  async getNotifications(): Promise<ApiNotification[]> {
    return this.request<ApiNotification[]>('/notifications');
  }

  async getUnreadNotifications(): Promise<ApiNotification[]> {
    return this.request<ApiNotification[]>('/notifications/unread');
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: string;
  start_date?: string;
  deadline?: string;
  color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  members?: Array<{
    id: string;
    user_id: string;
    user: ApiUser;
  }>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  progress?: number;
  status?: string;
  start_date?: string;
  deadline?: string;
  color?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'team_lead';
}

export interface ApiNotification {
  id: string;
  user_id: string;
  type: 'comment' | 'assignment' | 'complete' | 'user' | 'status';
  title: string;
  message: string;
  read: boolean;
  related_id?: string;
  created_at: string;
}

export const api = new ApiService();
