'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { api, ApiIssue, ApiUser, ApiProject } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'team_lead';
  avatar?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdBy: string;
  projectId?: string;
  clientId?: string;
  taskType?: string;
  startDate?: string;
  dueDate?: string;
  approvedAt?: string;
  attachments?: Array<{ type: 'link' | 'image' | 'file'; url: string; name?: string }>;
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  attachments?: Array<{ type: 'link' | 'image' | 'file'; url: string; name?: string }>;
  createdAt: string;
}

interface CreateIssueData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  projectId?: string;
  clientId?: string;
  taskType?: string;
  startDate?: string;
  dueDate?: string;
  attachments?: Array<{ type: 'link' | 'image' | 'file'; url: string; name?: string }>;
}

interface CreateProjectData {
  name: string;
  description?: string;
  type?: string;
  status?: string;
  client_id?: string;
  startDate?: string;
  deadline?: string;
  color?: string;
  planning_month?: number; // 1-12
  planning_year?: number;
}

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'team_lead';
}

const EXPIRING_TASKS_MODAL_STORAGE_KEY = 'expiringTasksModalLastShown';
const EXPIRING_TASKS_MODAL_THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  issues: Issue[];
  projects: ApiProject[];
  updateIssueStatus: (issueId: string, newStatus: Issue['status']) => Promise<void>;
  addComment: (issueId: string, text: string, attachments?: Array<{ type: 'link' | 'image' | 'file'; url: string; name?: string }>) => Promise<void>;
  createIssue: (data: CreateIssueData) => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<void>;
  updateProject: (projectId: string, data: Partial<CreateProjectData>) => Promise<void>;
  createUser: (data: CreateUserData) => Promise<void>;
  deleteIssue: (issueId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshIssue: (issueId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  /** Replace issue in context with converted API response (e.g. from PUT update) */
  updateIssueFromApi: (apiIssue: ApiIssue) => void;
  users: User[];
  showExpiringTasksModal: boolean;
  setShowExpiringTasksModal: (show: boolean) => void;
  shouldShowExpiringTasksByTime: () => boolean;
  markExpiringTasksModalShown: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Legacy mock data - unused since API-only auth (kept for reference, safe to remove)
const _unusedMockIssues: Issue[] = [
  {
    id: '1',
    title: 'Implementar autenticación',
    description: 'Añadir sistema de login y registro de usuarios con validación de credenciales y manejo de sesiones',
    status: 'todo',
    priority: 'high',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-20',
    comments: [],
  },
  {
    id: '2',
    title: 'Diseñar dashboard',
    description: 'Crear mockups para el dashboard principal con métricas y gráficos interactivos',
    status: 'in-progress',
    priority: 'medium',
    assignedTo: '3',
    createdBy: '1',
    createdAt: '2024-12-19',
    comments: [
      { id: '1', userId: '1', userName: 'Admin User', text: 'Priorizar métricas clave y KPIs importantes', createdAt: '2024-12-20' }
    ],
  },
  {
    id: '3',
    title: 'Optimizar rendimiento',
    description: 'Mejorar tiempo de carga de la aplicación mediante lazy loading y optimización de imágenes',
    status: 'review',
    priority: 'high',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-18',
    comments: [],
  },
  {
    id: '4',
    title: 'Documentación API',
    description: 'Completar documentación de endpoints con ejemplos y casos de uso',
    status: 'done',
    priority: 'low',
    assignedTo: '3',
    createdBy: '2',
    createdAt: '2024-12-15',
    comments: [],
  },
  {
    id: '5',
    title: 'Migración a TypeScript',
    description: 'Convertir todos los archivos JavaScript a TypeScript para mejor tipado',
    status: 'in-progress',
    priority: 'medium',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-21',
    comments: [
      { id: '2', userId: '2', userName: 'John Doe', text: 'Ya convertí el 60% de los archivos', createdAt: '2024-12-21' }
    ],
  },
  {
    id: '6',
    title: 'Testing unitario',
    description: 'Implementar tests para los componentes principales usando Jest y React Testing Library',
    status: 'todo',
    priority: 'medium',
    assignedTo: '3',
    createdBy: '1',
    createdAt: '2024-12-22',
    comments: [],
  },
  {
    id: '7',
    title: 'Integración con API externa',
    description: 'Conectar la aplicación con servicios externos de terceros',
    status: 'todo',
    priority: 'high',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-22',
    comments: [],
  },
  {
    id: '8',
    title: 'Implementar notificaciones',
    description: 'Sistema de notificaciones en tiempo real para actualizaciones de issues',
    status: 'in-progress',
    priority: 'low',
    assignedTo: '3',
    createdBy: '2',
    createdAt: '2024-12-17',
    comments: [],
  },
  {
    id: '9',
    title: 'Diseño responsive móvil',
    description: 'Adaptar todos los componentes para funcionar correctamente en dispositivos móviles',
    status: 'review',
    priority: 'medium',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-16',
    comments: [
      { id: '3', userId: '1', userName: 'Admin User', text: 'Se ve bien en tablets, falta pulir mobile', createdAt: '2024-12-21' },
      { id: '4', userId: '2', userName: 'John Doe', text: 'Trabajando en los ajustes finales', createdAt: '2024-12-21' }
    ],
  },
  {
    id: '10',
    title: 'Configurar CI/CD',
    description: 'Implementar pipeline de integración y despliegue continuo con GitHub Actions',
    status: 'done',
    priority: 'high',
    assignedTo: '2',
    createdBy: '1',
    createdAt: '2024-12-14',
    comments: [],
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  // Check if we're in development mode
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const [user, setUser] = useState<User | null>(null);
  // Start with empty arrays - data will be loaded from API when user logs in
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [useApi, setUseApi] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExpiringTasksModal, setShowExpiringTasksModal] = useState(false);

  // Convert API issue to app issue format
  const convertApiIssue = (apiIssue: ApiIssue, userList: User[]): Issue => {
    return {
      id: apiIssue.id,
      title: apiIssue.title,
      description: apiIssue.description,
      status: apiIssue.status,
      priority: apiIssue.priority,
      assignedTo: apiIssue.assigned_to,
      createdBy: apiIssue.created_by,
      projectId: apiIssue.project_id,
      clientId: apiIssue.client_id,
      taskType: apiIssue.task_type,
      startDate: apiIssue.start_date,
      dueDate: apiIssue.due_date,
      approvedAt: apiIssue.approved_at,
      attachments: apiIssue.attachments,
      createdAt: apiIssue.created_at,
      comments: (apiIssue.comments || []).map(comment => ({
        id: comment.id,
        userId: comment.user_id,
        userName: comment.user?.name || userList.find(u => u.id === comment.user_id)?.name || 'Usuario',
        text: comment.text,
        attachments: comment.attachments,
        createdAt: comment.created_at,
      })),
    };
  };

  // Restore user session on page load
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Only restore if we don't already have a user
      if (user) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get user info from API
        const apiUser = await api.getMe();
        setUser({
          id: apiUser.id,
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          avatar: apiUser.avatar,
        });
        setUseApi(true);
      } catch (error: any) {
        // Only clear token if it's an authentication error (401)
        const errorMessage = error?.message || '';
        const isAuthError = errorMessage.includes('Authorization') || 
                           errorMessage.includes('Unauthorized') ||
                           errorMessage.includes('401');
        
        // Check if it's a connection error (likely API URL misconfiguration)
        const isConnectionError = errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                                 errorMessage.includes('Failed to fetch') ||
                                 errorMessage.includes('Network error') ||
                                 errorMessage.includes('Cannot connect to backend');
        
        if (isAuthError) {
          // Token is invalid, clear it
          console.error('Invalid token, clearing session:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setUser(null);
          setUseApi(false);
        } else if (isConnectionError) {
          // Connection error - likely API URL misconfiguration
          // Keep the token but warn the user
          console.warn('Failed to restore session - connection error. This might be due to NEXT_PUBLIC_API_URL not being set correctly in production.', error);
          // Don't clear token or set user - let them try to login again which will show the error
          // The token will be used once the API URL is fixed
        } else {
          // Other network or error - don't clear token, might be temporary
          console.error('Failed to restore session (network error?):', error);
          // Keep the token, might be a temporary network issue
          // Don't set user to null, let the user try again
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []); // Only run on mount

  // Load issues from API
  useEffect(() => {
    const loadIssues = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && useApi && user) {
        try {
          const apiIssues = await api.getIssues();
          // Load users first if not already loaded, then convert issues
          let usersList = users;
          if (usersList.length === 0) {
            try {
              const apiUsers = await api.getUsers();
              usersList = apiUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.avatar,
              }));
              setUsers(usersList);
            } catch (err) {
              console.error('Error loading users for issue conversion:', err);
            }
          }
          // Convert issues with users list
          const convertedIssues = apiIssues.map(issue => convertApiIssue(issue, usersList));
          setIssues(convertedIssues);
        } catch (error) {
          console.error('Error loading issues:', error);
          // Don't fallback to mock data immediately - might be temporary network issue
        }
      }
    };
    
    loadIssues();
  }, [useApi, user]); // Remove users dependency to avoid circular loading

  // Load projects from API
  useEffect(() => {
    const loadProjects = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && useApi && user) {
        try {
          const apiProjects = await api.getProjects();
          setProjects(apiProjects);
        } catch (error) {
          console.error('Error loading projects:', error);
        }
      }
    };
    
    loadProjects();
  }, [useApi, user]);

  // Reload issues when users are loaded (to update user names in comments)
  useEffect(() => {
    const reloadIssuesWithUsers = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token && useApi && user && users.length > 0 && issues.length > 0) {
        // Only reload if we have existing issues and users just loaded
        try {
          const apiIssues = await api.getIssues();
          const convertedIssues = apiIssues.map(issue => convertApiIssue(issue, users));
          setIssues(convertedIssues);
        } catch (error) {
          console.error('Error reloading issues with users:', error);
        }
      }
    };
    
    reloadIssuesWithUsers();
  }, [users.length]); // Reload when users array changes

  // Load users from API (when authenticated)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && useApi && user) {
      api.getUsers()
        .then(apiUsers => {
          const convertedUsers: User[] = apiUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
          }));
          setUsers(convertedUsers);
        })
        .catch((error) => {
          console.error('Error loading users:', error);
          // Don't fallback to mock data - keep empty array
          // This ensures we always try to use API data when authenticated
        });
    }
  }, [useApi, user]);

  const shouldShowExpiringTasksByTime = (): boolean => {
    if (typeof window === 'undefined') return false;
    const last = localStorage.getItem(EXPIRING_TASKS_MODAL_STORAGE_KEY);
    if (!last) return true;
    const lastTime = parseInt(last, 10);
    if (Number.isNaN(lastTime)) return true;
    return Date.now() - lastTime >= EXPIRING_TASKS_MODAL_THROTTLE_MS;
  };

  const markExpiringTasksModalShown = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPIRING_TASKS_MODAL_STORAGE_KEY, String(Date.now()));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      if (response.token && response.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token);
        }
        setUser({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          avatar: response.user.avatar,
        });
        setUseApi(true);
        setShowExpiringTasksModal(true);
        return true;
      }
    } catch {
      // No mock fallback - API only. Prevents bypass when API fails or user doesn't exist.
    }
    return false;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
    setUseApi(false);
  };

  const updateIssueStatus = async (issueId: string, newStatus: Issue['status']) => {
    if (useApi) {
      try {
        await api.updateIssueStatus(issueId, newStatus);
        // Reload issues to get updated status
        const apiIssues = await api.getIssues();
        const convertedIssues = apiIssues.map(issue => convertApiIssue(issue, users));
        setIssues(convertedIssues);
      } catch (error) {
        console.error('Error updating issue status:', error);
      }
    } else {
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
    }
  };

  const addComment = async (issueId: string, text: string, attachments?: Array<{ type: 'link' | 'image' | 'file'; url: string; name?: string }>) => {
    if (!user) return;
    
    if (useApi) {
      try {
        await api.createComment(issueId, text, attachments);
        // Reload issues to get updated comments
        const apiIssues = await api.getIssues();
        const convertedIssues = apiIssues.map(issue => convertApiIssue(issue, users));
        setIssues(convertedIssues);
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    } else {
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? {
                ...issue,
                comments: [
                  ...issue.comments,
                  {
                    id: Date.now().toString(),
                    userId: user.id,
                    userName: user.name,
                    text,
                    attachments,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : issue
        )
      );
    }
  };

  const createIssue = async (data: CreateIssueData): Promise<void> => {
    if (useApi) {
      try {
        // Format dates to RFC3339 if provided
        const startDate = data.startDate ? new Date(data.startDate).toISOString() : undefined;
        const dueDate = data.dueDate ? new Date(data.dueDate).toISOString() : undefined;
        
        const newIssue = await api.createIssue({
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          assigned_to: data.assignedTo,
          project_id: data.projectId || undefined,
          client_id: data.clientId || undefined,
          task_type: data.taskType || undefined,
          start_date: startDate,
          due_date: dueDate,
          attachments: data.attachments,
        });
        const convertedIssue = convertApiIssue(newIssue, users);
        setIssues((prev) => [convertedIssue, ...prev]);
      } catch (error) {
        throw error;
      }
    } else {
      // Mock implementation
      const newIssue: Issue = {
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        status: 'todo',
        priority: data.priority || 'medium',
        assignedTo: data.assignedTo,
        createdBy: user?.id || '1',
        startDate: data.startDate,
        dueDate: data.dueDate,
        createdAt: new Date().toISOString(),
        comments: [],
      };
      setIssues((prev) => [newIssue, ...prev]);
    }
  };

  const createProject = async (data: CreateProjectData): Promise<void> => {
    if (useApi) {
      try {
        // Format dates to RFC3339 if provided
        const startDate = data.startDate ? new Date(data.startDate).toISOString() : undefined;
        const deadline = data.deadline ? new Date(data.deadline).toISOString() : undefined;
        
        await api.createProject({
          name: data.name,
          description: data.description,
          type: data.type || 'Campaña',
          status: data.status || 'planning',
          client_id: data.client_id,
          start_date: startDate,
          deadline: deadline,
          color: data.color,
          planning_month: data.planning_month,
          planning_year: data.planning_year,
        });
        const apiProjects = await api.getProjects();
        setProjects(apiProjects);
      } catch (error) {
        throw error;
      }
    } else {
      // Mock implementation - just show success
      console.log('Project created (mock):', data);
    }
  };

  const updateProject = async (projectId: string, data: Partial<CreateProjectData>): Promise<void> => {
    if (useApi) {
      try {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.client_id !== undefined) updateData.client_id = data.client_id;
        if (data.startDate !== undefined) {
          updateData.start_date = data.startDate ? new Date(data.startDate).toISOString() : null;
        }
        if (data.deadline !== undefined) {
          updateData.deadline = data.deadline ? new Date(data.deadline).toISOString() : null;
        }
        if (data.color !== undefined) updateData.color = data.color;
        if (data.planning_month !== undefined) updateData.planning_month = data.planning_month;
        if (data.planning_year !== undefined) updateData.planning_year = data.planning_year;

        await api.updateProject(projectId, updateData);
        // Reload projects to get updated data
        const apiProjects = await api.getProjects();
        setProjects(apiProjects);
      } catch (error) {
        console.error('Error updating project:', error);
        throw error;
      }
    } else {
      // Mock implementation
      console.log('Project updated (mock):', projectId, data);
    }
  };

  const createUser = async (data: CreateUserData): Promise<void> => {
    if (useApi) {
      try {
        await api.register(data.name, data.email, data.password, data.role || 'user');
        // Reload users to get updated list
        const apiUsers = await api.getUsers();
        const convertedUsers: User[] = apiUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: u.avatar,
        }));
        setUsers(convertedUsers);
      } catch (error) {
        throw error;
      }
    } else {
      // Mock implementation
      const newUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        role: data.role || 'user',
      };
      setUsers((prev) => [...prev, newUser]);
    }
  };

  const deleteIssue = async (issueId: string): Promise<void> => {
    if (useApi) {
      try {
        await api.deleteIssue(issueId);
        // Remove issue from state
        setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
      } catch (error) {
        console.error('Error deleting issue:', error);
        throw error;
      }
    } else {
      // Mock implementation
      setIssues((prev) => prev.filter((issue) => issue.id !== issueId));
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (useApi) {
      try {
        await api.deleteUser(userId);
        // Remove user from state
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        // Also remove from issues assigned to this user
        setIssues((prev) => prev.map(issue => 
          issue.assignedTo === userId ? { ...issue, assignedTo: undefined } : issue
        ));
      } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
      }
    } else {
      // Mock implementation
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setIssues((prev) => prev.map(issue => 
        issue.assignedTo === userId ? { ...issue, assignedTo: undefined } : issue
      ));
    }
  };

  const refreshIssue = async (issueId: string): Promise<void> => {
    if (!useApi) return;
    try {
      const apiIssue = await api.getIssue(issueId);
      const converted = convertApiIssue(apiIssue, users);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? converted : i)));
    } catch (error) {
      console.error('Error refreshing issue:', error);
    }
  };

  const refreshUsers = async (): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || !useApi) return;
    try {
      const apiUsers = await api.getUsers();
      const convertedUsers: User[] = apiUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
      }));
      setUsers(convertedUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const updateIssueFromApi = (apiIssue: ApiIssue): void => {
    const converted = convertApiIssue(apiIssue, users);
    setIssues((prev) => prev.map((i) => (i.id === apiIssue.id ? converted : i)));
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    if (useApi) {
      try {
        await api.deleteProject(projectId);
        // Note: Projects are managed locally in the projects page, so we don't need to update state here
        // The page will reload projects via useEffect
      } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
      }
    } else {
      // Mock implementation - just log
      console.log('Project deleted (mock):', projectId);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        issues,
        projects,
        updateIssueStatus,
        addComment,
        createIssue,
        createProject,
        updateProject,
        createUser,
        deleteIssue,
        deleteUser,
        deleteProject,
        refreshIssue,
        refreshUsers,
        updateIssueFromApi,
        users,
        showExpiringTasksModal,
        setShowExpiringTasksModal,
        shouldShowExpiringTasksByTime,
        markExpiringTasksModalShown,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
