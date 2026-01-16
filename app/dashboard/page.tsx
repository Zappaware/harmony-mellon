'use client'

import React, { useEffect, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, FolderKanban, Users } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/StatCard';
import { IssueCardList } from '@/components/IssueCardList';
import { Loading } from '@/components/Loading';

// Lazy load heavy chart components
const BarChart = lazy(() => import('recharts').then(module => ({ default: module.BarChart })));
const Bar = lazy(() => import('recharts').then(module => ({ default: module.Bar })));
const XAxis = lazy(() => import('recharts').then(module => ({ default: module.XAxis })));
const YAxis = lazy(() => import('recharts').then(module => ({ default: module.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(module => ({ default: module.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(module => ({ default: module.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(module => ({ default: module.ResponsiveContainer })));
const PieChart = lazy(() => import('recharts').then(module => ({ default: module.PieChart })));
const Pie = lazy(() => import('recharts').then(module => ({ default: module.Pie })));
const Cell = lazy(() => import('recharts').then(module => ({ default: module.Cell })));

function DashboardUsuario() {
  const { issues, user, users } = useApp();

  const myIssues = issues.filter((issue) => issue.assignedTo === user?.id);
  const todoCount = myIssues.filter((i) => i.status === 'todo').length;
  const inProgressCount = myIssues.filter((i) => i.status === 'in-progress').length;
  const reviewCount = myIssues.filter((i) => i.status === 'review').length;
  const doneCount = myIssues.filter((i) => i.status === 'done').length;

  const stats = [
    { 
      label: 'Por Hacer', 
      value: todoCount, 
      icon: Clock, 
      color: 'bg-blue-500',
      trend: { value: 12, isPositive: false }
    },
    { 
      label: 'En Progreso', 
      value: inProgressCount, 
      icon: TrendingUp, 
      color: 'bg-yellow-500',
      trend: { value: 8, isPositive: true }
    },
    { 
      label: 'En Revisión', 
      value: reviewCount, 
      icon: AlertCircle, 
      color: 'bg-purple-500',
      trend: { value: 5, isPositive: true }
    },
    { 
      label: 'Completadas', 
      value: doneCount, 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      trend: { value: 15, isPositive: true }
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
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Completaste "Documentación API"</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Comenzaste "Optimizar rendimiento"</p>
                <p className="text-xs text-gray-500">Hace 5 horas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Comentaste en "Implementar autenticación"</p>
                <p className="text-xs text-gray-500">Ayer</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-base md:text-lg text-gray-800 mb-3 md:mb-4">Progreso Semanal</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Tareas Completadas</span>
                <span className="text-sm text-gray-800">7/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '58%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Horas Registradas</span>
                <span className="text-sm text-gray-800">32/40</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Objetivos del Mes</span>
                <span className="text-sm text-gray-800">15/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
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
  const { issues, users } = useApp();

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
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl text-gray-800">{stat.value}</span>
              </div>
              <p className="text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl text-gray-800 mb-4">Issues por Estado</h2>
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-500">Cargando gráfico...</div>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Suspense>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl text-gray-800 mb-4">Distribución por Prioridad</h2>
          <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-500">Cargando gráfico...</div>}>
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
          </Suspense>
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
      {user?.role === 'admin' ? <DashboardAdmin /> : <DashboardUsuario />}
    </LayoutWithSidebar>
  );
}
