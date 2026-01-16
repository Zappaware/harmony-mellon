'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, subtitle, showBack, action }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 md:mb-8">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-3 md:mb-4 transition-colors text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span>Volver</span>
        </button>
      )}
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl text-gray-800 mb-1 md:mb-2 pr-12 md:pr-16">{title}</h1>
          {subtitle && <p className="text-sm md:text-base text-gray-600">{subtitle}</p>}
        </div>
        
        {action && (
          <button
            onClick={action.onClick}
            className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base w-full md:w-auto flex-shrink-0 mr-16 md:mr-20"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
