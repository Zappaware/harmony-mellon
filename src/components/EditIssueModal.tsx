'use client'

import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Image, File, Plus, Trash2, FolderKanban, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiAttachment, ApiClient } from '@/services/api';
import { Issue, useApp } from '@/context/AppContext';

const TASK_TYPES: Record<string, { value: string; label: string }[]> = {
  Planner: [
    { value: 'reportes', label: 'Reportes' },
    { value: 'estrategia', label: 'Estrategia' },
    { value: 'diseño', label: 'Diseño' },
    { value: 'fotos', label: 'Fotos' },
  ],
  Branding: [
    { value: 'brief', label: 'Brief' },
    { value: 'propuesta', label: 'Propuesta' },
    { value: 'plan_comunicacion', label: 'Plan de comunicación' },
    { value: 'presentacion', label: 'Presentación' },
  ],
  Campaña: [
    { value: 'tarea', label: 'Tarea' },
  ],
};

interface EditIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  issue: Issue | null;
}

export function EditIssueModal({ isOpen, onClose, onSuccess, issue }: EditIssueModalProps) {
  const { users, projects, user: currentUser } = useApp();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    projectId: '',
    clientId: '',
    taskType: '',
    startDate: '',
    dueDate: '',
  });
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const [newAttachment, setNewAttachment] = useState({
    type: 'link' as 'link' | 'image' | 'file',
    url: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load issue data when modal opens
  useEffect(() => {
    if (isOpen && issue) {
      setFormData({
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        assignedTo: issue.assignedTo || '',
        projectId: issue.projectId || '',
        clientId: issue.clientId || '',
        taskType: issue.taskType || '',
        startDate: issue.startDate || '',
        dueDate: issue.dueDate || '',
      });
      loadIssueDetails();
      setError(null);
    }
  }, [isOpen, issue]);

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      api.getClients().then(setClients).catch(() => setClients([]));
    }
  }, [isOpen]);

  const loadIssueDetails = async () => {
    if (!issue) return;
    try {
      const issueDetails = await api.getIssue(issue.id);
      if (issueDetails.attachments) {
        setAttachments(issueDetails.attachments);
      }
      setFormData((prev) => ({
        ...prev,
        projectId: issueDetails.project_id || prev.projectId,
        clientId: issueDetails.client_id || prev.clientId,
        taskType: issueDetails.task_type || prev.taskType,
      }));
    } catch (err) {
      console.error('Error loading issue details:', err);
    }
  };

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.updateIssue(issue.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assigned_to: formData.assignedTo || undefined,
        project_id: formData.projectId || undefined,
        client_id: formData.clientId || undefined,
        task_type: formData.taskType || undefined,
        start_date: formData.startDate || undefined,
        due_date: formData.dueDate || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      toast.success('Tarea actualizada exitosamente', {
        description: `La tarea "${formData.title}" ha sido actualizada.`,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la tarea';
      setError(errorMessage);
      toast.error('Error al actualizar la tarea', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddAttachment = () => {
    if (!newAttachment.url.trim()) {
      toast.error('Por favor ingresa una URL');
      return;
    }

    const attachment: ApiAttachment = {
      type: newAttachment.type,
      url: newAttachment.url.trim(),
      name: newAttachment.name.trim() || undefined,
    };

    setAttachments(prev => [...prev, attachment]);
    setNewAttachment({ type: 'link', url: '', name: '' });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Editar Tarea</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Implementar nueva funcionalidad"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe la tarea en detalle..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
                Asignar a
              </label>
              {(() => {
                const assigneeUser = users.find((u) => u.id === issue.assignedTo);
                const reassignLocked = Boolean(
                  issue.assignedTo &&
                  assigneeUser &&
                  (assigneeUser.role === 'team_lead' || assigneeUser.role === 'admin') &&
                  currentUser &&
                  currentUser.role !== 'admin' &&
                  currentUser.role !== 'team_lead'
                );
                return (
                  <>
                    <select
                      id="assignedTo"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      disabled={reassignLocked}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Sin asignar</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    {reassignLocked && (
                      <p className="text-amber-700 text-xs mt-1">
                        Esta tarea está asignada a un líder o administrador. Solo un líder o administrador puede reasignarla.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <FolderKanban className="w-4 h-4" />
                Proyecto
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Cliente
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Sin cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedProject = projects.find((p) => p.id === formData.projectId);
              const projectType = selectedProject?.type || 'Campaña';
              const options = TASK_TYPES[projectType] || TASK_TYPES.Campaña;
              return (
                <div>
                  <label htmlFor="taskType" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de tarea
                  </label>
                  <select
                    id="taskType"
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{projectType === 'Campaña' ? 'Tarea libre (opcional)' : 'Seleccionar...'}</option>
                    {options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjuntos (Enlaces, Imágenes, Archivos)
            </label>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newAttachment.type}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value as 'link' | 'image' | 'file' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                >
                  <option value="link">Enlace</option>
                  <option value="image">Imagen</option>
                  <option value="file">Archivo</option>
                </select>
                {newAttachment.type === 'link' ? (
                  <>
                    <input
                      type="text"
                      placeholder="URL"
                      value={newAttachment.url || ''}
                      onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAttachment();
                        }
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                    />
                    <input
                      type="text"
                      placeholder="Nombre (opcional)"
                      value={newAttachment.name || ''}
                      onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full sm:w-32 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddAttachment();
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="sm:hidden">Agregar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="file"
                      id="file-upload-edit"
                      accept={newAttachment.type === 'image' ? 'image/*' : '*'}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Validate file size (10MB max)
                          const maxSize = 10 * 1024 * 1024; // 10MB
                          if (file.size > maxSize) {
                            toast.error('El archivo es demasiado grande. El tamaño máximo es 10MB.');
                            e.target.value = '';
                            return;
                          }

                          try {
                            // Upload file to server (under uploads/client_id/project_id/images|files)
                            const uploadedAttachment = await api.uploadFile(file, {
                              clientId: formData.clientId || undefined,
                              projectId: formData.projectId || undefined,
                            });
                            setAttachments(prev => [...prev, uploadedAttachment]);
                            setNewAttachment({ type: 'link', url: '', name: '' });
                            toast.success('Archivo subido exitosamente');
                          } catch (error) {
                            console.error('Error uploading file:', error);
                            toast.error(error instanceof Error ? error.message : 'Error al subir el archivo');
                          } finally {
                            // Reset file input
                            e.target.value = '';
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload-edit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{newAttachment.type === 'image' ? 'Seleccionar Imagen' : 'Seleccionar Archivo'}</span>
                    </label>
                  </>
                )}
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {att.type === 'link' && <LinkIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      {att.type === 'image' && <Image className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      {att.type === 'file' && <File className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                      {att.type === 'link' ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                        >
                          {att.name || att.url}
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          className="flex-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline truncate"
                        >
                          {att.name || att.url}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                        aria-label="Eliminar adjunto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
