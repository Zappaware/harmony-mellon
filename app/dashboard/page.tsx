'use client'

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, FolderKanban, Users, Mail, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { addDays, parseISO } from 'date-fns';
import { StatCard } from '@/components/StatCard';
import { IssueCardList } from '@/components/IssueCardList';
import { Loading } from '@/components/Loading';
import { Avatar } from '@/components/Avatar';
import { ExpiringTasksModal } from '@/components/ExpiringTasksModal';
import type { Issue } from '@/context/AppContext';
import { api, ApiClient } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

// Dynamic wrapper to prevent SSR issues with Recharts
const ChartContainer = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => <>{children}</>),
  { 
    ssr: false,
    loading: () => <div className="h-[300px] flex items-center justify-center text-gray-500">Cargando gráfico...</div>
  }
);

// Import chart components normally (they're not that heavy)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Helper function to calculate trend percentage
function calculateTrend(currentCount: number, previousCount: number): { value: number; isPositive: boolean } {
  if (previousCount === 0) {
    // If there were no issues in previous period, any current issues is 100% increase
    return currentCount > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
  }
  
  const change = ((currentCount - previousCount) / previousCount) * 100;
  const roundedChange = Math.round(change * 10) / 10; // Round to 1 decimal place
  
  return {
    value: Math.abs(roundedChange),
    isPositive: roundedChange >= 0
  };
}

// Helper function to get issues created before a specific month
function getIssuesBeforeMonth(issues: any[], monthOffset: number = 0): any[] {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  
  return issues.filter(issue => {
    if (!issue.createdAt) return false;
    const issueDate = new Date(issue.createdAt);
    return issueDate < targetDate;
  });
}

