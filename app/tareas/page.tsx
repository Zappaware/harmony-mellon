'use client'

import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { X, Calendar, User, FolderKanban, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { parseISO, isAfter, isBefore, isSameDay, format } from 'date-fns';
import { Loading } from '@/components/Loading';
import Link from 'next/link';

function TareasPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { issues, users, projects, user: currentUser } = useApp();
  const isAdminOrTeamLead = currentUser?.role === 'admin' || currentUser?.role === 'team_lead';
  const filtersRef = useRef<HTMLDivElement>(null);

  // Get initial filters from URL params
  const initialStatus = searchParams.get('status') || 'all';
  const initialUserId = searchParams.get('user') || 'all';
  const initialProjectId = searchParams.get('project') || 'all';
  const initialDateFrom = searchParams.get('dateFrom') || '';
  const initialDateTo = searchParams.get('dateTo') || '';
  const initialPriority = searchParams.get('priority') || 'all';

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [userFilter, setUserFilter] = useState<string>(initialUserId);
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectId);
  const [priorityFilter, setPriorityFilter] = useState<string>(initialPriority);
  const [dateFromFilter, setDateFromFilter] = useState<string>(initialDateFrom);
  const [dateToFilter, setDateToFilter] = useState<string>(initialDateTo);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [showProjectFilter, setShowProjectFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Keep filter state in sync with URL (e.g. back/forward, direct link with params)
  useEffect(() => {
    const status = searchParams.get('status');
    const user = searchParams.get('user');
    const project = searchParams.get('project');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const priority = searchParams.get('priority');
    setStatusFilter(status ?? 'all');
    setUserFilter(user ?? 'all');
    setProjectFilter(project ?? 'all');
    setPriorityFilter(priority ?? 'all');
    setDateFromFilter(dateFrom ?? '');
    setDateToFilter(dateTo ?? '');
  }, [searchParams]);

  // Close filter dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowStatusFilter(false);
        setShowUserFilter(false);
        setShowProjectFilter(false);
        setShowPriorityFilter(false);
        setShowDateFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter issues based on current user role
  const availableIssues = useMemo(() => {
    if (isAdminOrTeamLead) {
      return issues;
    } else {
      return issues.filter(issue => issue.assignedTo === currentUser?.id);
    }
  }, [issues, currentUser?.id, isAdminOrTeamLead]);

  // Apply filters
  const filteredIssues = useMemo(() => {
    let filtered = [...availableIssues];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (isAdminOrTeamLead && userFilter !== 'all') {
      filtered = filtered.filter(issue => issue.assignedTo === userFilter);
    }

    if (projectFilter !== 'all') {
      filtered = filtered.filter(issue => issue.projectId === projectFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.priority === priorityFilter);
    }

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
  }, [availableIssues, statusFilter, userFilter, projectFilter, priorityFilter, dateFromFilter, dateToFilter, isAdminOrTeamLead]);

  // Update URL when filters change
  const updateFilters = (updates: {
    status?: string;
    user?: string;
    project?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const params = new URLSearchParams();
    
    const newStatus = updates.status !== undefined ? updates.status : statusFilter;
    const newUser = updates.user !== undefined ? updates.user : userFilter;
    const newProject = updates.project !== undefined ? updates.project : projectFilter;
    const newPriority = updates.priority !== undefined ? updates.priority : priorityFilter;
    const newDateFrom = updates.dateFrom !== undefined ? updates.dateFrom : dateFromFilter;
    const newDateTo = updates.dateTo !== undefined ? updates.dateTo : dateToFilter;

    if (newStatus !== 'all') params.set('status', newStatus);
    if (isAdminOrTeamLead && newUser !== 'all') params.set('user', newUser);
    if (newProject !== 'all') params.set('project', newProject);
    if (newPriority !== 'all') params.set('priority', newPriority);
    if (newDateFrom) params.set('dateFrom', newDateFrom);
    if (newDateTo) params.set('dateTo', newDateTo);

    router.push(`/tareas?${params.toString()}`);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    updateFilters({ status });
    setShowStatusFilter(false);
  };

  const handleUserChange = (userId: string) => {
    setUserFilter(userId);
    updateFilters({ user: userId });
    setShowUserFilter(false);
  };

  const handleProjectChange = (projectId: string) => {
    setProjectFilter(projectId);
    updateFilters({ project: projectId });
    setShowProjectFilter(false);
  };

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
    updateFilters({ priority });
    setShowPriorityFilter(false);
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
    setPriorityFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
    router.push('/tareas');
  };

  const hasActiveFilters = statusFilter !== 'all' || 
    (isAdminOrTeamLead && userFilter !== 'all') || 
    projectFilter !== 'all' || 
    priorityFilter !== 'all' || 
    dateFromFilter || 
    dateToFilter;

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'todo', label: 'Por Hacer' },
    { value: 'in-progress', label: 'En Progreso' },
    { value: 'review', label: 'En Revisión' },
    { value: 'done', label: 'Completadas' },
  ];

  const getStatusLabel = (status: string) => {
    return statusOptions.find(opt => opt.value === status)?.label || status;
  };

  const priorityOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
  ];

  const getPriorityLabel = (priority: string) => {
    return priorityOptions.find(opt => opt.value === priority)?.label || priority;
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:px-4 md:py-6">
        <div className="mb-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a métricas</span>
          </Link>
        </div>
        <PageHeader 
          title="Tareas" 
          subtitle={isAdminOrTeamLead ? "Todas las tareas del sistema" : "Mis tareas asignadas"}
        />

        {/* Results Summary and Clear Filters */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-medium text-gray-800">{filteredIssues.length}</span> de{' '}
            <span className="font-medium text-gray-800">{availableIssues.length}</span> tareas
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Issues Table - overflow-visible so filter dropdowns are not clipped */}
        <div ref={filtersRef} className="bg-white rounded-lg shadow overflow-visible">
          {filteredIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">No se encontraron tareas</p>
              <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card View */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredIssues.map((issue) => {
                  const assignedUser = users.find((u) => u.id === issue.assignedTo);
                  const project = projects.find((p) => p.id === issue.projectId);
                  const issueDate = issue.startDate || issue.dueDate || issue.createdAt;
                  
                  return (
                    <Link key={issue.id} href={`/issue/${issue.id}`}>
                      <div className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900 flex-1 pr-2">{issue.title}</h3>
                          <Badge variant="status" value={issue.status} />
                        </div>
                        {issue.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="priority" value={issue.priority} />
                          </div>
                          {assignedUser && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>{assignedUser.name}</span>
                            </div>
                          )}
                          {project && (
                            <div className="flex items-center gap-1.5">
                              <FolderKanban className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[120px]">{project.name}</span>
                            </div>
                          )}
                          {issueDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{format(parseISO(issueDate), 'dd/MM/yyyy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: Table View - no overflow on wrapper so filter dropdowns (Estado, Proyecto, etc.) are not clipped */}
              <div className="hidden md:block">
                <Table containerClassName="overflow-visible min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] max-w-[160px] w-[160px]">
                    <div className="flex items-center gap-2">
                      <span>Título</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowStatusFilter(!showStatusFilter);
                          setShowUserFilter(false);
                          setShowProjectFilter(false);
                          setShowPriorityFilter(false);
                          setShowDateFilter(false);
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <span>Estado</span>
                        {statusFilter !== 'all' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            {getStatusLabel(statusFilter)}
                          </span>
                        )}
                        {showStatusFilter ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showStatusFilter && (
                        <div className="absolute top-full left-0 mt-1 z-[100] bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] max-w-[90vw] max-h-[300px] overflow-y-auto">
                          {statusOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(option.value)}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-900 ${
                                statusFilter === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full shrink-0 bg-gray-300" style={option.value !== 'all' ? { backgroundColor: option.value === 'todo' ? '#94a3b8' : option.value === 'in-progress' ? '#3b82f6' : option.value === 'review' ? '#8b5cf6' : '#22c55e' } : undefined} />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowPriorityFilter(!showPriorityFilter);
                          setShowStatusFilter(false);
                          setShowUserFilter(false);
                          setShowProjectFilter(false);
                          setShowDateFilter(false);
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <span>Prioridad</span>
                        {priorityFilter !== 'all' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            {getPriorityLabel(priorityFilter)}
                          </span>
                        )}
                        {showPriorityFilter ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showPriorityFilter && (
                        <div className="absolute top-full left-0 mt-1 z-[100] bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px] max-w-[90vw] max-h-[300px] overflow-y-auto">
                          {priorityOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => handlePriorityChange(option.value)}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm text-gray-900 ${
                                priorityFilter === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    option.value === 'all'
                                      ? '#94a3b8'
                                      : option.value === 'low'
                                        ? '#22c55e'
                                        : option.value === 'medium'
                                          ? '#eab308'
                                          : '#ef4444',
                                }}
                              />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableHead>
                  {isAdminOrTeamLead && (
                    <TableHead className="w-[180px]">
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowUserFilter(!showUserFilter);
                            setShowStatusFilter(false);
                            setShowProjectFilter(false);
                            setShowPriorityFilter(false);
                            setShowDateFilter(false);
                          }}
                          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Asignado a</span>
                          {userFilter !== 'all' && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                              {users.find(u => u.id === userFilter)?.name || 'Usuario'}
                            </span>
                          )}
                          {showUserFilter ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {showUserFilter && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] max-w-[90vw] max-h-[300px] overflow-y-auto">
                            <button
                              onClick={() => handleUserChange('all')}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm ${
                                userFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                              }`}
                            >
                              Todos los usuarios
                            </button>
                            {users.map(user => (
                              <button
                                key={user.id}
                                onClick={() => handleUserChange(user.id)}
                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm ${
                                  userFilter === user.id ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                                }`}
                              >
                                <Avatar name={user.name} size="sm" />
                                <span className="truncate">{user.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  )}
                  {!isAdminOrTeamLead && (
                    <TableHead className="w-[180px]">Asignado a</TableHead>
                  )}
                  <TableHead className="w-[180px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowProjectFilter(!showProjectFilter);
                          setShowStatusFilter(false);
                          setShowUserFilter(false);
                          setShowPriorityFilter(false);
                          setShowDateFilter(false);
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <FolderKanban className="w-4 h-4" />
                        <span>Proyecto</span>
                        {projectFilter !== 'all' && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            {projects.find(p => p.id === projectFilter)?.name || 'Proyecto'}
                          </span>
                        )}
                        {showProjectFilter ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showProjectFilter && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] max-w-[90vw] max-h-[300px] overflow-y-auto">
                          <button
                            onClick={() => handleProjectChange('all')}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm flex items-center gap-2 ${
                              projectFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                            }`}
                          >
                            <FolderKanban className="w-4 h-4 shrink-0 text-gray-500" />
                            <span>Todos los proyectos</span>
                          </button>
                          {projects.map(project => (
                            <button
                              key={project.id}
                              onClick={() => handleProjectChange(project.id)}
                              className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm ${
                                projectFilter === project.id ? 'bg-indigo-50 text-indigo-700 font-medium' : ''
                              }`}
                            >
                              <FolderKanban className="w-4 h-4 shrink-0 text-amber-500" />
                              <span className="truncate">{project.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowDateFilter(!showDateFilter);
                          setShowStatusFilter(false);
                          setShowUserFilter(false);
                          setShowProjectFilter(false);
                          setShowPriorityFilter(false);
                        }}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Fecha</span>
                        {(dateFromFilter || dateToFilter) && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                            Filtro
                          </span>
                        )}
                        {showDateFilter ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {showDateFilter && (
                        <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[250px] max-w-[90vw]">
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Desde
                              </label>
                              <input
                                type="date"
                                value={dateFromFilter}
                                onChange={(e) => handleDateFromChange(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Hasta
                              </label>
                              <input
                                type="date"
                                value={dateToFilter}
                                onChange={(e) => handleDateToChange(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            {(dateFromFilter || dateToFilter) && (
                              <button
                                onClick={() => {
                                  setDateFromFilter('');
                                  setDateToFilter('');
                                  updateFilters({ dateFrom: '', dateTo: '' });
                                }}
                                className="w-full text-xs text-red-600 hover:text-red-700 py-1"
                              >
                                Limpiar fecha
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.map((issue) => {
                  const assignedUser = users.find((u) => u.id === issue.assignedTo);
                  const project = projects.find((p) => p.id === issue.projectId);
                  const issueDate = issue.startDate || issue.dueDate || issue.createdAt;
                  
                  return (
                    <TableRow key={issue.id} className="hover:bg-gray-50">
                      <TableCell className="max-w-[160px]">
                        <Link 
                          href={`/issue/${issue.id}`}
                          className="hover:text-indigo-600 transition-colors block"
                          title={issue.description ? `${issue.title}: ${issue.description}` : issue.title}
                        >
                          <span className="font-medium text-gray-900 truncate block">
                            {issue.title}
                          </span>
                          {issue.description && (
                            <span className="text-xs text-gray-500 line-clamp-1 block mt-0.5 max-w-full truncate">
                              {issue.description.length > 50 ? `${issue.description.slice(0, 50)}…` : issue.description}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="status" value={issue.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="priority" value={issue.priority} />
                      </TableCell>
                      <TableCell>
                        {assignedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={assignedUser.name} size="sm" />
                            <span className="text-sm text-gray-700">{assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project ? (
                          <div className="flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{project.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin proyecto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {issueDate ? (
                          <span className="text-sm text-gray-600">
                            {format(parseISO(issueDate), 'dd/MM/yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/issue/${issue.id}`}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          Ver →
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
                </Table>
              </div>
            </>
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
