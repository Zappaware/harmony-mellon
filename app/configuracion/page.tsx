'use client'

import React, { useState } from 'react';
import { Tag, AlertTriangle, Sliders, Plus } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Estado {
  id: number;
  nombre: string;
  color: string;
  activo: boolean;
}

interface Prioridad {
  id: number;
  nombre: string;
  color: string;
  activo: boolean;
}

export default function Configuracion() {
  const [estados, setEstados] = useState<Estado[]>([
    { id: 1, nombre: 'Por Hacer', color: '#6b7280', activo: true },
    { id: 2, nombre: 'En Progreso', color: '#3b82f6', activo: true },
    { id: 3, nombre: 'En Revisión', color: '#a855f7', activo: true },
    { id: 4, nombre: 'Completada', color: '#22c55e', activo: true },
  ]);

  const [prioridades, setPrioridades] = useState<Prioridad[]>([
    { id: 1, nombre: 'Baja', color: '#10b981', activo: true },
    { id: 2, nombre: 'Media', color: '#f59e0b', activo: true },
    { id: 3, nombre: 'Alta', color: '#ef4444', activo: true },
  ]);

  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showPrioridadModal, setShowPrioridadModal] = useState(false);
  const [newEstado, setNewEstado] = useState({ nombre: '', color: '#6b7280' });
  const [newPrioridad, setNewPrioridad] = useState({ nombre: '', color: '#10b981' });

  const handleAddEstado = () => {
    if (newEstado.nombre.trim()) {
      const nuevoEstado: Estado = {
        id: Math.max(...estados.map(e => e.id)) + 1,
        nombre: newEstado.nombre.trim(),
        color: newEstado.color,
        activo: true,
      };
      setEstados([...estados, nuevoEstado]);
      setNewEstado({ nombre: '', color: '#6b7280' });
      setShowEstadoModal(false);
    }
  };

  const handleAddPrioridad = () => {
    if (newPrioridad.nombre.trim()) {
      const nuevaPrioridad: Prioridad = {
        id: Math.max(...prioridades.map(p => p.id)) + 1,
        nombre: newPrioridad.nombre.trim(),
        color: newPrioridad.color,
        activo: true,
      };
      setPrioridades([...prioridades, nuevaPrioridad]);
      setNewPrioridad({ nombre: '', color: '#10b981' });
      setShowPrioridadModal(false);
    }
  };

  const toggleEstado = (id: number) => {
    setEstados(estados.map(e => e.id === id ? { ...e, activo: !e.activo } : e));
  };

  const togglePrioridad = (id: number) => {
    setPrioridades(prioridades.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
  };

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
                        onChange={() => toggleEstado(estado.id)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowEstadoModal(true)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
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
                        onChange={() => togglePrioridad(prioridad.id)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowPrioridadModal(true)}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
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

      {/* Modal para agregar Estado */}
      <Dialog open={showEstadoModal} onOpenChange={setShowEstadoModal}>
        <DialogContent className="max-w-[280px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Agregar Estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Input
                type="text"
                value={newEstado.nombre}
                onChange={(e) => setNewEstado({ ...newEstado, nombre: e.target.value })}
                placeholder="Ej: En Espera"
                className="w-full h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={newEstado.color}
                  onChange={(e) => setNewEstado({ ...newEstado, color: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newEstado.color}
                  onChange={(e) => setNewEstado({ ...newEstado, color: e.target.value })}
                  placeholder="#6b7280"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-1.5 pt-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  setShowEstadoModal(false);
                  setNewEstado({ nombre: '', color: '#6b7280' });
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAddEstado}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar Prioridad */}
      <Dialog open={showPrioridadModal} onOpenChange={setShowPrioridadModal}>
        <DialogContent className="max-w-[280px] p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Agregar Prioridad</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <Input
                type="text"
                value={newPrioridad.nombre}
                onChange={(e) => setNewPrioridad({ ...newPrioridad, nombre: e.target.value })}
                placeholder="Ej: Crítica"
                className="w-full h-8 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={newPrioridad.color}
                  onChange={(e) => setNewPrioridad({ ...newPrioridad, color: e.target.value })}
                  className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newPrioridad.color}
                  onChange={(e) => setNewPrioridad({ ...newPrioridad, color: e.target.value })}
                  placeholder="#10b981"
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-1.5 pt-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  setShowPrioridadModal(false);
                  setNewPrioridad({ nombre: '', color: '#10b981' });
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" className="h-7 px-3 text-xs" onClick={handleAddPrioridad}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutWithSidebar>
  );
}
