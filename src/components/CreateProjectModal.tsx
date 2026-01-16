'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStartDate?: string;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess, initialStartDate }: CreateProjectModalProps) {
  const { createProject } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    progress: 0,
    status: 'planning' as string,
    startDate: initialStartDate || '',
    deadline: '',
    color: 'bg-blue-500',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update startDate when initialStartDate changes
  useEffect(() => {
    if (initialStartDate) {
      setFormData(prev => ({ ...prev, startDate: initialStartDate }));
    }
  }, [initialStartDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createProject({
        name: formData.name,
        description: formData.description || undefined,
        progress: formData.progress,
        status: formData.status,
        startDate: formData.startDate || undefined,
        deadline: formData.deadline || undefined,
        color: formData.color,
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        progress: 0,
        status: 'planning',
        startDate: initialStartDate || '',
        deadline: '',
        color: 'bg-blue-500',
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) || 0 : value,
    }));
  };

  const colorOptions = [
    { value: 'bg-blue-500', label: 'Azul', color: 'bg-blue-500' },
    { value: 'bg-purple-500', label: 'Morado', color: 'bg-purple-500' },
    { value: 'bg-green-500', label: 'Verde', color: 'bg-green-500' },
    { value: 'bg-yellow-500', label: 'Amarillo', color: 'bg-yellow-500' },
    { value: 'bg-red-500', label: 'Rojo', color: 'bg-red-500' },
    { value: 'bg-indigo-500', label: 'Índigo', color: 'bg-indigo-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Crear Nuevo Proyecto</h2>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Proyecto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Plataforma Web"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe el proyecto..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="planning">Planificación</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Finalizando">Finalizando</option>
                <option value="completed">Completado</option>
                <option value="on_hold">En Pausa</option>
              </select>
            </div>

            <div>
              <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
                Progreso (%)
              </label>
              <input
                type="number"
                id="progress"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                  className={`w-10 h-10 rounded-lg ${option.color} border-2 transition-all ${
                    formData.color === option.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  title={option.label}
                />
              ))}
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
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
