import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message = 'Cargando...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      <p className="text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return <div className="p-8">{content}</div>;
}
