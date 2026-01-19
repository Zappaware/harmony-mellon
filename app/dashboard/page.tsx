'use client'

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, FolderKanban, Users } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { IssueCardList } from '@/components/IssueCardList';
import { Loading } from '@/components/Loading';
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
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Resumen</h1>
        <p className="text-sm md:text-base text-gray-600">Bienvenido de nuevo, {user?.name}</p>
      </div>

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

function DashboardAdmin() {
  const { issues, users, isLoading } = useApp();

  if (isLoading) {
    return <Loading fullScreen message="Cargando métricas..." />;
  }

  const stats = [
    { label: 'Total Issues', value: issues.length, icon: FolderKanban, color: 'bg-blue-500' },
    { label: 'Total Usuarios', value: users.length, icon: Users, color: 'bg-purple-500' },
    { label: 'En Progreso', value: issues.filter((i) => i.status === 'in-progress').length, icon: TrendingUp, color: 'bg-yellow-500' },
    { label: 'Prioridad Alta', value: issues.filter((i) => i.priority === 'high').length, icon: AlertCircle, color: 'bg-red-500' },
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

  const COLORS = ['#3b82f6', '#eab308', '#a855f7', '#22c55e'];
  const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Panel de Métricas</h1>
        <p className="text-sm md:text-base text-gray-600">Vista general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const statusMap: Record<string, string> = {
            'Por Hacer': 'todo',
            'En Progreso': 'in-progress',
            'En Revisión': 'review',
            'Completadas': 'done',
          };
          const status = statusMap[stat.label] || 'all';
          return (
            <Link key={stat.label} href={`/tareas?status=${status}`}>
              <div className="bg-white rounded-lg shadow p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl text-gray-800">{stat.value}</span>
                </div>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            </Link>
          );
        })}
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
    </div>
  );
}

import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

export default function DashboardPage() {
  const { user } = useApp();

  return (
    <LayoutWithSidebar>
      {(user?.role === 'admin' || user?.role === 'team_lead') ? <DashboardAdmin /> : <DashboardUsuario />}
    </LayoutWithSidebar>
  );
}
