'use client'

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Loading } from './Loading';
import { Menu } from 'lucide-react';
import { Footer } from './Footer';

// Lazy load heavy components
const Sidebar = lazy(() => import('./Sidebar').then(module => ({ default: module.Sidebar })));
const NotificationBadge = lazy(() => import('./NotificationBadge').then(module => ({ default: module.NotificationBadge })));

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Initialize from localStorage immediately to prevent flash
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Sync with localStorage on changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

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
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-64 bg-gray-900"></div>}>
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
          />
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

        <div 
          className={`flex flex-col flex-1 overflow-auto pt-16 md:pt-0 transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-0' : 'md:ml-64'
          }`}
        >
          <div className="flex-1">
            <Suspense fallback={<Loading message="Cargando..." />}>
              {children}
            </Suspense>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
