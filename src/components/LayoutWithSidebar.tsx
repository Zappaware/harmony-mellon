'use client'

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Loading } from './Loading';
import { Menu } from 'lucide-react';

// Lazy load heavy components
const Sidebar = lazy(() => import('./Sidebar').then(module => ({ default: module.Sidebar })));
const NotificationBadge = lazy(() => import('./NotificationBadge').then(module => ({ default: module.NotificationBadge })));

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    // Add a small delay to avoid race conditions
    if (!isLoading && !user) {
      const timer = setTimeout(() => {
        // Double check that user is still null after delay
        if (!user) {
          router.push('/');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  // Show loading screen while restoring session
  if (isLoading) {
    return <Loading fullScreen message="Cargando..." />;
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <Suspense fallback={<div className="w-64 bg-gray-900"></div>}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Notification Badge - Fixed top right */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50">
        <Suspense fallback={<div className="w-10 h-10 bg-white rounded-full shadow-lg"></div>}>
          <NotificationBadge />
        </Suspense>
      </div>

      <div className="flex-1 overflow-auto md:ml-0 pt-16 md:pt-0">
        <Suspense fallback={<Loading message="Cargando..." />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
