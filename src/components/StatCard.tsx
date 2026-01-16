import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl text-gray-800">{value}</span>
      </div>
      <p className="text-gray-600">{label}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}
