'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserPlus, LogIn, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { Loading } from '@/components/Loading';

export default function Registro() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    // Validaciones
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 relative z-0"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 relative z-0"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 relative z-0"
                required
                minLength={6}
                suppressHydrationWarning
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 relative z-0"
                required
                minLength={6}
                suppressHydrationWarning
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
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
