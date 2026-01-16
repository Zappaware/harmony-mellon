'use client'

import React from 'react';
import { FolderKanban, Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';

export default function Proyectos() {
  const proyectos = [
    {
      id: '1',
      nombre: 'Plataforma Web',
      descripcion: 'Desarrollo de nueva plataforma web corporativa con dashboard interactivo',
      progreso: 65,
      miembros: 5,
      fechaLimite: '2025-01-15',
      estado: 'En Progreso',
      color: 'bg-blue-500',
    },
    {
      id: '2',
      nombre: 'App Móvil',
      descripcion: 'Aplicación móvil multiplataforma para iOS y Android',
      progreso: 30,
      miembros: 3,
      fechaLimite: '2025-02-20',
      estado: 'En Progreso',
      color: 'bg-purple-500',
    },
    {
      id: '3',
      nombre: 'Sistema de Reportes',
      descripcion: 'Dashboard analítico empresarial con métricas en tiempo real',
      progreso: 90,
      miembros: 4,
      fechaLimite: '2024-12-30',
      estado: 'Finalizando',
      color: 'bg-green-500',
    },
    {
      id: '4',
      nombre: 'API REST',
      descripcion: 'Backend escalable con microservicios',
      progreso: 45,
      miembros: 6,
      fechaLimite: '2025-01-30',
      estado: 'En Progreso',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Proyectos"
          subtitle="Gestiona todos tus proyectos activos"
          action={{
            label: 'Nuevo Proyecto',
            onClick: () => alert('Crear nuevo proyecto'),
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Proyectos</span>
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl text-gray-800">{proyectos.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">En Progreso</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl text-gray-800">
              {proyectos.filter(p => p.estado === 'En Progreso').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Progreso Promedio</span>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <p className="text-3xl text-gray-800">
              {Math.round(proyectos.reduce((sum, p) => sum + p.progreso, 0) / proyectos.length)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {proyectos.map((proyecto) => (
            <Link
              key={proyecto.id}
              href="/kanban"
              className="bg-white rounded-lg shadow hover:shadow-lg transition-all p-6 block group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${proyecto.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <FolderKanban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-800 group-hover:text-indigo-600 transition-colors">
                      {proyecto.nombre}
                    </h3>
                    <span className="text-xs text-gray-500">{proyecto.estado}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{proyecto.descripcion}</p>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progreso</span>
                  <span className="font-medium">{proyecto.progreso}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${proyecto.progreso}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{proyecto.miembros} miembros</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <DateDisplay date={proyecto.fechaLimite} format="date" />
                </div>
              </div>
            </Link>
          ))}
          
          <button
            onClick={() => alert('Crear nuevo proyecto')}
            className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-100 hover:border-indigo-400 transition-all flex flex-col items-center justify-center min-h-[280px] group"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
              <Plus className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-gray-600 group-hover:text-gray-800">Crear Nuevo Proyecto</p>
          </button>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
