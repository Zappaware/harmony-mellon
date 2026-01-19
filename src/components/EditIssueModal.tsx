'use client'

import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Image, File, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiAttachment } from '@/services/api';
import { Issue, useApp } from '@/context/AppContext';

interface EditIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  issue: Issue | null;
}

export function EditIssueModal({ isOpen, onClose, onSuccess, issue }: EditIssueModalProps) {
  const { users } = useApp();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
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
        startDate: issue.startDate || '',
        dueDate: issue.dueDate || '',
      });
      // Load attachments from API if available
      loadIssueDetails();
      setError(null);
    }
  }, [isOpen, issue]);

  const loadIssueDetails = async () => {
    if (!issue) return;
    try {
      const issueDetails = await api.getIssue(issue.id);
      if (issueDetails.attachments) {
        setAttachments(issueDetails.attachments);
      }
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Editar Tarea</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin asignar</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
            </div>
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
              <div className="flex gap-2">
                <select
                  value={newAttachment.type}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value as 'link' | 'image' | 'file' }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="link">Enlace</option>
                  <option value="image">Imagen</option>
                  <option value="file">Archivo</option>
                </select>
                <input
                  type="text"
                  placeholder="URL"
                  value={newAttachment.url}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Nombre (opcional)"
                  value={newAttachment.name}
                  onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((att, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {att.type === 'link' && <LinkIcon className="w-4 h-4 text-gray-500" />}
                      {att.type === 'image' && <Image className="w-4 h-4 text-gray-500" />}
                      {att.type === 'file' && <File className="w-4 h-4 text-gray-500" />}
                      <span className="flex-1 text-sm text-gray-700 truncate">
                        {att.name || att.url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
