'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 overflow-auto md:ml-0">
        {children}
      </div>
    </div>
  );
}
