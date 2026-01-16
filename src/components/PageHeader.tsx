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
    <div className="mb-8">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
      )}
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-gray-800 mb-2">{title}</h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>
        
        {action && (
          <button
            onClick={action.onClick}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
