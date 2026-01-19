'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Loading } from '@/components/Loading';
import { LogIn } from 'lucide-react';
import { isApiUrlConfigured } from '@/services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [apiConfigError, setApiConfigError] = useState('');
  const { login, user, isLoading } = useApp();
  const router = useRouter();

  // Check if API URL is configured correctly in production
  useEffect(() => {
    if (typeof window !== 'undefined' && !isApiUrlConfigured()) {
      setApiConfigError(
        '⚠️ Error de configuración: NEXT_PUBLIC_API_URL no está configurada correctamente en producción. ' +
        'Por favor, contacta al administrador del sistema.'
      );
    }
  }, []);

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

    try {
      const success = await login(email, password);
      if (success) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err: any) {
      const errorMessage = err?.message || '';
      
      // Check for connection errors (API URL misconfiguration)
      if (errorMessage.includes('ERR_CONNECTION_REFUSED') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network error') ||
          errorMessage.includes('Cannot connect to backend')) {
        setError(
          'No se puede conectar al servidor. Esto puede deberse a un error de configuración. ' +
          'Por favor, contacta al administrador del sistema.'
        );
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Login error:', err);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    // Use correct passwords for test users
    const password = userEmail === 'admin@example.com' ? 'admin123' : 'user123';
    setEmail(userEmail);
    setPassword(password);
    try {
      const success = await login(userEmail, password);
      if (success) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err: any) {
      const errorMessage = err?.message || '';
      
      // Check for connection errors (API URL misconfiguration)
      if (errorMessage.includes('ERR_CONNECTION_REFUSED') || 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('Network error') ||
          errorMessage.includes('Cannot connect to backend')) {
        setError(
          'No se puede conectar al servidor. Esto puede deberse a un error de configuración. ' +
          'Por favor, contacta al administrador del sistema.'
        );
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl text-gray-800">Harmony Mellon</h1>
          <p className="text-gray-600 mt-2">Gestiona tus proyectos eficientemente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="usuario@ejemplo.com"
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
              suppressHydrationWarning
            />
          </div>

          {apiConfigError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm mb-4">
              <p className="font-semibold mb-1">⚠️ Error de Configuración</p>
              <p>{apiConfigError}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/registro" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="mb-3">Acceso rápido (solo desarrollo):</p>
            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('admin@example.com')}
                className="w-full bg-purple-100 text-purple-700 py-2 px-4 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                🔐 Ingresar como Admin
              </button>
              <button
                onClick={() => handleQuickLogin('user@example.com')}
                className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                👤 Ingresar como Usuario
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="mb-1">Credenciales de prueba:</p>
            <p>Admin: admin@example.com / admin123</p>
            <p>Usuario: user@example.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
