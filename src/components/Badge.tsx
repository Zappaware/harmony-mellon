import React from 'react';

interface BadgeProps {
  variant: 'status' | 'priority' | 'role' | 'custom';
  value: string;
  className?: string;
}

export function Badge({ variant, value, className = '' }: BadgeProps) {
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'todo': 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      'review': 'bg-purple-100 text-purple-700',
      'done': 'bg-green-100 text-green-700',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'low': 'bg-green-100 text-green-700',
      'medium': 'bg-yellow-100 text-yellow-700',
      'high': 'bg-red-100 text-red-700',
    };
    return priorityMap[priority] || 'bg-gray-100 text-gray-700';
  };

  const getRoleColor = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'bg-purple-100 text-purple-700',
      'team_lead': 'bg-orange-100 text-orange-700',
      'user': 'bg-blue-100 text-blue-700',
    };
    return roleMap[role] || 'bg-gray-100 text-gray-700';
  };

  const getColorClass = () => {
    switch (variant) {
      case 'status':
        return getStatusColor(value);
      case 'priority':
        return getPriorityColor(value);
      case 'role':
        return getRoleColor(value);
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisplayText = () => {
    const textMap: Record<string, string> = {
      'todo': 'Por Hacer',
      'in-progress': 'En Progreso',
      'review': 'En Revisión',
      'done': 'Completada',
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'admin': 'Administrador',
      'team_lead': 'Líder de Equipo',
      'user': 'Usuario',
    };
    return textMap[value] || value;
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs ${getColorClass()} ${className}`}
    >
      {getDisplayText()}
    </span>
  );
}
