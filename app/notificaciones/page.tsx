'use client'

import React from 'react';
import { Bell, CheckCircle2, MessageSquare, UserPlus } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

export default function Notificaciones() {
  const notificaciones = [
    {
      id: '1',
      tipo: 'comment',
      titulo: 'Nuevo comentario',
      mensaje: 'Admin User comentó en "Implementar autenticación"',
      fecha: '2024-12-22T10:30:00',
      leida: false,
    },
    {
      id: '2',
      tipo: 'assignment',
      titulo: 'Tarea asignada',
      mensaje: 'Se te asignó la tarea "Optimizar rendimiento"',
      fecha: '2024-12-22T09:15:00',
      leida: false,
    },
    {
      id: '3',
      tipo: 'complete',
      titulo: 'Tarea completada',
      mensaje: 'Jane Smith completó "Documentación API"',
      fecha: '2024-12-21T16:45:00',
      leida: true,
    },
    {
      id: '4',
      tipo: 'user',
      titulo: 'Nuevo miembro',
      mensaje: 'Un nuevo usuario se unió al equipo',
      fecha: '2024-12-21T14:20:00',
      leida: true,
    },
  ];

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
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-gray-800 mb-2">Notificaciones</h1>
            <p className="text-gray-600">Mantente al día con las actualizaciones</p>
          </div>
          <button className="text-indigo-600 hover:text-indigo-700">
            Marcar todas como leídas
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="divide-y divide-gray-200">
            {notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notif.leida ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getIcon(notif.tipo)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-gray-800">{notif.titulo}</h3>
                      {!notif.leida && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notif.mensaje}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notif.fecha).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
