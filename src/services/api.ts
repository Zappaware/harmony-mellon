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
}

class ApiService {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
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

  async updateUser(id: string, data: { name?: string; email?: string; role?: string }): Promise<ApiUser> {
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
}

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: string;
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
  deadline?: string;
  color?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'team_lead';
}

export const api = new ApiService();
