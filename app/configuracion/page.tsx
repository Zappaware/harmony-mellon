'use client'

import React, { useState, useEffect } from 'react';
import { Tag, AlertTriangle, Sliders, Plus, Edit } from 'lucide-react';
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
  const [showParametrosModal, setShowParametrosModal] = useState(false);
  const [newEstado, setNewEstado] = useState({ nombre: '', color: '#6b7280' });
  const [newPrioridad, setNewPrioridad] = useState({ nombre: '', color: '#10b981' });
  
  const defaultParametros = {
    nombreOrganizacion: 'Mi Empresa S.A.',
    emailContacto: 'contacto@empresa.com',
    zonaHoraria: 'UTC-3 (Buenos Aires, São Paulo, Montevideo)',
    idioma: 'Español'
  };

  const [parametros, setParametros] = useState(defaultParametros);

  // Load parametros from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('parametrosGenerales');
    if (stored) {
      try {
        setParametros(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading parametros:', e);
      }
    }
  }, []);

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

  // Lista completa de zonas horarias UTC
  const timezones = [
    { value: 'UTC-12', label: 'UTC-12 (Baker Island)' },
    { value: 'UTC-11', label: 'UTC-11 (Hawaii, Samoa)' },
    { value: 'UTC-10', label: 'UTC-10 (Hawaii, Tahiti)' },
    { value: 'UTC-9:30', label: 'UTC-9:30 (Marquesas Islands)' },
    { value: 'UTC-9', label: 'UTC-9 (Alaska)' },
    { value: 'UTC-8', label: 'UTC-8 (Pacific Time - Los Angeles, Vancouver)' },
    { value: 'UTC-7', label: 'UTC-7 (Mountain Time - Denver, Phoenix)' },
    { value: 'UTC-6', label: 'UTC-6 (Central Time - Chicago, Mexico City)' },
    { value: 'UTC-5', label: 'UTC-5 (Eastern Time - New York, Lima, Bogotá)' },
    { value: 'UTC-4', label: 'UTC-4 (Atlantic Time - Caracas, Santiago)' },
    { value: 'UTC-3:30', label: 'UTC-3:30 (Newfoundland)' },
    { value: 'UTC-3', label: 'UTC-3 (Buenos Aires, São Paulo, Montevideo)' },
    { value: 'UTC-2', label: 'UTC-2 (Mid-Atlantic)' },
    { value: 'UTC-1', label: 'UTC-1 (Azores, Cape Verde)' },
    { value: 'UTC+0', label: 'UTC+0 (London, Dublin, Lisbon)' },
    { value: 'UTC+1', label: 'UTC+1 (Paris, Madrid, Berlin, Rome)' },
    { value: 'UTC+2', label: 'UTC+2 (Cairo, Athens, Helsinki)' },
    { value: 'UTC+3', label: 'UTC+3 (Moscow, Istanbul, Nairobi)' },
    { value: 'UTC+3:30', label: 'UTC+3:30 (Tehran)' },
    { value: 'UTC+4', label: 'UTC+4 (Dubai, Baku, Tbilisi)' },
    { value: 'UTC+4:30', label: 'UTC+4:30 (Kabul)' },
    { value: 'UTC+5', label: 'UTC+5 (Karachi, Tashkent)' },
    { value: 'UTC+5:30', label: 'UTC+5:30 (Mumbai, Delhi, Colombo)' },
    { value: 'UTC+5:45', label: 'UTC+5:45 (Kathmandu)' },
    { value: 'UTC+6', label: 'UTC+6 (Dhaka, Almaty)' },
    { value: 'UTC+6:30', label: 'UTC+6:30 (Yangon)' },
    { value: 'UTC+7', label: 'UTC+7 (Bangkok, Jakarta, Hanoi)' },
    { value: 'UTC+8', label: 'UTC+8 (Beijing, Singapore, Manila, Perth)' },
    { value: 'UTC+8:45', label: 'UTC+8:45 (Eucla)' },
    { value: 'UTC+9', label: 'UTC+9 (Tokyo, Seoul, Pyongyang)' },
    { value: 'UTC+9:30', label: 'UTC+9:30 (Adelaide, Darwin)' },
    { value: 'UTC+10', label: 'UTC+10 (Sydney, Melbourne, Port Moresby)' },
    { value: 'UTC+10:30', label: 'UTC+10:30 (Lord Howe Island)' },
    { value: 'UTC+11', label: 'UTC+11 (Nouméa, Solomon Islands)' },
    { value: 'UTC+12', label: 'UTC+12 (Auckland, Fiji, Kamchatka)' },
    { value: 'UTC+12:45', label: 'UTC+12:45 (Chatham Islands)' },
    { value: 'UTC+13', label: 'UTC+13 (Tonga, Samoa)' },
    { value: 'UTC+14', label: 'UTC+14 (Line Islands)' },
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
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl text-gray-800">Parámetros Generales</h2>
              </div>
              <button
                onClick={() => setShowParametrosModal(true)}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                aria-label="Editar parámetros"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Nombre de la Organización
                  </label>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {parametros.nombreOrganizacion}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Email de Contacto
                  </label>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {parametros.emailContacto}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {parametros.zonaHoraria}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Idioma
                  </label>
                  <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                    {parametros.idioma}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar Estado */}
      <Dialog open={showEstadoModal} onOpenChange={setShowEstadoModal}>
        <DialogContent 
          className="!max-w-[90vw] sm:!max-w-[320px] md:!max-w-[340px] !p-4 sm:!p-5 !w-auto"
        >
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm sm:text-base">Agregar Estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="estado-nombre" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Nombre
              </label>
              <Input
                id="estado-nombre"
                type="text"
                value={newEstado.nombre}
                onChange={(e) => setNewEstado({ ...newEstado, nombre: e.target.value })}
                placeholder="Ej: En Espera"
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <label htmlFor="estado-color" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="estado-color-picker"
                  type="color"
                  value={newEstado.color}
                  onChange={(e) => setNewEstado({ ...newEstado, color: e.target.value })}
                  className="w-10 h-9 sm:w-12 sm:h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  id="estado-color"
                  type="text"
                  value={newEstado.color}
                  onChange={(e) => setNewEstado({ ...newEstado, color: e.target.value })}
                  placeholder="#6b7280"
                  className="flex-1 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm"
                onClick={() => {
                  setShowEstadoModal(false);
                  setNewEstado({ nombre: '', color: '#6b7280' });
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" className="h-9 px-4 text-sm" onClick={handleAddEstado}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para agregar Prioridad */}
      <Dialog open={showPrioridadModal} onOpenChange={setShowPrioridadModal}>
        <DialogContent 
          className="!max-w-[90vw] sm:!max-w-[320px] md:!max-w-[340px] !p-4 sm:!p-5 !w-auto"
        >
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm sm:text-base">Agregar Prioridad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="prioridad-nombre" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Nombre
              </label>
              <Input
                id="prioridad-nombre"
                type="text"
                value={newPrioridad.nombre}
                onChange={(e) => setNewPrioridad({ ...newPrioridad, nombre: e.target.value })}
                placeholder="Ej: Crítica"
                className="w-full h-9 sm:h-10 text-sm"
              />
            </div>
            <div>
              <label htmlFor="prioridad-color" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="prioridad-color-picker"
                  type="color"
                  value={newPrioridad.color}
                  onChange={(e) => setNewPrioridad({ ...newPrioridad, color: e.target.value })}
                  className="w-10 h-9 sm:w-12 sm:h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  id="prioridad-color"
                  type="text"
                  value={newPrioridad.color}
                  onChange={(e) => setNewPrioridad({ ...newPrioridad, color: e.target.value })}
                  placeholder="#10b981"
                  className="flex-1 h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-sm"
                onClick={() => {
                  setShowPrioridadModal(false);
                  setNewPrioridad({ nombre: '', color: '#10b981' });
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" className="h-9 px-4 text-sm" onClick={handleAddPrioridad}>
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar Parámetros Generales */}
      <Dialog open={showParametrosModal} onOpenChange={setShowParametrosModal}>
        <DialogContent className="!max-w-[90vw] sm:!max-w-[500px] md:!max-w-[600px] !p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Parámetros Generales</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="param-nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Organización
              </label>
              <Input
                id="param-nombre"
                type="text"
                value={parametros.nombreOrganizacion}
                onChange={(e) => setParametros({ ...parametros, nombreOrganizacion: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="param-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de Contacto
              </label>
              <Input
                id="param-email"
                type="email"
                value={parametros.emailContacto}
                onChange={(e) => setParametros({ ...parametros, emailContacto: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="param-zona" className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
              </label>
              <select
                id="param-zona"
                value={parametros.zonaHoraria}
                onChange={(e) => setParametros({ ...parametros, zonaHoraria: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.label}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="param-idioma" className="block text-sm font-medium text-gray-700 mb-2">
                Idioma
              </label>
              <select
                id="param-idioma"
                value={parametros.idioma}
                onChange={(e) => setParametros({ ...parametros, idioma: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Español</option>
                <option>English</option>
                <option>Português</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowParametrosModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Save to localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('parametrosGenerales', JSON.stringify(parametros));
                    // Dispatch custom event for same-tab updates
                    window.dispatchEvent(new Event('parametrosUpdated'));
                  }
                  setShowParametrosModal(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutWithSidebar>
  );
}
