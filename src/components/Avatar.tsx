'use client';

import React, { useState } from 'react';
import { getFileDisplayUrl } from '@/services/api';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const displaySrc = getFileDisplayUrl(src);
  const showImg = displaySrc && !imgError;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name: string) => {
    const colors = [
      'bg-indigo-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-blue-600',
      'bg-green-600',
      'bg-yellow-600',
      'bg-red-600',
      'bg-teal-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (showImg) {
    return (
      <img
        src={displaySrc}
        alt={name}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ${className}`}
        width={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'sm' ? 32 : 40}
        height={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'sm' ? 32 : 40}
        loading="lazy"
        decoding="async"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getColorFromName(
        name
      )} rounded-full flex items-center justify-center text-white shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
