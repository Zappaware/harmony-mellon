'use client'

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FolderKanban, Users, TrendingUp, ArrowLeft, Trash2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/Badge';
import { IssueCardList } from '@/components/IssueCardList';
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { projects, issues, deleteProject, updateProject, user: currentUser } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const project = projects.find(p => p.id === projectId);
  const projectIssues = issues.filter(issue => issue.projectId === projectId);
  const completedIssues = projectIssues.filter(issue => issue.status === 'done');
  const progress = projectIssues.length > 0 
    ? Math.round((completedIssues.length / projectIssues.length) * 100)
    : 0;

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'team_lead';

  const handleDelete = async () => {
    if (!projectId) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      router.push('/proyectos');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error al eliminar el proyecto. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleStatusChangeClick = (newStatus: string) => {
    if (!projectId || !canEdit) return;
    setPendingStatus(newStatus);
    setShowStatusConfirmDialog(true);
    setShowStatusDropdown(false);
  };

  const handleStatusChange = async () => {
    if (!projectId || !canEdit || !pendingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateProject(projectId, { status: pendingStatus });
      setShowStatusConfirmDialog(false);
      setPendingStatus(null);
      // Projects will be reloaded via AppContext
      router.refresh();
    } catch (error) {
      console.error('Error updating project status:', error);
      alert('Error al actualizar el estado del proyecto. Por favor, intenta de nuevo.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const statusOptions = [
    { value: 'planning', label: 'Planificación' },
    { value: 'En Progreso', label: 'En Progreso' },
    { value: 'Finalizando', label: 'Finalizando' },
    { value: 'completed', label: 'Completado' },
    { value: 'on_hold', label: 'En Pausa' },
  ];

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  if (!project) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Proyecto no encontrado</p>
            <Link href="/proyectos" className="text-indigo-600 hover:text-indigo-700">
              Volver a proyectos
            </Link>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6">
          <Link 
            href="/proyectos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a proyectos</span>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${project.color || 'bg-indigo-600'} rounded-lg flex items-center justify-center shrink-0`}>
                <FolderKanban className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl text-gray-800 mb-2">{project.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {project.type && (
                    <Badge variant="status" value={project.type} />
                  )}
                  {canEdit ? (
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        disabled={isUpdatingStatus}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>{getStatusLabel(project.status || 'planning')}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {showStatusDropdown && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowStatusDropdown(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setShowStatusDropdown(false);
                              }
                            }}
                            role="button"
                            tabIndex={-1}
                            aria-label="Cerrar menú de estado"
                          />
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px]">
                            {statusOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChangeClick(option.value)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                  project.status === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">{getStatusLabel(project.status || 'planning')}</span>
                  )}
                </div>
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Progreso</span>
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800 mb-2">
              {projectIssues.length > 0 
                ? `${completedIssues.length}/${projectIssues.length} completadas`
                : `${progress}%`}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Tareas</span>
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800">{projectIssues.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Miembros</span>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800">
              {project.members?.length || 0}
            </p>
          </div>
        </div>

        {/* Project Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Información del Proyecto</h2>
          <div className="space-y-4">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Descripción</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.startDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</h3>
                  <DateDisplay date={project.startDate} format="date" />
                </div>
              )}
              {project.deadline && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Fecha Límite</h3>
                  <DateDisplay date={project.deadline} format="date" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={`/kanban?project=${projectId}`}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <FolderKanban className="w-5 h-5" />
            Ver Kanban
          </Link>
        </div>

        {/* Issues List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Tareas del Proyecto ({projectIssues.length})
            </h2>
          </div>
          {projectIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay tareas en este proyecto</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projectIssues.map((issue) => (
                <IssueCardList key={issue.id} issue={issue} showProject={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el proyecto{' '}
              <strong>{project.name}</strong> y todas sus tareas asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showStatusConfirmDialog} onOpenChange={setShowStatusConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cambiar el estado del proyecto{' '}
              <strong>{project.name}</strong> de{' '}
              <strong>{getStatusLabel(project.status || 'planning')}</strong> a{' '}
              <strong>{pendingStatus ? getStatusLabel(pendingStatus) : ''}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus} onClick={() => setPendingStatus(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isUpdatingStatus}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdatingStatus ? 'Actualizando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWithSidebar>
  );
}
