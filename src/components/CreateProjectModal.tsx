'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp } from '@/context/AppContext';
import { api, ApiClient } from '@/services/api';
import { getCustomProjectTypes, setCustomProjectTypes } from '@/lib/projectTypes';

const OTHER_TYPE_VALUE = '__other__';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStartDate?: string;
  initialClientId?: string;
  initialType?: string;
  initialName?: string;
  initialPlanningMonth?: number;
  initialPlanningYear?: number;
  projectTypes?: string[];
  allowOtherType?: boolean;
  projectToEdit?: {
    id: string;
    name: string;
    description?: string;
    type?: string;
    status?: string;
    client_id?: string;
    start_date?: string;
    deadline?: string;
    color?: string;
    planning_month?: number;
    planning_year?: number;
  };
}

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

const DEFAULT_TYPES = ['Campaña', 'Planner', 'Branding'];

/** Planner, Branding, Campaña can only be created via section buttons on client profile. */
const RESERVED_PROJECT_TYPES = ['Planner', 'Branding', 'Campaña'] as const;

function containsReservedTypeWord(text: string): string | null {
  const lower = (text || '').toLowerCase();
  for (const word of RESERVED_PROJECT_TYPES) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return null;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess, initialStartDate, initialClientId, initialType, initialName, initialPlanningMonth, initialPlanningYear, projectTypes: projectTypesProp, allowOtherType, projectToEdit }: CreateProjectModalProps) {
  const { createProject, updateProject } = useApp();
  const isEditMode = !!projectToEdit;
  const currentYear = new Date().getFullYear();
  const typeOptions = projectTypesProp ?? DEFAULT_TYPES;
  const defaultType = allowOtherType && (projectTypesProp?.length === 0) ? OTHER_TYPE_VALUE : (initialType ?? 'Campaña');
  const [formData, setFormData] = useState({
    name: initialName ?? '',
    description: '',
    type: defaultType,
    status: 'planning' as string,
    clientId: initialClientId || '',
    startDate: initialStartDate || '',
    deadline: '',
    color: 'bg-blue-500',
    planningMonth: initialPlanningMonth != null ? String(initialPlanningMonth) : '',
    planningYear: initialPlanningYear != null ? String(initialPlanningYear) : '',
  });
  const [otherTypeName, setOtherTypeName] = useState('');
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservedTypeErrorMsg, setReservedTypeErrorMsg] = useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = useState(false);

  // Update startDate when initialStartDate changes
  useEffect(() => {
    if (initialStartDate) {
      setFormData(prev => ({ ...prev, startDate: initialStartDate }));
    }
  }, [initialStartDate]);

  // When modal opens with initial client/type/name/planning (e.g. from client detail section +), prefill
  useEffect(() => {
    if (isOpen && (initialClientId || initialType || initialName != null || initialPlanningMonth != null || initialPlanningYear != null)) {
      setFormData(prev => ({
        ...prev,
        ...(initialClientId && { clientId: initialClientId }),
        ...(initialType && { type: initialType }),
        ...(initialName != null && initialName !== '' && { name: initialName }),
        ...(initialPlanningMonth != null && { planningMonth: String(initialPlanningMonth) }),
        ...(initialPlanningYear != null && { planningYear: String(initialPlanningYear) }),
      }));
    }
  }, [isOpen, initialClientId, initialType, initialName, initialPlanningMonth, initialPlanningYear]);
  const effectiveType = formData.type === OTHER_TYPE_VALUE ? otherTypeName.trim() : formData.type;

  // Reset field errors when modal opens
  useEffect(() => {
    if (isOpen) setShowFieldErrors(false);
  }, [isOpen]);

  // Load clients when modal opens and populate form if editing
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      // Load clients
      setIsLoadingClients(true);
      try {
        const apiClients = await api.getClients();
        setClients(apiClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoadingClients(false);
      }

      // Populate form if editing
      if (projectToEdit) {
        // Fetch full project data to get client_id
        try {
          const fullProject = await api.getProject(projectToEdit.id);
          const startDate = fullProject.start_date ? fullProject.start_date.split('T')[0] : (initialStartDate || '');
          const deadline = fullProject.deadline ? fullProject.deadline.split('T')[0] : '';
          const projectType = fullProject.type || 'Campaña';
          const opts = projectTypesProp ?? DEFAULT_TYPES;
          const isCustomType = allowOtherType && projectType && !opts.includes(projectType);
          setFormData({
            name: fullProject.name,
            description: fullProject.description || '',
            type: isCustomType ? OTHER_TYPE_VALUE : projectType,
            status: fullProject.status || 'planning',
            clientId: fullProject.client_id || '',
            startDate,
            deadline,
            color: fullProject.color || 'bg-blue-500',
            planningMonth: fullProject.planning_month != null ? String(fullProject.planning_month) : '',
            planningYear: fullProject.planning_year != null ? String(fullProject.planning_year) : '',
          });
          setOtherTypeName(isCustomType ? projectType : '');
        } catch (error) {
          console.error('Error loading project data:', error);
          // Fallback to provided data
          const startDate = projectToEdit.start_date ? projectToEdit.start_date.split('T')[0] : (initialStartDate || '');
          const deadline = projectToEdit.deadline ? projectToEdit.deadline.split('T')[0] : '';
          setFormData({
            name: projectToEdit.name,
            description: projectToEdit.description || '',
            type: projectToEdit.type || 'Campaña',
            status: projectToEdit.status || 'planning',
            clientId: projectToEdit.client_id || '',
            startDate,
            deadline,
            color: projectToEdit.color || 'bg-blue-500',
            planningMonth: projectToEdit.planning_month != null ? String(projectToEdit.planning_month) : '',
            planningYear: projectToEdit.planning_year != null ? String(projectToEdit.planning_year) : '',
          });
        }
      } else {
        // Reset form for new project (use initial* when opening from client section +)
        const defaultTypeForNew = allowOtherType && (projectTypesProp?.length === 0) ? OTHER_TYPE_VALUE : (initialType ?? 'Campaña');
        setFormData({
          name: initialName ?? '',
          description: '',
          type: defaultTypeForNew,
          status: 'planning',
          clientId: initialClientId || '',
          startDate: initialStartDate || '',
          deadline: '',
          color: 'bg-blue-500',
          planningMonth: initialPlanningMonth != null ? String(initialPlanningMonth) : '',
          planningYear: initialPlanningYear != null ? String(initialPlanningYear) : String(currentYear),
        });
      }
    };

    loadData();
  }, [isOpen, projectToEdit, initialStartDate, currentYear, initialClientId, initialType, initialName, initialPlanningMonth, initialPlanningYear, allowOtherType, projectTypesProp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProjectFormValid) {
      setShowFieldErrors(true);
      return;
    }
    setShowFieldErrors(false);
    setError(null);
    setIsSubmitting(true);

    try {
      const typeToUse = effectiveType || formData.type;
      const isCustomizedProject = !RESERVED_PROJECT_TYPES.includes(typeToUse as (typeof RESERVED_PROJECT_TYPES)[number]);

      if (isCustomizedProject) {
        const inTitle = containsReservedTypeWord(formData.name);
        const inDesc = containsReservedTypeWord(formData.description || '');
        if (inTitle || inDesc) {
          setIsSubmitting(false);
          const msg = 'Los proyectos personalizados no pueden contener Planner, Branding o Campaña en el título o descripción. Planner, Branding y Campaña solo pueden crearse desde los botones de la página del perfil del cliente.';
          setReservedTypeErrorMsg(msg);
          return;
        }
      }

      if (isEditMode && projectToEdit) {
        // Update existing project
        await updateProject(projectToEdit.id, {
          name: formData.name,
          description: formData.description || undefined,
          type: effectiveType || formData.type,
          status: formData.status,
          client_id: formData.clientId || undefined,
          startDate: formData.startDate || undefined,
          deadline: formData.deadline || undefined,
          color: formData.color,
          planning_month: formData.planningMonth ? Number.parseInt(formData.planningMonth, 10) : undefined,
          planning_year: formData.planningYear ? Number.parseInt(formData.planningYear, 10) : undefined,
        });

        toast.success('Proyecto actualizado exitosamente', {
          description: `El proyecto "${formData.name}" ha sido actualizado.`,
        });
      } else {
        // Create new project
        if (formData.type === OTHER_TYPE_VALUE && otherTypeName.trim() && !getCustomProjectTypes().includes(otherTypeName.trim())) {
          setCustomProjectTypes([...getCustomProjectTypes(), otherTypeName.trim()]);
        }
        await createProject({
          name: formData.name,
          description: formData.description || undefined,
          type: typeToUse,
          status: formData.status,
          client_id: formData.clientId || undefined,
          startDate: formData.startDate || undefined,
          deadline: formData.deadline || undefined,
          color: formData.color,
          planning_month: formData.planningMonth ? Number.parseInt(formData.planningMonth, 10) : undefined,
          planning_year: formData.planningYear ? Number.parseInt(formData.planningYear, 10) : undefined,
        });

        toast.success('Proyecto creado exitosamente', {
          description: `El proyecto "${formData.name}" ha sido creado.`,
        });

        // Reset form only for new projects
        setOtherTypeName('');
        setFormData({
          name: '',
          description: '',
          type: 'Campaña',
          status: 'planning',
          clientId: '',
          startDate: initialStartDate || '',
          deadline: '',
          color: 'bg-blue-500',
          planningMonth: '',
          planningYear: String(currentYear),
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      const defaultError = isEditMode ? 'Error al actualizar el proyecto' : 'Error al crear el proyecto';
      const errorMessage = err instanceof Error ? err.message : defaultError;
      setError(errorMessage);
      toast.error(defaultError, {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildTitleFromPlanning = (clientName: string, typeLabel: string, month: string, year: string) => {
    const monthLabel = month ? (MONTHS.find((m) => String(m.value) === month)?.label ?? month) : 'Sin especificar';
    const yearLabel = year || 'Sin especificar';
    return `${typeLabel} - ${clientName} - ${monthLabel} ${yearLabel}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'planningMonth' || name === 'planningYear' || name === 'type') {
        const client = clients.find((c) => c.id === prev.clientId);
        const typeLabel = next.type === OTHER_TYPE_VALUE ? otherTypeName.trim() || 'Otro' : next.type;
        if (client?.name && typeLabel) {
          next.name = buildTitleFromPlanning(client.name, typeLabel, next.planningMonth, next.planningYear);
        }
      }
      return next;
    });
  };

  const isProjectFormValid = formData.name.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.type !== '' &&
    (formData.type !== OTHER_TYPE_VALUE || otherTypeName.trim() !== '') &&
    formData.planningMonth !== '' &&
    formData.planningYear !== '' &&
    formData.clientId !== '' &&
    formData.startDate !== '' &&
    formData.deadline !== '';

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
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
          </h2>
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.name.trim() ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="Ej: Plataforma Web"
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
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none ${showFieldErrors && !formData.description.trim() ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              placeholder="Describe el proyecto..."
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Proyecto <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && (!formData.type || (formData.type === OTHER_TYPE_VALUE && !otherTypeName.trim())) ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              {allowOtherType && (
                <option value={OTHER_TYPE_VALUE}>Otro (personalizado)</option>
              )}
            </select>
            {formData.type === OTHER_TYPE_VALUE && (
              <div className="mt-2">
                <label htmlFor="otherTypeName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del tipo
                </label>
                <input
                  id="otherTypeName"
                  type="text"
                  value={otherTypeName}
                  onChange={(e) => setOtherTypeName(e.target.value)}
                  placeholder="Ej: Eventos, Consultoría"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && formData.type === OTHER_TYPE_VALUE && !otherTypeName.trim() ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="planningMonth" className="block text-sm font-medium text-gray-700 mb-2">
                Mes del plan <span className="text-red-500">*</span>
              </label>
              <select
                id="planningMonth"
                name="planningMonth"
                value={formData.planningMonth}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.planningMonth ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              >
                <option value="">Seleccionar mes</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="planningYear" className="block text-sm font-medium text-gray-700 mb-2">
                Año del plan <span className="text-red-500">*</span>
              </label>
              <select
                id="planningYear"
                name="planningYear"
                value={formData.planningYear}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.planningYear ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              >
                <option value="">Seleccionar año</option>
                {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado <span className="text-red-500">*</span>
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
              <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.clientId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                disabled={isLoadingClients}
              >
                <option value="">Sin cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {isLoadingClients && (
                <p className="text-xs text-gray-500 mt-1">Cargando clientes...</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Límite <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${showFieldErrors && !formData.deadline ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'}`}
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
              {(() => {
                if (isSubmitting) {
                  return isEditMode ? 'Actualizando...' : 'Creando...';
                }
                return isEditMode ? 'Actualizar Proyecto' : 'Crear Proyecto';
              })()}
            </button>
          </div>
        </form>
      </div>

      <AlertDialog open={reservedTypeErrorMsg !== null} onOpenChange={(open) => !open && setReservedTypeErrorMsg(null)}>
        <AlertDialogContent className="bg-red-600 border-red-600 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Solo proyectos personalizados</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              {reservedTypeErrorMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setReservedTypeErrorMsg(null)}
              className="bg-white text-red-600 hover:bg-gray-100"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