function DashboardUsuario() {
  const { issues, user, users, isLoading } = useApp();

  if (isLoading) {
    return <Loading fullScreen message="Cargando datos..." />;
  }

  const myIssues = issues.filter((issue) => issue.assignedTo === user?.id);
  
  // Current counts (all issues currently in each status)
  const todoCount = myIssues.filter((i) => i.status === 'todo').length;
  const inProgressCount = myIssues.filter((i) => i.status === 'in-progress').length;
  const reviewCount = myIssues.filter((i) => i.status === 'review').length;
  const doneCount = myIssues.filter((i) => i.status === 'done').length;
  
  // Previous month: issues that existed before this month (created before current month)
  // We compare their current status to approximate what the counts were
  // This is an approximation since we don't have historical status snapshots
  const previousMonthIssues = getIssuesBeforeMonth(myIssues, 0);
  
  // Count issues that existed last month and are currently in each status
  // This approximates the previous month's status distribution
  const prevTodoCount = previousMonthIssues.filter((i) => i.status === 'todo').length;
  const prevInProgressCount = previousMonthIssues.filter((i) => i.status === 'in-progress').length;
  const prevReviewCount = previousMonthIssues.filter((i) => i.status === 'review').length;
  const prevDoneCount = previousMonthIssues.filter((i) => i.status === 'done').length;
  
  // Calculate trends: compare current total vs previous month's total
  const todoTrend = calculateTrend(todoCount, prevTodoCount);
  const inProgressTrend = calculateTrend(inProgressCount, prevInProgressCount);
  const reviewTrend = calculateTrend(reviewCount, prevReviewCount);
  const doneTrend = calculateTrend(doneCount, prevDoneCount);

  const stats = [
    { 
      label: 'Por Hacer', 
      value: todoCount, 
      icon: Clock, 
      color: 'bg-blue-500',
      trend: todoTrend,
      href: '/tareas?status=todo'
    },
    { 
      label: 'En Progreso', 
      value: inProgressCount, 
      icon: TrendingUp, 
      color: 'bg-yellow-500',
      trend: inProgressTrend,
      href: '/tareas?status=in-progress'
    },
    { 
      label: 'En Revisión', 
      value: reviewCount, 
      icon: AlertCircle, 
      color: 'bg-purple-500',
      trend: reviewTrend,
      href: '/tareas?status=review'
    },
    { 
      label: 'Completadas', 
      value: doneCount, 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      trend: doneTrend,
      href: '/tareas?status=done'
    },
  ];

  return (
    <div className="p-4 md:p-8 pb-6 md:pb-8">
      <PageHeader
        title="Resumen"
        subtitle={`Bienvenido de nuevo, ${user?.name ?? ''}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg text-gray-800 mb-3 md:mb-4">Actividad Reciente</h3>
          <div className="space-y-3 md:space-y-4">
            {issues.length === 0 ? (
              <p className="text-sm text-gray-500">No hay actividad reciente</p>
            ) : (
              // Sort by date (most recent first) and take first 3
              [...issues]
                .sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return dateB - dateA; // Most recent first
                })
                .slice(0, 3)
                .map((issue) => (
                  <div key={issue.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      issue.status === 'done' ? 'bg-green-500' :
                      issue.status === 'in-progress' ? 'bg-blue-500' :
                      issue.status === 'review' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm text-gray-800">
                        {issue.status === 'done' && 'Completaste '}
                        {issue.status === 'in-progress' && 'Comenzaste '}
                        {issue.status === 'review' && 'En revisión: '}
                        {issue.status === 'todo' && 'Tarea: '}
                        &quot;{issue.title}&quot;
                      </p>
                      <p className="text-xs text-gray-500">
                        {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'Fecha no disponible'}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg text-gray-800 mb-3 md:mb-4">Progreso</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Tareas Completadas</span>
                <span className="text-sm text-gray-800">
                  {myIssues.filter(i => i.status === 'done').length}/{myIssues.length || 1}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${myIssues.length > 0 ? (myIssues.filter(i => i.status === 'done').length / myIssues.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Tareas en Progreso</span>
                <span className="text-sm text-gray-800">
                  {myIssues.filter(i => i.status === 'in-progress').length}/{myIssues.length || 1}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${myIssues.length > 0 ? (myIssues.filter(i => i.status === 'in-progress').length / myIssues.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Tareas Pendientes</span>
                <span className="text-sm text-gray-800">
                  {myIssues.filter(i => i.status === 'todo').length}/{myIssues.length || 1}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ 
                    width: `${myIssues.length > 0 ? (myIssues.filter(i => i.status === 'todo').length / myIssues.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base md:text-xl text-gray-800 font-medium">Mis Tareas Recientes</h2>
          <Link href="/mis-tareas" className="text-indigo-600 hover:text-indigo-700 text-sm">
            Ver todas →
          </Link>
        </div>
        <div>
          {myIssues.slice(0, 5).map((issue) => {
            const assignedUser = users.find((u) => u.id === issue.assignedTo);
            return <IssueCardList key={issue.id} issue={issue} assignedUser={assignedUser} />;
          })}
          {myIssues.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No tienes tareas asignadas en este momento
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getHighPriorityExpiringIssues(issues: Issue[]): Issue[] {
  const now = new Date();
  const limit = addDays(now, 7);
  return issues
    .filter((issue) => {
      if (issue.priority !== 'high' || issue.status === 'done' || !issue.dueDate) return false;
      const due = parseISO(issue.dueDate);
      return due <= limit;
    })
    .sort((a, b) => {
      const dA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
      const dB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
      return dA - dB;
    });
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const BULK_TYPES = ['Planner', 'Branding', 'Campaña'];

function DashboardAdmin() {
  const { issues, users, projects, isLoading } = useApp();
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showHighPriorityExpiringModal, setShowHighPriorityExpiringModal] = useState(false);
  const [showBulkMonthlyModal, setShowBulkMonthlyModal] = useState(false);
  const [highlightPriorityCard, setHighlightPriorityCard] = useState(true);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [bulkMonth, setBulkMonth] = useState(() => new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(() => new Date().getFullYear());
  const [bulkClientIds, setBulkClientIds] = useState<string[]>([]);
  const [bulkTypes, setBulkTypes] = useState<string[]>(['Planner']);
  const [bulkAddClientMembers, setBulkAddClientMembers] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; names: string[] } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHighlightPriorityCard(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!showBulkMonthlyModal) return;
    let cancelled = false;
    api.getClients().then((list) => { if (!cancelled) setClients(list); }).catch(() => { if (!cancelled) setClients([]); });
    return () => { cancelled = true; };
  }, [showBulkMonthlyModal]);

  const openBulkMonthly = () => {
    setBulkResult(null);
    setBulkError(null);
    setBulkMonth(new Date().getMonth() + 1);
    setBulkYear(new Date().getFullYear());
    setBulkClientIds([]);
    setBulkTypes(['Planner']);
    setBulkAddClientMembers(false);
    setShowBulkMonthlyModal(true);
  };

  const toggleBulkType = (type: string) => {
    setBulkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleBulkCreateMonthly = async () => {
    if (bulkTypes.length === 0) {
      setBulkError('Selecciona al menos un tipo de proyecto.');
      return;
    }
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await api.bulkCreateMonthlyProjects({
        month: bulkMonth,
        year: bulkYear,
        client_ids: bulkClientIds.length > 0 ? bulkClientIds : undefined,
        types: bulkTypes,
        add_client_members: bulkAddClientMembers,
      });
      setBulkResult({ created: res.created, names: res.projects.map((p) => p.name) });
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : 'Error al crear proyectos');
    } finally {
      setBulkLoading(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando métricas..." />;
  }

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'team_lead') return 'Líder';
    return 'Usuario';
  };

  const getRoleColor = (role: string) => {
    if (role === 'admin') return 'text-red-600 bg-red-50';
    if (role === 'team_lead') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Progress per user: % of assigned issues that are done
  const getUserProgress = (userId: string) => {
    const assigned = issues.filter((i) => i.assignedTo === userId);
    if (assigned.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = assigned.filter((i) => i.status === 'done').length;
    return { done, total: assigned.length, percent: Math.round((done / assigned.length) * 100) };
  };

  // Progress per project: % of issues in project that are done (computed from issues)
  const getProjectProgress = (projectId: string) => {
    const projectIssues = issues.filter((i) => i.projectId === projectId);
    if (projectIssues.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = projectIssues.filter((i) => i.status === 'done').length;
    const percent = Math.round((done / projectIssues.length) * 100);
    return { done, total: projectIssues.length, percent };
  };

  const highPriorityExpiringCount = getHighPriorityExpiringIssues(issues).length;
  const stats = [
    { label: 'Total Issues', value: issues.length, icon: FolderKanban, color: 'bg-blue-500' },
    { label: 'Avance por usuario', value: users.length, icon: Users, color: 'bg-purple-500' },
    { label: 'Avance por proyecto', value: projects.length, icon: TrendingUp, color: 'bg-yellow-500' },
    { label: 'Issues por expirar', value: highPriorityExpiringCount, icon: AlertCircle, color: 'bg-red-500' },
  ];

  const statusData = [
    { name: 'Por Hacer', value: issues.filter((i) => i.status === 'todo').length },
    { name: 'En Progreso', value: issues.filter((i) => i.status === 'in-progress').length },
    { name: 'En Revisión', value: issues.filter((i) => i.status === 'review').length },
    { name: 'Completadas', value: issues.filter((i) => i.status === 'done').length },
  ];

  const priorityData = [
    { name: 'Alta', value: issues.filter((i) => i.priority === 'high').length },
    { name: 'Media', value: issues.filter((i) => i.priority === 'medium').length },
    { name: 'Baja', value: issues.filter((i) => i.priority === 'low').length },
  ];

  const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Panel de Métricas"
        subtitle="Vista general del sistema"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          let href = '/tareas';
          let onClick: (() => void) | undefined = undefined;
          
          // Set the correct href/onClick based on the stat label
          if (stat.label === 'Avance por usuario') {
            onClick = () => setShowUsersModal(true);
          } else if (stat.label === 'Avance por proyecto') {
            onClick = () => setShowProjectsModal(true);
          } else if (stat.label === 'Issues por expirar') {
            onClick = () => setShowHighPriorityExpiringModal(true);
          } else {
            href = '/tareas';
          }
          
          const isExpiringCard = stat.label === 'Issues por expirar';
          const CardContent = (
            <div className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center transition-all ${
                    isExpiringCard && highlightPriorityCard ? 'animate-icon-shake' : ''
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl text-gray-800">{stat.value}</span>
              </div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          );
          
          if (onClick) {
            return (
              <button
                key={stat.label}
                onClick={onClick}
                className="w-full text-left"
                type="button"
              >
                {CardContent}
              </button>
            );
          }
          
return (
    <Link key={stat.label} href={href}>
              {CardContent}
            </Link>
          );
        })}
      </div>

      {/* Crear proyectos del mes - admin only */}
      <div className="mb-6 md:mb-8">
        <button
          type="button"
          onClick={openBulkMonthly}
          className="w-full md:max-w-xs flex items-center gap-3 bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-lg transition-shadow text-left border border-gray-200"
        >
          <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
            <CalendarPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Crear proyectos del mes</p>
            <p className="text-sm text-gray-600">Planner, Branding, Campaña por cliente</p>
          </div>
        </button>
      </div>

      {/* Avance general: total issues vs completadas */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
        <h2 className="text-lg md:text-xl text-gray-800 mb-3">Avance general</h2>
        <p className="text-sm text-gray-600 mb-4">
          Progreso de todas las tareas del sistema (completadas sobre el total).
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>
                {issues.filter((i) => i.status === 'done').length} de {issues.length || 1} tareas completadas
              </span>
              <span className="font-medium text-gray-800">
                {issues.length ? Math.round((issues.filter((i) => i.status === 'done').length / issues.length) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${issues.length ? (issues.filter((i) => i.status === 'done').length / issues.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl text-gray-800 mb-4">Issues por Estado</h2>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl text-gray-800 mb-4">Distribución por Prioridad</h2>
          <ChartContainer>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
      </div>

      {/* Avance por usuario - Users List Modal with progress */}
      <Dialog open={showUsersModal} onOpenChange={setShowUsersModal}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg md:text-xl">Avance por usuario ({users.length})</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Progreso de tareas completadas por cada usuario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3 mt-2 md:mt-4">
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No hay usuarios registrados</p>
            ) : (
              users.map((u) => {
                const { done, total, percent } = getUserProgress(u.id);
                return (
                  <div
                    key={u.id}
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Avatar name={u.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm md:text-base">{u.name}</p>
                          <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                            <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400 shrink-0" />
                            <span className="text-xs md:text-sm text-gray-600 truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-700">{percent}%</span>
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium ${getRoleColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{done} de {total} tareas completadas</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avance por proyecto - Projects List Modal with progress (same structure as Avance por usuario) */}
      <Dialog open={showProjectsModal} onOpenChange={setShowProjectsModal}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg md:text-xl">Avance por proyecto ({projects.length})</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Progreso de cada proyecto del sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 md:space-y-3 mt-2 md:mt-4">
            {projects.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No hay proyectos</p>
            ) : (
              projects.map((project) => {
                const { done, total, percent } = getProjectProgress(project.id);
                return (
                  <div
                    key={project.id}
                    className="p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FolderKanban className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm md:text-base">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-700">{percent}%</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{done} de {total} tareas completadas</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Crear proyectos del mes */}
      <Dialog open={showBulkMonthlyModal} onOpenChange={(open) => { setShowBulkMonthlyModal(open); if (!open) { setBulkResult(null); setBulkError(null); } }}>
        <DialogContent className="max-w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg md:text-xl">Crear proyectos del mes</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Crea proyectos Planner, Branding y/o Campaña para uno o todos los clientes. Los existentes se omiten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  value={bulkMonth}
                  onChange={(e) => setBulkMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>{MONTH_NAMES[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                  type="number"
                  min={2020}
                  max={2030}
                  value={bulkYear}
                  onChange={(e) => setBulkYear(Number(e.target.value) || bulkYear)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clientes (vacío = todos)</label>
              <select
                multiple
                value={bulkClientIds}
                onChange={(e) => setBulkClientIds(Array.from(e.target.selectedOptions, (o) => o.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Mantén Ctrl/Cmd para seleccionar varios</p>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Tipos de proyecto</span>
              <div className="flex flex-wrap gap-3">
                {BULK_TYPES.map((t) => (
                  <label key={t} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkTypes.includes(t)}
                      onChange={() => toggleBulkType(t)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bulkAddClientMembers}
                onChange={(e) => setBulkAddClientMembers(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Añadir equipo del cliente a cada proyecto</span>
            </label>
            {bulkError && (
              <p className="text-sm text-red-600">{bulkError}</p>
            )}
            {bulkResult && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                <p className="text-sm font-medium text-green-800">Se crearon {bulkResult.created} proyecto(s)</p>
                {bulkResult.names.length > 0 && (
                  <ul className="mt-2 text-xs text-green-700 list-disc list-inside max-h-32 overflow-y-auto">
                    {bulkResult.names.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkMonthlyModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleBulkCreateMonthly}
                disabled={bulkLoading}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {bulkLoading ? 'Creando...' : 'Crear proyectos'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExpiringTasksModal
        open={showHighPriorityExpiringModal}
        onClose={() => setShowHighPriorityExpiringModal(false)}
        issues={getHighPriorityExpiringIssues(issues)}
        title="Tareas de prioridad alta por vencer o vencidas"
        description="Revisa y toma acción sobre estas tareas de prioridad alta que ya vencieron o vencen en los próximos 7 días."
        emptyMessage="No hay tareas de prioridad alta por vencer o vencidas."
      />
    </div>
  );
}

import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';

export default function DashboardPage() {
  const { user } = useApp();

  return (
    <LayoutWithSidebar>
      {(user?.role === 'admin' || user?.role === 'team_lead') ? <DashboardAdmin /> : <DashboardUsuario />}
    </LayoutWithSidebar>
  );
}
