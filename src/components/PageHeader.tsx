'use client'

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NotificationBadge } from './NotificationBadge';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Custom content for the left side (e.g. title + search + buttons). When provided, title/subtitle/action are ignored. */
  children?: React.ReactNode;
  /** Optional extra controls rendered to the right of the header (before the bell). */
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, subtitle, showBack, action, children, rightContent }: PageHeaderProps) {
  const router = useRouter();
  const hasTitle = title != null && title !== '';

  return (
    <header className="sticky top-0 z-40 mb-6 md:mb-8">
      <div className="bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm md:text-base self-start md:self-auto"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span>Volver</span>
            </button>
          )}

          {children !== undefined ? (
            children
          ) : (
            <>
              <div className="flex-1 min-w-0">
                {hasTitle && (
                  <h1 className="text-xl md:text-3xl text-gray-800 leading-tight truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base text-gray-600 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              {action && (
                <button
                  type="button"
                  onClick={action.onClick}
                  className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base w-full md:w-auto shrink-0"
                >
                  {action.label}
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {rightContent}
          <Suspense fallback={<div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />}>
            <NotificationBadge />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
