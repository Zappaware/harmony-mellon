import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  className?: string;
}

export function Avatar({ name, size = 'md', src, className = '' }: AvatarProps) {
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

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getColorFromName(
        name
      )} rounded-full flex items-center justify-center text-white ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
