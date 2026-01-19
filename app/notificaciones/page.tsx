'use client'

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MessageSquare, UserPlus } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';
import { api, ApiNotification } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function Notificaciones() {
  const { user } = useApp();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait a bit to ensure user context is loaded
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || !user) {
        // Redirect to login if not authenticated
        router.push('/');
        return;
      }
      loadNotifications();
    };

    // Small delay to ensure context is loaded
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [user, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('Loading notifications, token exists:', !!token);
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        setLoading(false);
        return;
      }
      console.log('Calling api.getNotifications()...');
      const data = await api.getNotifications();
      console.log('Notifications loaded:', data.length);
      setNotificaciones(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error loading notifications:', errorMessage, err);
      if (errorMessage.includes('Authorization') || errorMessage.includes('Unauthorized')) {
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          setTimeout(() => router.push('/'), 2000);
        }
      } else {
        setError(`Error al cargar las notificaciones: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        return;
      }
      await api.markAllNotificationsAsRead();
      // Reload notifications to show updated read status
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al marcar las notificaciones como leídas: ${errorMessage}`);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setError('No estás autenticado. Por favor, inicia sesión.');
        return;
      }
      await api.markNotificationAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
      setError('Error al marcar la notificación como leída');
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'assignment':
        return <Bell className="w-5 h-5 text-yellow-600" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'status':
        return <Bell className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <div className="text-center text-gray-600">Cargando notificaciones...</div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Notificaciones</h1>
            <p className="text-sm md:text-base text-gray-600">Mantente al día con las actualizaciones</p>
          </div>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm md:text-base text-indigo-600 hover:text-indigo-700 whitespace-nowrap flex-shrink-0 mr-16 md:mr-20"
          >
            Marcar todas como leídas
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {notificaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-gray-800">{notif.title}</h3>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        <DateDisplay date={notif.created_at} format="datetime" />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
