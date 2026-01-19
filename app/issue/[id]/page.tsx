'use client'

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp, Issue } from '@/context/AppContext';
import { api } from '@/services/api';
import { User, Calendar, MessageSquare, Send, Clock, Trash2, FolderKanban } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { PageHeader } from '@/components/PageHeader';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';
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

export default function DetalleIssue() {
  const params = useParams();
  const id = params.id as string;
  const { issues, addComment, users, projects, user: currentUser, deleteIssue, updateIssueStatus } = useApp();
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Issue['status'] | null>(null);

  const issue = issues.find((i) => i.id === id);

  const getStatusLabel = (status: Issue['status']) => {
    const labels: Record<Issue['status'], string> = {
      'todo': 'Por Hacer',
      'in-progress': 'En Progreso',
      'review': 'En Revisión',
      'done': 'Completada',
    };
    return labels[status] || status;
  };

  const handleStatusChange = async () => {
    if (!pendingStatus || !issue) return;
    setIsUpdatingStatus(true);
    try {
      await updateIssueStatus(issue.id, pendingStatus);
      setShowStatusConfirmDialog(false);
      setPendingStatus(null);
      // Reload page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado. Por favor, intenta de nuevo.');
      setIsUpdatingStatus(false);
    }
  };

  if (!issue) {
    return (
      <LayoutWithSidebar>
        <div className="p-8">
          <div className="text-center">
            <h1 className="text-2xl text-gray-800 mb-4">Issue no encontrado</h1>
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Volver atrás
            </button>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  const assignedUser = users.find((u) => u.id === issue.assignedTo);
  const createdByUser = users.find((u) => u.id === issue.createdBy);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(issue.id, newComment);
      setNewComment('');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteIssue(issue.id);
      router.push('/mis-tareas');
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Error al eliminar la tarea. Por favor, intenta de nuevo.');
      setIsDeleting(false);
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <PageHeader title="" subtitle="" showBack />

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="text-xs md:text-sm text-gray-500">Issue #{issue.id}</span>
              </div>
              <h1 className="text-xl md:text-3xl text-gray-800 mb-3 md:mb-4 pr-12 md:pr-16">{issue.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="priority" value={issue.priority} />
                <div className="relative">
                  <select
                    value={issue.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as Issue['status'];
                      if (newStatus !== issue.status) {
                        setPendingStatus(newStatus);
                        setShowStatusConfirmDialog(true);
                        // Reset select to current value until confirmed
                        e.target.value = issue.status;
                      }
                    }}
                    disabled={isUpdatingStatus}
                    className="appearance-none bg-transparent border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: issue.status === 'todo' ? '#374151' :
                             issue.status === 'in-progress' ? '#1e40af' :
                             issue.status === 'review' ? '#7c3aed' :
                             '#16a34a'
                    }}
                  >
                    <option value="todo">Por Hacer</option>
                    <option value="in-progress">En Progreso</option>
                    <option value="review">En Revisión</option>
                    <option value="done">Completada</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-gray-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Descripción
            </h2>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {issue.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Asignado a</span>
              </div>
              {assignedUser ? (
                <div className="flex items-center gap-2">
                  <Avatar name={assignedUser.name} size="sm" />
                  <span className="text-gray-800">{assignedUser.name}</span>
                </div>
              ) : (
                <span className="text-gray-500">Sin asignar</span>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Creado por</span>
              </div>
              {createdByUser && (
                <div className="flex items-center gap-2">
                  <Avatar name={createdByUser.name} size="sm" />
                  <span className="text-gray-800">{createdByUser.name}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Fecha de creación</span>
              </div>
              <p className="text-gray-800">
                <DateDisplay date={issue.createdAt} format="date" />
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FolderKanban className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Proyecto</span>
              </div>
              <select
                value={issue.projectId || ''}
                onChange={async (e) => {
                  const newProjectId = e.target.value;
                  setIsUpdatingProject(true);
                  try {
                    await api.updateIssue(issue.id, {
                      project_id: newProjectId || undefined,
                    });
                    // Reload page to show updated project
                    window.location.reload();
                  } catch (error) {
                    console.error('Error updating project:', error);
                    alert('Error al actualizar el proyecto. Por favor, intenta de nuevo.');
                  } finally {
                    setIsUpdatingProject(false);
                  }
                }}
                disabled={isUpdatingProject}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <h2 className="text-lg md:text-xl text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comentarios ({issue.comments.length})
          </h2>

          <div className="space-y-4 mb-6">
            {issue.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={comment.userName} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{comment.userName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <DateDisplay date={comment.createdAt} format="datetime" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 pl-11">{comment.text}</p>
              </div>
            ))}
            {issue.comments.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay comentarios aún</p>
                <p className="text-sm text-gray-400 mt-1">Sé el primero en comentar</p>
              </div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-3">
            <Avatar name={currentUser?.name || 'Usuario'} size="md" />
            <div className="flex-1 flex gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span>Enviar</span>
              </button>
            </div>
          </form>
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea{' '}
                <strong>{issue.title}</strong> y todos sus comentarios.
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
                ¿Estás seguro de que deseas cambiar el estado de la tarea{' '}
                <strong>{issue.title}</strong> de{' '}
                <strong>{getStatusLabel(issue.status)}</strong> a{' '}
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
      </div>
    </LayoutWithSidebar>
  );
}
