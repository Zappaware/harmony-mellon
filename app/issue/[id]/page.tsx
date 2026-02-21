'use client'

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp, Issue } from '@/context/AppContext';
import { api, type ApiAttachment } from '@/services/api';
import { User, Calendar, MessageSquare, Send, Clock, Trash2, FolderKanban, Pencil, AlertCircle, Plus, Paperclip, Download } from 'lucide-react';
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
import { EditIssueModal } from '@/components/EditIssueModal';

export default function DetalleIssue() {
  const params = useParams();
  const id = params.id as string;
  const { issues, addComment, users, projects, user: currentUser, deleteIssue, updateIssueStatus, refreshIssue } = useApp();
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Issue['status'] | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [pendingIssueAttachments, setPendingIssueAttachments] = useState<ApiAttachment[]>([]);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  const handleDownload = async (url: string, fileName: string) => {
    if (downloadingUrl) return;
    setDownloadingUrl(url);
    try {
      await api.downloadFile(url, fileName);
    } catch (err) {
      console.error('Download failed:', err);
      alert(err instanceof Error ? err.message : 'Error al descargar');
    } finally {
      setDownloadingUrl(null);
    }
  };

  const FORBIDDEN_COMPLETE_MSG = 'Solo un líder o administrador puede mover la tarea de Revisión a Completada.';

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
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      const msg = error instanceof Error ? error.message : '';
      setForbiddenMessage(msg.includes('Solo el creador') || msg.includes('Solo un líder') ? msg : 'Error al actualizar el estado. Por favor, intenta de nuevo.');
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
  // Only team_lead or admin can move from Revisión to Completada
  const onlyLeaderOrAdminCanComplete = Boolean(
    currentUser && currentUser.role !== 'admin' && currentUser.role !== 'team_lead'
  );

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasComment = newComment.trim().length > 0;
    const hasPendingAttachments = pendingIssueAttachments.length > 0;

    if (!hasComment && !hasPendingAttachments) return;

    if (hasPendingAttachments) {
      const currentIssue = await api.getIssue(issue.id);
      const currentAttachments = currentIssue.attachments || [];
      const updatedAttachments = [...currentAttachments, ...pendingIssueAttachments];
      await api.updateIssue(issue.id, { attachments: updatedAttachments });
      await refreshIssue(issue.id);
      setPendingIssueAttachments([]);
    }

    if (hasComment) {
      await addComment(issue.id, newComment);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !issue) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('El archivo es demasiado grande. El tamaño máximo es 10MB.');
      e.target.value = '';
      return;
    }

    setIsUploadingAttachment(true);
    try {
      // Upload file to server (under uploads/client_id/project_id/images|files)
      const uploadedAttachment = await api.uploadFile(file, {
        clientId: issue.clientId || undefined,
        projectId: issue.projectId || undefined,
      });

      // Preload: add to pending list (will be added to issue when user clicks Enviar)
      setPendingIssueAttachments(prev => [...prev, uploadedAttachment]);
    } catch (error) {
      console.error('Error uploading attachment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir el archivo. Por favor, intenta de nuevo.';
      alert(errorMessage);
      if (error instanceof Error &&
          (error.message.includes('Sesión expirada') ||
           error.message.includes('Unauthorized: Invalid or expired token'))) {
        setTimeout(() => router.push('/'), 1500);
      }
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
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
                        if (newStatus === 'done' && onlyLeaderOrAdminCanComplete) {
                          setForbiddenMessage(FORBIDDEN_COMPLETE_MSG);
                          e.target.value = issue.status;
                          return;
                        }
                        setPendingStatus(newStatus);
                        setShowStatusConfirmDialog(true);
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
                    <option value="done" disabled={onlyLeaderOrAdminCanComplete} title={onlyLeaderOrAdminCanComplete ? 'Solo un líder o administrador puede marcar como completada' : undefined}>
                      Completada
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Editar tarea"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar tarea"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
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

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Adjuntos del issue
            </h3>
            {issue.attachments && issue.attachments.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {issue.attachments.map((att, index) => {
                  const fileName = att.name || att.url.split('/').pop() || 'archivo';
                  const isImage = att.type === 'image' || (att.url && /\.(jpe?g|png|gif|webp)$/i.test(att.url));
                  return (
                    <div key={att.url ? `${att.url}-${index}` : index} className="relative flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden group">
                      {isImage ? (
                        <>
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="block" title="Ver imagen">
                            <img src={att.url} alt="" className="h-14 w-14 object-cover" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDownload(att.url, fileName)}
                            disabled={downloadingUrl === att.url}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50"
                            title="Descargar imagen"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-3 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors" title={`Ver ${fileName}`}>
                            <Paperclip className="w-6 h-6" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDownload(att.url, fileName)}
                            disabled={downloadingUrl === att.url}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 transition-colors flex items-center justify-center border-l border-gray-300 disabled:opacity-50"
                            title="Descargar archivo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay adjuntos en este issue.</p>
            )}
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
              <p className="text-gray-800">
                {projects.find((p) => p.id === issue.projectId)?.name ?? 'Sin proyecto'}
              </p>
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
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="mt-3 pl-11 flex flex-wrap gap-2">
                    {comment.attachments.map((att, idx) => {
                      const fileName = att.name || att.url.split('/').pop() || 'archivo';
                      const isImage = att.type === 'image' || (att.url && /\.(jpe?g|png|gif|webp)$/i.test(att.url));
                      
                      return (
                        <div key={idx} className="relative flex items-center gap-1 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden group">
                          {isImage ? (
                            <>
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="block" title="Ver imagen">
                                <img
                                  src={att.url}
                                  alt=""
                                  className="h-14 w-14 object-cover"
                                />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDownload(att.url, fileName)}
                                disabled={downloadingUrl === att.url}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50"
                                title="Descargar imagen"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center p-3 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 transition-colors"
                                title={`Ver ${fileName}`}
                              >
                                <Paperclip className="w-6 h-6" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDownload(att.url, fileName)}
                                disabled={downloadingUrl === att.url}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 transition-colors flex items-center justify-center border-l border-gray-300 disabled:opacity-50"
                                title="Descargar archivo"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

          {pendingIssueAttachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="w-full text-xs text-gray-500 mb-1">Adjuntos pendientes (se añadirán al issue al pulsar Enviar):</span>
              {pendingIssueAttachments.map((att, idx) => {
                const isImage = att.type === 'image' || (att.url && /\.(jpe?g|png|gif|webp)$/i.test(att.url));
                const label = att.name || (isImage ? 'Imagen' : 'Archivo');
                return (
                  <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded-lg border border-gray-200 px-3 py-2">
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">{label}</span>
                    <button
                      type="button"
                      onClick={() => setPendingIssueAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded p-1 text-sm"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

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
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload-attachment"
                  accept="image/*,*"
                  onChange={handleFileUpload}
                  disabled={isUploadingAttachment}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload-attachment"
                  className={`p-3 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                    isUploadingAttachment
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Agregar imagen o archivo"
                >
                  <Plus className="w-5 h-5" />
                </label>
                <button
                  type="submit"
                  disabled={!newComment.trim() && pendingIssueAttachments.length === 0}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  <span>Enviar</span>
                </button>
              </div>
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

        <EditIssueModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            setShowEditModal(false);
            await refreshIssue(issue.id);
          }}
          issue={issue}
          projectsOverride={projects}
        />

        <AlertDialog open={forbiddenMessage !== null} onOpenChange={(open) => !open && setForbiddenMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                No puedes completar esta tarea
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 pt-1">
                {forbiddenMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setForbiddenMessage(null)} className="bg-indigo-600 hover:bg-indigo-700">
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWithSidebar>
  );
}
