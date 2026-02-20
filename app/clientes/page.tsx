'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Plus, Search, Trash2, Users } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { CreateClientModal } from '@/components/CreateClientModal';
import { Loading } from '@/components/Loading';
import { api, ApiClient } from '@/services/api';
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
        <Loading fullScreen message="Cargando clientes..." />
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        {/* Header: title, search, actions */}
        <header className="mb-6 md:mb-8 pr-12 md:pr-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl text-gray-800 mb-1 md:mb-2">Clientes</h1>
              <p className="text-sm md:text-base text-gray-600">Gestiona todos tus clientes</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="flex-1 md:flex-initial min-w-0">
                <input
                  type="search"
                  placeholder="Buscar Clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar clientes"
                  className="w-full md:min-w-[18rem] md:w-80 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base placeholder:text-gray-400"
                />
              </div>
              {canCreate && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Nuevo Cliente</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content: empty state, no results, or list of clients */}
        <section aria-label="Listado de clientes">
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
          ) : filteredClients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No hay clientes que coincidan con &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <li key={client.id} className="group">
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <Link
                        href={`/clientes/${client.id}`}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-indigo-600" />
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
          )}
        </section>
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
