'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, LayoutGrid, LayoutList, Plus, Search, Trash2, Users } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CreateClientModal } from '@/components/CreateClientModal';
import { Loading } from '@/components/Loading';
import { api, ApiClient, getFileDisplayUrl } from '@/services/api';
import { useApp } from '@/context/AppContext';
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
function ClientesContent() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { user } = useApp();

  const canCreate = user?.role === 'admin' || user?.role === 'team_lead';

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = (c.name ?? '').toLowerCase();
      const desc = (c.description ?? '').toLowerCase();
      const contact = (c.contact_name ?? '').toLowerCase();
      const email = (c.email ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q) || contact.includes(q) || email.includes(q);
    });
  }, [clients, searchQuery]);

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
        <div className="p-4 md:p-8">
          <PageHeader
            title="Clientes"
            subtitle="Gestiona todos tus clientes"
          />
          <Loading message="Cargando clientes..." />
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Clientes"
          subtitle="Gestiona todos tus clientes"
          rightContent={
            <div className="flex items-center gap-2 flex-wrap">
              {canCreate && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  type="button"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nuevo Cliente</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              )}
              <div className="flex-1 min-w-48 sm:min-w-[18rem]">
                <input
                  type="search"
                  placeholder="Buscar Clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar clientes"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base placeholder:text-gray-400"
                />
              </div>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as 'list' | 'grid')}
                variant="outline"
                size="lg"
                className="shrink-0 border border-gray-300 bg-white rounded-lg overflow-hidden shadow-sm [&_[data-state=on]]:bg-indigo-100 [&_[data-state=on]]:text-indigo-600 hover:[&_[data-state=on]]:bg-indigo-100"
              >
                <ToggleGroupItem value="list" aria-label="Vista lista" title="Vista lista">
                  <LayoutList className="w-5 h-5" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Vista cuadrícula" title="Vista cuadrícula">
                  <LayoutGrid className="w-5 h-5" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          }
        />

        {/* Content: empty state, no results, list, or grid */}
        {clients.length === 0 ? (
          <section aria-label="Estado vacío">
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
          </section>
        ) : filteredClients.length === 0 ? (
          <section aria-label="Sin resultados">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay clientes que coincidan con &quot;{searchQuery}&quot;</p>
            </div>
          </section>
        ) : viewMode === 'list' ? (
          <section aria-label="Listado de clientes">
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <li key={client.id} className="group">
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <Link
                        href={`/clientes/${client.id}`}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 min-w-10 min-h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                          {client.logo ? (
                            <>
                              <img
                                src={getFileDisplayUrl(client.logo) ?? ''}
                                alt={client.name}
                                className="w-full h-full object-cover min-w-full min-h-full absolute inset-0"
                                width={40}
                                height={40}
                                loading="lazy"
                                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                              />
                              <Building2 className="w-5 h-5 text-indigo-600 hidden" aria-hidden />
                            </>
                          ) : (
                            <Building2 className="w-5 h-5 text-indigo-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 truncate">
                            {client.name}
                          </h3>
                          {client.description && (
                            <p className="text-sm text-gray-500 truncate">{client.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{client.projects?.length || 0} proyecto(s)</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 shrink-0" />
                      </Link>
                      {canCreate && (
                        <button
                          onClick={() => setClientToDelete(client.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section aria-label="Cuadrícula de clientes" className="w-full px-2.5 pb-2.5">
            <div className="grid w-full gap-4 pb-2.5" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {filteredClients.map((client) => (
                <div key={client.id} className="min-w-0 bg-white rounded-lg shadow border border-gray-200 overflow-hidden group flex flex-col">
                  <Link
                    href={`/clientes/${client.id}`}
                    className="flex flex-col p-4 hover:bg-gray-50 transition-colors flex-1 min-h-0"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-12 h-12 min-w-12 min-h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative">
                        {client.logo ? (
                          <>
                            <img
                              src={getFileDisplayUrl(client.logo) ?? ''}
                              alt={client.name}
                              className="w-full h-full object-cover min-w-full min-h-full absolute inset-0"
                              width={48}
                              height={48}
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                            />
                            <Building2 className="w-6 h-6 text-indigo-600 hidden" aria-hidden />
                          </>
                        ) : (
                          <Building2 className="w-6 h-6 text-indigo-600" />
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 shrink-0 mt-1" />
                    </div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 truncate mb-1">
                      {client.name}
                    </h3>
                    {client.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{client.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-auto">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{client.projects?.length || 0} proyecto(s)</span>
                    </div>
                  </Link>
                  {canCreate && (
                    <div className="border-t border-gray-100 px-4 py-2">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClientToDelete(client.id); }}
                        className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
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
        <AlertDialogContent className="bg-red-600 border-red-600 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Esta operación eliminará el cliente <strong>{clients.find(c => c.id === clientToDelete)?.name}</strong> y <strong>todas las tareas y proyectos</strong> relacionados con él. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="bg-transparent border-2 border-white text-white hover:bg-red-500 hover:text-white hover:border-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-white text-red-600 hover:bg-gray-100"
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
