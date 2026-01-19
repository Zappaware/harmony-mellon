'use client'

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';
import { IssueCardList } from '@/components/IssueCardList';
import { Filter, X, Calendar, User, FolderKanban } from 'lucide-react';
import { parseISO, isAfter, isBefore, isSameDay } from 'date-fns';
import { Loading } from '@/components/Loading';

function TareasPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { issues, users, projects, user: currentUser } = useApp();
  const isAdminOrTeamLead = currentUser?.role === 'admin' || currentUser?.role === 'team_lead';

  // Get initial status from URL params
  const initialStatus = searchParams.get('status') || 'all';
  const initialUserId = searchParams.get('user') || 'all';
  const initialProjectId = searchParams.get('project') || 'all';
  const initialDateFrom = searchParams.get('dateFrom') || '';
  const initialDateTo = searchParams.get('dateTo') || '';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [userFilter, setUserFilter] = useState<string>(initialUserId);
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectId);
  const [dateFromFilter, setDateFromFilter] = useState<string>(initialDateFrom);
  const [dateToFilter, setDateToFilter] = useState<string>(initialDateTo);
  const [showFilters, setShowFilters] = useState(false);

  // Filter issues based on current user role
  const availableIssues = useMemo(() => {
    if (isAdminOrTeamLead) {
      // Admin/Team Lead sees all issues
      return issues;
    } else {
      // Regular users see only their assigned issues
      return issues.filter(issue => issue.assignedTo === currentUser?.id);
    }
  }, [issues, currentUser?.id, isAdminOrTeamLead]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    let filtered = [...availableIssues];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    // Filter by user (only for admin/team_lead)
    if (isAdminOrTeamLead && userFilter !== 'all') {
      filtered = filtered.filter(issue => issue.assignedTo === userFilter);
    }

    // Filter by project
    if (projectFilter !== 'all') {
      filtered = filtered.filter(issue => issue.projectId === projectFilter);
    }

    // Filter by date range
    if (dateFromFilter) {
      const fromDate = parseISO(dateFromFilter);
      filtered = filtered.filter(issue => {
        const issueDate = issue.startDate || issue.dueDate || issue.createdAt;
        if (!issueDate) return false;
        const date = parseISO(issueDate);
        return isAfter(date, fromDate) || isSameDay(date, fromDate);
      });
    }

    if (dateToFilter) {
      const toDate = parseISO(dateToFilter);
      filtered = filtered.filter(issue => {
        const issueDate = issue.startDate || issue.dueDate || issue.createdAt;
        if (!issueDate) return false;
        const date = parseISO(issueDate);
        return isBefore(date, toDate) || isSameDay(date, toDate);
      });
    }

    return filtered;
  }, [availableIssues, statusFilter, userFilter, projectFilter, dateFromFilter, dateToFilter, isAdminOrTeamLead]);

  // Update URL when filters change
  const updateFilters = (updates: {
    status?: string;
    user?: string;
    project?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams();
    
    const newStatus = updates.status !== undefined ? updates.status : statusFilter;
    const newUser = updates.user !== undefined ? updates.user : userFilter;
    const newProject = updates.project !== undefined ? updates.project : projectFilter;
    const newDateFrom = updates.dateFrom !== undefined ? updates.dateFrom : dateFromFilter;
    const newDateTo = updates.dateTo !== undefined ? updates.dateTo : dateToFilter;

    if (newStatus !== 'all') params.set('status', newStatus);
    if (isAdminOrTeamLead && newUser !== 'all') params.set('user', newUser);
    if (newProject !== 'all') params.set('project', newProject);
    if (newDateFrom) params.set('dateFrom', newDateFrom);
    if (newDateTo) params.set('dateTo', newDateTo);

    router.push(`/tareas?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    updateFilters({ status });
  };

  const handleUserChange = (userId: string) => {
    setUserFilter(userId);
    updateFilters({ user: userId });
  };

  const handleProjectChange = (projectId: string) => {
    setProjectFilter(projectId);
    updateFilters({ project: projectId });
  };

  const handleDateFromChange = (date: string) => {
    setDateFromFilter(date);
    updateFilters({ dateFrom: date });
  };

  const handleDateToChange = (date: string) => {
    setDateToFilter(date);
    updateFilters({ dateTo: date });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setUserFilter('all');
    setProjectFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    router.push('/tareas');
  };

  const hasActiveFilters = statusFilter !== 'all' || 
    (isAdminOrTeamLead && userFilter !== 'all') || 
    projectFilter !== 'all' || 
    dateFromFilter || 
    dateToFilter;

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'review', label: 'En Revisión' },
    { value: 'done', label: 'Completadas' },
  ];

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader 
          title="Tareas" 
          subtitle={isAdminOrTeamLead ? "Todas las tareas del sistema" : "Mis tareas asignadas"}
        />

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-800">Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros
            </button>
          </div>

          {showFilters && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Filter (only for admin/team_lead) */}
                {isAdminOrTeamLead && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Usuario
                    </label>
                    <select
                      value={userFilter}
                      onChange={(e) => handleUserChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">Todos los usuarios</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Project Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FolderKanban className="w-4 h-4" />
                    Proyecto
                  </label>
                  <select
                    value={projectFilter}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Todos los proyectos</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Rango de fechas
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      placeholder="Desde"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      placeholder="Hasta"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-medium text-gray-800">{filteredIssues.length}</span> de{' '}
            <span className="font-medium text-gray-800">{availableIssues.length}</span> tareas
          </p>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No se encontraron tareas</p>
              <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
            </div>
          ) : (
            <div>
              {filteredIssues.map((issue) => {
                const assignedUser = users.find((u) => u.id === issue.assignedTo);
                return (
                  <IssueCardList 
                    key={issue.id} 
                    issue={issue} 
                    assignedUser={assignedUser}
                    showProject
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}

export default function TareasPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="Cargando tareas..." />}>
      <TareasPageContent />
    </Suspense>
  );
}
