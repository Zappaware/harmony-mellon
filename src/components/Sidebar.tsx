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
  Calendar,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface SidebarProps {
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
  readonly collapsed?: boolean;
  readonly onToggle?: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed = false, onToggle }: SidebarProps) {
  const { user, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
    onClose?.();
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile (overlay mode) - onClose is only defined for mobile
    // On desktop/tablet, onClose is undefined, so this does nothing
    onClose?.();
  };

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
    { to: '/mis-tareas', icon: CheckSquare, label: 'Mis Tareas' },
    { to: '/kanban', icon: FolderKanban, label: 'Kanban' },
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

  // Get role label
  const getRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrador';
    if (user?.role === 'team_lead') return 'Líder';
    return 'Usuario';
  };

  // Determine which links to show based on user role
  const links = user?.role === 'admin' 
    ? adminLinks 
    : user?.role === 'team_lead' 
    ? teamLeadLinks 
    : userLinks;

  // Mobile should always show full content - collapsed state only applies to desktop/tablet
  // We check if we're in mobile by checking if the sidebar is in overlay mode (isOpen is used)
  // For desktop, collapsed can be true/false, but for mobile it should always be false
  // Since mobile uses a separate div with md:hidden, we can use CSS to ensure it always shows full content
  // But to be safe, we'll check: if onClose exists but we're not in desktop view, don't collapse
  const shouldCollapse = collapsed; // Will be overridden by CSS classes for mobile

  const sidebarContent = (
    <>
      <div className={`border-b border-gray-800 flex items-center justify-between transition-all duration-300 ${
        shouldCollapse ? 'p-4' : 'p-6'
      }`}>
        {!shouldCollapse ? (
          <div className="flex-1">
            <h2 className="text-xl">Harmony Mellon</h2>
            <p className="text-sm font-bold text-white mt-1">{user?.name}</p>
            <p className="text-xs text-gray-400">
              {getRoleLabel()}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <h2 className="text-lg font-bold">HM</h2>
          </div>
        )}
        <div className="flex items-center gap-2">
          {onToggle && !shouldCollapse && (
            <button
              onClick={onToggle}
              className="hidden md:flex text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-gray-800"
              aria-label="Colapsar menú"
            >
              <PanelLeftClose className="w-6 h-6" />
            </button>
          )}
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
      </div>

      <nav className={`flex-1 overflow-y-auto transition-all duration-300 ${
        shouldCollapse ? 'p-2' : 'p-4'
      }`}>
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.to;
            
            return (
              <li key={link.to}>
                <Link
                  href={link.to}
                  onClick={handleLinkClick}
                  className={`flex items-center rounded-lg transition-colors ${
                    shouldCollapse 
                      ? 'justify-center px-3 py-3' 
                      : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  title={shouldCollapse ? link.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!shouldCollapse && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`border-t border-gray-800 transition-all duration-300 ${
        shouldCollapse ? 'p-2 space-y-2' : 'p-4'
      }`}>
        {onToggle && shouldCollapse && (
          <button
            onClick={onToggle}
            className="hidden md:flex w-full justify-center items-center text-gray-400 hover:text-white transition-colors p-3 rounded-lg hover:bg-gray-800"
            aria-label="Expandir menú"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-lg text-gray-300 hover:bg-gray-800 transition-colors w-full ${
            shouldCollapse 
              ? 'justify-center px-3 py-3' 
              : 'gap-3 px-4 py-3'
          }`}
          title={shouldCollapse ? 'Cerrar Sesión' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!shouldCollapse && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: Collapsible */}
      <div 
        className={`hidden md:flex bg-gray-900 text-white h-screen flex-col transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
        style={{ width: collapsed ? '4rem' : '16rem' }}
      >
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
      
      {/* Mobile Sidebar - Always shows full content, ignores collapsed state */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile content - always full, override collapsed styles */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl">Harmony Mellon</h2>
              <p className="text-sm font-bold text-white mt-1">{user?.name}</p>
              <p className="text-xs text-gray-400">
                {getRoleLabel()}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
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
                      <Icon className="w-5 h-5 shrink-0" />
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
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
