'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { Building2, Mail, Phone, Plus, Trash2, Users, MapPin, User } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { CreateClientModal } from '@/components/CreateClientModal';
import { Loading } from '@/components/Loading';
import { api, ApiClient } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DateDisplay } from '@/components/DateDisplay';

function ClientesContent() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useApp();

  const canCreate = user?.role === 'admin' || user?.role === 'team_lead';

  useEffect(() => {
    const loadClients = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const apiClients = await api.getClients();
        setClients(apiClients);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [user]);

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteClient(clientToDelete);
      setClients(clients.filter(c => c.id !== clientToDelete));
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error al eliminar el cliente. Por favor, intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <Loading fullScreen message="Cargando clientes..." />
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pr-12 md:pr-16">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl text-gray-800 mb-1 md:mb-2">Clientes</h1>
              <p className="text-sm md:text-base text-gray-600">Gestiona todos tus clientes</p>
            </div>
            {canCreate && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm md:text-base">Total Clientes</span>
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800">{clients.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm md:text-base">Con Proyectos</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800">
              {clients.filter(c => c.projects && c.projects.length > 0).length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm md:text-base">Con Contacto</span>
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl md:text-3xl text-gray-800">
              {clients.filter(c => c.email || c.phone).length}
            </p>
          </div>
        </div>

        {/* Clients List */}
        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">
              No hay clientes
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              {canCreate 
                ? 'Comienza creando tu primer cliente'
                : 'No hay clientes disponibles en este momento'}
            </p>
            {canCreate && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Mobile: Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{client.name}</h3>
                        {client.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {client.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {canCreate && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setClientToDelete(client.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{client.address}</span>
                      </div>
                    )}
                    {client.contact_name && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-700">{client.contact_name}</div>
                          {client.contact_email && (
                            <div className="text-xs text-gray-500 truncate">{client.contact_email}</div>
                          )}
                          {client.contact_phone && (
                            <div className="text-xs text-gray-500">{client.contact_phone}</div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{client.projects?.length || 0} proyecto(s)</span>
                    </div>
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      Creado: <DateDisplay date={client.created_at} format="date" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Proyectos</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    {canCreate && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{client.name}</div>
                            {client.description && (
                              <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                {client.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate max-w-xs">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                              <span className="line-clamp-1 max-w-xs">{client.address}</span>
                            </div>
                          )}
                          {client.contact_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 pt-1 border-t border-gray-100">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{client.contact_name}</div>
                                {client.contact_email && (
                                  <div className="text-xs text-gray-500">{client.contact_email}</div>
                                )}
                                {client.contact_phone && (
                                  <div className="text-xs text-gray-500">{client.contact_phone}</div>
                                )}
                              </div>
                            </div>
                          )}
                          {!client.email && !client.phone && !client.address && !client.contact_name && (
                            <span className="text-sm text-gray-400">Sin información de contacto</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {client.projects?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DateDisplay date={client.created_at} format="date" />
                      </TableCell>
                      {canCreate && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setClientToDelete(client.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          try {
            const apiClients = await api.getClients();
            setClients(apiClients);
          } catch (error) {
            console.error('Error reloading clients:', error);
          }
        }}
      />

      <AlertDialog open={clientToDelete !== null} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el cliente{' '}
              <strong>{clients.find(c => c.id === clientToDelete)?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWithSidebar>
  );
}

export default function Clientes() {
  return (
    <Suspense fallback={<LayoutWithSidebar><Loading fullScreen message="Cargando clientes..." /></LayoutWithSidebar>}>
      <ClientesContent />
    </Suspense>
  );
}
