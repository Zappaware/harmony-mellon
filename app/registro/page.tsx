'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserPlus, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/Loading';

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

export default function Registro() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordRules, setPasswordRules] = useState<PasswordRules>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const { user, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading screen while checking session
  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'user', // Todos los registros públicos son usuarios normales
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al registrar usuario');
      }

      const data = await response.json();
      
      // Guardar token y redirigir
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token);
      }

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setError('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-600 mt-2">Únete a Mellon Harmony</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          <div>
            <label htmlFor="name" className="block text-sm text-gray-700 mb-2">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRules(true)}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formData.password && !isPasswordValid(passwordRules)
                    ? 'border-red-300 focus:ring-red-500'
                    : formData.password && isPasswordValid(passwordRules)
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                required
                minLength={8}
                suppressHydrationWarning
              />
            </div>
            
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
            <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : formData.confirmPassword && formData.password === formData.confirmPassword && isPasswordValid(passwordRules)
                    ? 'border-green-300 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                }`}
                required
                minLength={8}
                suppressHydrationWarning
              />
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && isPasswordValid(passwordRules) && (
              <p className="text-xs text-green-600 mt-1">✓ Las contraseñas coinciden</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid(passwordRules) || formData.password !== formData.confirmPassword}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            Al registrarte, recibirás un email de bienvenida en tu correo electrónico
          </p>
        </div>
      </div>
    </div>
  );
}
