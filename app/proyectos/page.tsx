'use client'

import React, { useState, useEffect } from 'react';
import { FolderKanban, Users, Calendar, TrendingUp, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { api } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { Loading } from '@/components/Loading';
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
  progreso: number;
  miembros: number;
  fechaLimite: string | null;
  estado: string;
  color: string;
}

export default function Proyectos() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, deleteProject } = useApp();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        console.error('Error loading projects:', error);
        // Keep empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [user]);

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
        <PageHeader
          title="Proyectos"
          subtitle="Gestiona todos tus proyectos activos"
          action={
            (user?.role === 'admin' || user?.role === 'team_lead') ? {
              label: 'Nuevo Proyecto',
              onClick: () => setIsCreateModalOpen(true),
            } : undefined
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Proyectos</span>
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl text-gray-800">{proyectos.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">En Progreso</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.filter(p => p.estado === 'En Progreso').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Progreso Promedio</span>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.length > 0 
                ? Math.round(proyectos.reduce((sum, p) => sum + p.progreso, 0) / proyectos.length)
                : 0}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <Link
                  href="/kanban"
                  className="flex items-center gap-3 flex-1"
                >
                  <div className={`w-12 h-12 ${proyecto.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {proyecto.nombre}
                    </h3>
                    <span className="text-xs text-gray-500">{proyecto.estado}</span>
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

              <Link href="/kanban">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{proyecto.descripcion}</p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso</span>
                    <span className="font-medium">{proyecto.progreso}%</span>
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
          
          {(user?.role === 'admin' || user?.role === 'team_lead') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-100 hover:border-indigo-400 transition-all flex flex-col items-center justify-center min-h-[280px] group"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                <Plus className="w-6 h-6 text-indigo-600" />
              </div>
              <p className="text-gray-600 group-hover:text-gray-800">Crear Nuevo Proyecto</p>
            </button>
          )}
        </div>
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
