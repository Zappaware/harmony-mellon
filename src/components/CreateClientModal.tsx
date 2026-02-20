'use client'

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return EMAIL_REGEX.test(value.trim());
}
function isValidPhone(value: string): boolean {
  if (!value.trim()) return true;
  const digits = value.replace(/\D/g, '');
  return digits.length <= 10 && digits.length >= 1;
}

export interface ApiClientForModal {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  clientToEdit?: ApiClientForModal | null;
}

export function CreateClientModal({ isOpen, onClose, onSuccess, clientToEdit }: CreateClientModalProps) {
  const isEditMode = Boolean(clientToEdit);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && clientToEdit) {
      setFormData({
        name: clientToEdit.name,
        description: clientToEdit.description || '',
        email: clientToEdit.email || '',
        phone: clientToEdit.phone || '',
        address: clientToEdit.address || '',
        contactName: clientToEdit.contact_name || '',
        contactEmail: clientToEdit.contact_email || '',
        contactPhone: clientToEdit.contact_phone || '',
      });
    } else if (isOpen && !clientToEdit) {
      setFormData({
        name: '',
        description: '',
        email: '',
        phone: '',
        address: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
      });
    }
  }, [isOpen, clientToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditMode && clientToEdit) {
        await api.updateClient(clientToEdit.id, {
          name: formData.name,
          description: formData.description || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          contact_name: formData.contactName || undefined,
          contact_email: formData.contactEmail || undefined,
          contact_phone: formData.contactPhone || undefined,
        });
        toast.success('Cliente actualizado', {
          description: `"${formData.name}" ha sido actualizado.`,
        });
      } else {
        await api.createClient({
        name: formData.name,
        description: formData.description || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        contact_name: formData.contactName || undefined,
        contact_email: formData.contactEmail || undefined,
        contact_phone: formData.contactPhone || undefined,
      });
        toast.success('Cliente creado exitosamente', {
          description: `El cliente "${formData.name}" ha sido creado.`,
        });
      }

      if (!isEditMode) {
        setFormData({
          name: '',
          description: '',
          email: '',
          phone: '',
          address: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
        });
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (isEditMode ? 'Error al actualizar el cliente' : 'Error al crear el cliente');
      setError(errorMessage);
      toast.error(isEditMode ? 'Error al actualizar el cliente' : 'Error al crear el cliente', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const emailValid = isValidEmail(formData.email);
  const phoneValid = isValidPhone(formData.phone);
  const contactEmailValid = isValidEmail(formData.contactEmail);
  const contactPhoneValid = isValidPhone(formData.contactPhone);
  const isClientFormValid =
    formData.name.trim() !== '' &&
    emailValid &&
    phoneValid &&
    contactEmailValid &&
    contactPhoneValid;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">{isEditMode ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</h2>
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
              Nombre del Cliente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Empresa ABC"
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
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe el cliente..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de la Empresa
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!emailValid ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="empresa@ejemplo.com"
              />
              {!emailValid && formData.email.trim() && (
                <p className="text-red-500 text-xs mt-1">Formato de email no válido</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono de la Empresa (solo números, máx. 10)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!phoneValid ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="1234567890"
              />
              {!phoneValid && formData.phone.trim() && (
                <p className="text-red-500 text-xs mt-1">Solo números, máximo 10 dígitos</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Dirección completa de la empresa..."
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Persona de Contacto</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Contacto
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Contacto
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!contactEmailValid ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="contacto@ejemplo.com"
                  />
                  {!contactEmailValid && formData.contactEmail.trim() && (
                    <p className="text-red-500 text-xs mt-1">Formato de email no válido</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono del Contacto (solo números, máx. 10)
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!contactPhoneValid ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="1234567890"
                  />
                  {!contactPhoneValid && formData.contactPhone.trim() && (
                    <p className="text-red-500 text-xs mt-1">Solo números, máximo 10 dígitos</p>
                  )}
                </div>
              </div>
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
              disabled={isSubmitting || !isClientFormValid}
            >
              {isSubmitting ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar cambios' : 'Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
