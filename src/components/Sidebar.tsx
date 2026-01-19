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
  LogOut,
  X,
  UserCircle,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    onClose?.();
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
    { to: '/mis-tareas', icon: CheckSquare, label: 'Mis Tareas' },
    { to: '/calendario', icon: Calendar, label: 'Calendario' },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
    { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
    { to: '/perfil', icon: Users, label: 'Mi Perfil' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: BarChart3, label: 'Métricas' },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
    { to: '/kanban', icon: FolderKanban, label: 'Kanban' },
    { to: '/calendario', icon: Calendar, label: 'Calendario' },
    { to: '/usuarios', icon: Users, label: 'Equipo' },
    { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
    { to: '/perfil', icon: UserCircle, label: 'Mi Perfil' },
  ];

  const teamLeadLinks = [
    { to: '/dashboard', icon: BarChart3, label: 'Métricas' },
    { to: '/proyectos', icon: FolderKanban, label: 'Proyectos' },
    { to: '/kanban', icon: FolderKanban, label: 'Kanban' },
    { to: '/calendario', icon: Calendar, label: 'Calendario' },
    { to: '/notificaciones', icon: Bell, label: 'Notificaciones' },
    { to: '/configuracion', icon: Settings, label: 'Configuración' },
    { to: '/perfil', icon: UserCircle, label: 'Mi Perfil' },
  ];

  // Determine which links to show based on user role
  const links = user?.role === 'admin' 
    ? adminLinks 
    : user?.role === 'team_lead' 
    ? teamLeadLinks 
    : userLinks;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl">Harmony Mellon</h2>
          <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
          <p className="text-xs text-gray-500">
            {user?.role === 'admin' ? 'Administrador' : 
             user?.role === 'team_lead' ? 'Líder de Equipo' : 
             'Usuario'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.to;
            
            return (
              <li key={link.to}>
                <Link
                  href={link.to}
                  onClick={handleLinkClick}
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
    </>
  );

  return (
    <>
      {/* Desktop: Always visible */}
      <div className="hidden md:flex w-64 bg-gray-900 text-white h-screen flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
