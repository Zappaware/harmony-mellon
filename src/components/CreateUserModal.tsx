'use client'

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Password validation rules
interface PasswordRules {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const validatePassword = (password: string): PasswordRules => {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
};

const isPasswordValid = (rules: PasswordRules): boolean => {
  return Object.values(rules).every(rule => rule === true);
};

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { createUser } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'admin',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordRules, setPasswordRules] = useState<PasswordRules>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar contraseña según las reglas
    const rules = validatePassword(formData.password);
    if (!isPasswordValid(rules)) {
      setError('La contraseña no cumple con todos los requisitos. Por favor, revisa las reglas de contraseña.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      setPasswordRules({
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
      setShowPasswordRules(false);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Actualizar reglas de contraseña en tiempo real
    if (name === 'password') {
      const rules = validatePassword(value);
      setPasswordRules(rules);
      setShowPasswordRules(value.length > 0);
      // Limpiar error si la contraseña es válida
      if (isPasswordValid(rules) && formData.confirmPassword && value === formData.confirmPassword) {
        setError(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">Agregar Nuevo Usuario</h2>
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
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="usuario@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setShowPasswordRules(true)}
              required
              minLength={8}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formData.password && !isPasswordValid(passwordRules)
                  ? 'border-red-300 focus:ring-red-500'
                  : formData.password && isPasswordValid(passwordRules)
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Mínimo 8 caracteres"
            />
            
            {showPasswordRules && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Requisitos de contraseña:</p>
                <ul className="space-y-1 text-xs">
                  <li className={`flex items-center ${passwordRules.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordRules.minLength ? '✓' : '○'}</span>
                    <span>Mínimo 8 caracteres</span>
                  </li>
                  <li className={`flex items-center ${passwordRules.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordRules.hasUpperCase ? '✓' : '○'}</span>
                    <span>Al menos una letra mayúscula</span>
                  </li>
                  <li className={`flex items-center ${passwordRules.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordRules.hasLowerCase ? '✓' : '○'}</span>
                    <span>Al menos una letra minúscula</span>
                  </li>
                  <li className={`flex items-center ${passwordRules.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordRules.hasNumber ? '✓' : '○'}</span>
                    <span>Al menos un número</span>
                  </li>
                  <li className={`flex items-center ${passwordRules.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordRules.hasSpecialChar ? '✓' : '○'}</span>
                    <span>Al menos un carácter especial (!@#$%^&*...)</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : formData.confirmPassword && formData.password === formData.confirmPassword && isPasswordValid(passwordRules)
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-indigo-500'
              }`}
              placeholder="Repite la contraseña"
            />
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && isPasswordValid(passwordRules) && (
              <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los administradores tienen acceso completo al sistema
            </p>
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
              disabled={isSubmitting || !isPasswordValid(passwordRules) || formData.password !== formData.confirmPassword}
            >
              {isSubmitting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
