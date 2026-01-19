'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { FolderKanban, Users, Calendar, TrendingUp, Trash2, Grid3x3, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { Loading } from '@/components/Loading';
import { Badge } from '@/components/Badge';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  tipo?: 'Campaña' | 'Planner' | 'Producciones';
  progreso: number;
  miembros: number;
  fechaLimite: string | null;
  estado: string;
  color: string;
}

function ProyectosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, deleteProject, issues } = useApp();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return searchParams.get('view') === 'table' ? 'table' : 'cards';
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return searchParams.get('status') || 'all';
  });
  const [typeFilter, setTypeFilter] = useState<string>(() => {
    return searchParams.get('type') || 'all';
  });

  // Load projects from API
  useEffect(() => {
    const loadProjects = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const apiProjects = await api.getProjects();
        // Calculate progress based on completed issues
        const convertedProjects: Project[] = apiProjects.map(project => {
          const projectIssues = issues.filter(issue => issue.projectId === project.id);
          const completedIssues = projectIssues.filter(issue => issue.status === 'done');
          const progress = projectIssues.length > 0 
            ? Math.round((completedIssues.length / projectIssues.length) * 100)
            : (project.progress || 0);
          
          return {
            id: project.id,
            nombre: project.name,
            descripcion: project.description || '',
            tipo: project.type,
            progreso: progress,
            miembros: project.members?.length || 0,
            fechaLimite: project.deadline || null,
            estado: project.status || 'planning',
            color: project.color || 'bg-blue-500',
          };
        });
        setProyectos(convertedProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Keep empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [user, issues]);

  // Filter projects based on filters
  const filteredProyectos = useMemo(() => {
    let filtered = [...proyectos];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.estado === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.tipo === typeFilter);
    }

    return filtered;
  }, [proyectos, statusFilter, typeFilter]);

  const handleCardClick = (filterType: 'all' | 'in-progress' | 'completed' | 'on-hold') => {
    setViewMode('table');
    if (filterType === 'in-progress') {
      setStatusFilter('in_progress');
      router.push('/proyectos?view=table&status=in_progress');
    } else if (filterType === 'completed') {
      setStatusFilter('completed');
      router.push('/proyectos?view=table&status=completed');
    } else if (filterType === 'on-hold') {
      setStatusFilter('on_hold');
      router.push('/proyectos?view=table&status=on_hold');
    } else {
      setStatusFilter('all');
      router.push('/proyectos?view=table');
    }
  };


  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <Loading fullScreen message="Cargando proyectos..." />
      </LayoutWithSidebar>
    );
  }


  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pr-12 md:pr-16">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl text-gray-800 mb-1 md:mb-2">Proyectos</h1>
              <p className="text-sm md:text-base text-gray-600">Gestiona todos tus proyectos activos</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setViewMode('table');
                  router.push('/proyectos?view=table');
                }}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Ver tabla"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setViewMode('cards');
                  router.push('/proyectos');
                }}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-indigo-100 text-indigo-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Ver tarjetas"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              {(user?.role === 'admin' || user?.role === 'team_lead') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Nuevo Proyecto
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <button
            onClick={() => handleCardClick('all')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Proyectos</span>
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl text-gray-800">{proyectos.length}</p>
          </button>
          
          <button
            onClick={() => handleCardClick('in-progress')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">En Progreso</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.filter(p => p.estado === 'in_progress' || p.estado === 'En Progreso').length}
            </p>
          </button>
          
          <button
            onClick={() => handleCardClick('on-hold')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">En Pausa</span>
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.filter(p => p.estado === 'on_hold' || p.estado === 'En Pausa').length}
            </p>
          </button>
          
          <button
            onClick={() => handleCardClick('completed')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Completados</span>
              <span className="text-sm text-gray-500">de Total</span>
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.length > 0 
                ? `${proyectos.filter(p => p.estado === 'completed' || p.estado === 'Completado').length}/${proyectos.length}`
                : '0/0'}
            </p>
          </button>
        </div>

        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
              <div>
                <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    router.push(`/proyectos?view=table&status=${e.target.value}&type=${typeFilter}`);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="planning">Planificación</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="on_hold">En Pausa</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div>
                <label htmlFor="type-filter" className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    router.push(`/proyectos?view=table&status=${statusFilter}&type=${e.target.value}`);
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Todos</option>
                  <option value="Campaña">Campaña</option>
                  <option value="Planner">Planner</option>
                  <option value="Producciones">Producciones</option>
                </select>
              </div>
            </div>

            {/* Table View */}
            {filteredProyectos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">No se encontraron proyectos</p>
                <p className="text-sm">Intenta ajustar los filtros para ver más resultados</p>
              </div>
            ) : (
              <>
                {/* Mobile: Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredProyectos.map((proyecto) => {
                    const projectIssues = issues.filter(issue => issue.projectId === proyecto.id);
                    const completed = projectIssues.filter(issue => issue.status === 'done').length;
                    return (
                      <Link key={proyecto.id} href={`/proyectos/${proyecto.id}`}>
                        <div className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-10 h-10 ${proyecto.color} rounded-lg flex items-center justify-center shrink-0`}>
                                <FolderKanban className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 truncate">{proyecto.nombre}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {proyecto.tipo && (
                                    <Badge variant="status" value={proyecto.tipo} />
                                  )}
                                  <span className="text-xs text-gray-500">{proyecto.estado}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {proyecto.descripcion && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{proyecto.descripcion}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>
                                {projectIssues.length > 0 
                                  ? `${completed}/${projectIssues.length} completadas`
                                  : `${proyecto.progreso}%`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>{proyecto.miembros} miembros</span>
                            </div>
                            {proyecto.fechaLimite && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <DateDisplay date={proyecto.fechaLimite} format="date" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Desktop: Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Progreso</TableHead>
                        <TableHead>Miembros</TableHead>
                        <TableHead>Fecha Límite</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProyectos.map((proyecto) => {
                        const projectIssues = issues.filter(issue => issue.projectId === proyecto.id);
                        const completed = projectIssues.filter(issue => issue.status === 'done').length;
                        return (
                          <TableRow key={proyecto.id} className="hover:bg-gray-50">
                            <TableCell>
                              <Link href={`/proyectos/${proyecto.id}`} className="hover:text-indigo-600 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 ${proyecto.color} rounded-lg flex items-center justify-center shrink-0`}>
                                    <FolderKanban className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">{proyecto.nombre}</div>
                                    {proyecto.descripcion && (
                                      <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                        {proyecto.descripcion}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              {proyecto.tipo && (
                                <Badge variant="status" value={proyecto.tipo} />
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{proyecto.estado}</span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm text-gray-600 mb-1">
                                  {projectIssues.length > 0 
                                    ? `${completed}/${projectIssues.length} completadas`
                                    : `${proyecto.progreso}%`}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${proyecto.progreso}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{proyecto.miembros}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {proyecto.fechaLimite ? (
                                <DateDisplay date={proyecto.fechaLimite} format="date" />
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/proyectos/${proyecto.id}`}
                                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                >
                                  Ver →
                                </Link>
                                {(user?.role === 'admin' || user?.role === 'team_lead') && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setProjectToDelete(proyecto.id);
                                    }}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar proyecto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  href={`/proyectos/${proyecto.id}`}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className={`w-12 h-12 ${proyecto.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {proyecto.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {proyecto.tipo && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                          {proyecto.tipo}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{proyecto.estado}</span>
                    </div>
                  </div>
                </Link>
                {(user?.role === 'admin' || user?.role === 'team_lead') && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setProjectToDelete(proyecto.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Link href={`/proyectos/${proyecto.id}`}>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{proyecto.descripcion}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso</span>
                    <span className="font-medium">
                      {(() => {
                        const projectIssues = issues.filter(issue => issue.projectId === proyecto.id);
                        const completed = projectIssues.filter(issue => issue.status === 'done').length;
                        return projectIssues.length > 0 
                          ? `${completed}/${projectIssues.length} completadas`
                          : `${proyecto.progreso}%`;
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proyecto.progreso}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{proyecto.miembros} miembros</span>
                  </div>
                  {proyecto.fechaLimite ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <DateDisplay date={proyecto.fechaLimite} format="date" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Sin fecha límite</span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ))}
          </div>
        )}
      </div>
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          // Reload projects after successful creation
          try {
            const apiProjects = await api.getProjects();
            const convertedProjects: Project[] = apiProjects.map(project => ({
              id: project.id,
              nombre: project.name,
              descripcion: project.description || '',
              progreso: project.progress || 0,
              miembros: project.members?.length || 0,
              fechaLimite: project.deadline || null,
              estado: project.status || 'planning',
              color: project.color || 'bg-blue-500',
            }));
            setProyectos(convertedProjects);
          } catch (error) {
            console.error('Error reloading projects:', error);
          }
        }}
      />

      <AlertDialog open={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto{' '}
              <strong>{proyectos.find(p => p.id === projectToDelete)?.nombre}</strong> y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!projectToDelete) return;
                setIsDeleting(true);
                try {
                  await deleteProject(projectToDelete);
                  setProjectToDelete(null);
                  // Reload projects
                  const apiProjects = await api.getProjects();
                  const convertedProjects: Project[] = apiProjects.map(project => ({
                    id: project.id,
                    nombre: project.name,
                    descripcion: project.description || '',
                    progreso: project.progress || 0,
                    miembros: project.members?.length || 0,
                    fechaLimite: project.deadline || null,
                    estado: project.status || 'planning',
                    color: project.color || 'bg-blue-500',
                  }));
                  setProyectos(convertedProjects);
                } catch (error) {
                  console.error('Error deleting project:', error);
                  alert('Error al eliminar el proyecto. Por favor, intenta de nuevo.');
                } finally {
                  setIsDeleting(false);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWithSidebar>
  );
}

export default function Proyectos() {
  return (
    <Suspense fallback={<LayoutWithSidebar><Loading fullScreen message="Cargando proyectos..." /></LayoutWithSidebar>}>
      <ProyectosContent />
    </Suspense>
  );
}
