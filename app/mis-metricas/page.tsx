'use client'

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { StatCard } from '@/components/StatCard';
import { IssueCardList } from '@/components/IssueCardList';
import { Loading } from '@/components/Loading';

function getIssuesBeforeMonth<T extends { createdAt?: string }>(issues: T[], monthOffset: number): T[] {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  return issues.filter((issue) => {
    if (!issue.createdAt) return false;
    return new Date(issue.createdAt) < targetDate;
  });
}

function calculateTrend(currentCount: number, previousCount: number): { value: number; isPositive: boolean } {
  if (previousCount === 0) {
    return currentCount > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
  }
  const change = ((currentCount - previousCount) / previousCount) * 100;
  const roundedChange = Math.round(change * 10) / 10;
  return {
    value: Math.abs(roundedChange),
    isPositive: roundedChange >= 0,
  };
}

export default function MisMetricasPage() {
  const { issues, user, users, isLoading } = useApp();

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <Loading fullScreen message="Cargando métricas..." />
      </LayoutWithSidebar>
    );
  }

  const myIssues = issues.filter((issue) => issue.assignedTo === user?.id);
  const todoCount = myIssues.filter((i) => i.status === 'todo').length;
  const inProgressCount = myIssues.filter((i) => i.status === 'in-progress').length;
  const reviewCount = myIssues.filter((i) => i.status === 'review').length;
  const doneCount = myIssues.filter((i) => i.status === 'done').length;

  const previousMonthIssues = getIssuesBeforeMonth(myIssues, 0);
  const prevTodoCount = previousMonthIssues.filter((i) => i.status === 'todo').length;
  const prevInProgressCount = previousMonthIssues.filter((i) => i.status === 'in-progress').length;
  const prevReviewCount = previousMonthIssues.filter((i) => i.status === 'review').length;
  const prevDoneCount = previousMonthIssues.filter((i) => i.status === 'done').length;

  const todoTrend = calculateTrend(todoCount, prevTodoCount);
  const inProgressTrend = calculateTrend(inProgressCount, prevInProgressCount);
  const reviewTrend = calculateTrend(reviewCount, prevReviewCount);
  const doneTrend = calculateTrend(doneCount, prevDoneCount);

  const stats = [
    { label: 'Por Hacer', value: todoCount, icon: Clock, color: 'bg-blue-500', trend: todoTrend, href: '/tareas?status=todo' },
    { label: 'En Progreso', value: inProgressCount, icon: TrendingUp, color: 'bg-yellow-500', trend: inProgressTrend, href: '/tareas?status=in-progress' },
    { label: 'En Revisión', value: reviewCount, icon: AlertCircle, color: 'bg-purple-500', trend: reviewTrend, href: '/tareas?status=review' },
    { label: 'Completadas', value: doneCount, icon: CheckCircle2, color: 'bg-green-500', trend: doneTrend, href: '/tareas?status=done' },
  ];

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl text-gray-800 mb-1 md:mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Mis Métricas
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Resumen de tus tareas asignadas y tu progreso
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg text-gray-800 mb-3 md:mb-4">Progreso por estado</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Completadas</span>
                  <span className="text-sm text-gray-800">
                    {myIssues.length > 0 ? Math.round((doneCount / myIssues.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${myIssues.length > 0 ? (doneCount / myIssues.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">En progreso</span>
                  <span className="text-sm text-gray-800">
                    {myIssues.length > 0 ? Math.round((inProgressCount / myIssues.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${myIssues.length > 0 ? (inProgressCount / myIssues.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Pendientes</span>
                  <span className="text-sm text-gray-800">
                    {myIssues.length > 0 ? Math.round((todoCount / myIssues.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${myIssues.length > 0 ? (todoCount / myIssues.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg text-gray-800 mb-3 md:mb-4">Resumen</h3>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Total tareas asignadas</dt>
                <dd className="font-medium text-gray-800">{myIssues.length}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Tareas activas (no completadas)</dt>
                <dd className="font-medium text-gray-800">{todoCount + inProgressCount + reviewCount}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-600">Tareas completadas</dt>
                <dd className="font-medium text-green-600">{doneCount}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base md:text-xl text-gray-800 font-medium">Mis tareas recientes</h2>
            <Link href="/mis-tareas" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              Ver todas →
            </Link>
          </div>
          <div>
            {myIssues.slice(0, 5).map((issue) => {
              const assignedUser = users.find((u) => u.id === issue.assignedTo);
              return <IssueCardList key={issue.id} issue={issue} assignedUser={assignedUser} />;
            })}
            {myIssues.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                No tienes tareas asignadas. Las métricas se actualizarán cuando te asignen tareas.
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
