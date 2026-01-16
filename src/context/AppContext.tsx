'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
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
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface AppContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  issues: Issue[];
  updateIssueStatus: (issueId: string, newStatus: Issue['status']) => void;
  addComment: (issueId: string, text: string) => void;
  users: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' },
  { id: '2', name: 'John Doe', email: 'user@example.com', role: 'user' },
  { id: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: '4', name: 'Carlos Martínez', email: 'carlos@example.com', role: 'user' },
  { id: '5', name: 'María García', email: 'maria@example.com', role: 'admin' },
  { id: '6', name: 'Pedro López', email: 'pedro@example.com', role: 'user' },
];

const mockIssues: Issue[] = [
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
  const [user, setUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [users] = useState<User[]>(mockUsers);

  const login = (email: string, password: string): boolean => {
    const foundUser = mockUsers.find((u) => u.email === email);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const updateIssueStatus = (issueId: string, newStatus: Issue['status']) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )
    );
  };

  const addComment = (issueId: string, text: string) => {
    if (!user) return;
    
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
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : issue
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        issues,
        updateIssueStatus,
        addComment,
        users,
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
