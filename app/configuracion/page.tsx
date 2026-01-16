'use client'

import React from 'react';
import { Settings, Tag, AlertTriangle, Sliders } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

export default function Configuracion() {
  const estados = [
    { id: 1, nombre: 'Por Hacer', color: '#6b7280', activo: true },
    { id: 2, nombre: 'En Progreso', color: '#3b82f6', activo: true },
    { id: 3, nombre: 'En Revisión', color: '#a855f7', activo: true },
    { id: 4, nombre: 'Completada', color: '#22c55e', activo: true },
  ];

  const prioridades = [
    { id: 1, nombre: 'Baja', color: '#10b981', activo: true },
    { id: 2, nombre: 'Media', color: '#f59e0b', activo: true },
    { id: 3, nombre: 'Alta', color: '#ef4444', activo: true },
  ];

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Configuración</h1>
          <p className="text-sm md:text-base text-gray-600">Gestiona los parámetros del sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center gap-2">
              <Tag className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl text-gray-800">Estados</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-4">
                {estados.map((estado) => (
                  <div
                    key={estado.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: estado.color }}
                      />
                      <span className="text-gray-800">{estado.nombre}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={estado.activo}
                        readOnly
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Agregar Estado
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl text-gray-800">Prioridades</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-4">
                {prioridades.map((prioridad) => (
                  <div
                    key={prioridad.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: prioridad.color }}
                      />
                      <span className="text-gray-800">{prioridad.nombre}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={prioridad.activo}
                        readOnly
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Agregar Prioridad
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow lg:col-span-2">
            <div className="p-6 border-b border-gray-200 flex items-center gap-2">
              <Sliders className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl text-gray-800">Parámetros Generales</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Nombre de la Organización
                  </label>
                  <input
                    type="text"
                    defaultValue="Mi Empresa S.A."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    defaultValue="contacto@empresa.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>UTC-3 (Buenos Aires)</option>
                    <option>UTC-5 (Lima)</option>
                    <option>UTC+1 (Madrid)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Español</option>
                    <option>English</option>
                    <option>Português</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
