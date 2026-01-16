'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  Bell, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
    { to: '/mis-tareas', icon: CheckSquare, label: 'Mis Tareas' },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
    { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: BarChart3, label: 'Métricas' },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
    { to: '/kanban', icon: FolderKanban, label: 'Kanban' },
    { to: '/usuarios', icon: Users, label: 'Equipo' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl">Issue Tracker</h2>
        <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
        <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.to;
            
            return (
              <li key={link.to}>
                <Link
                  href={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
