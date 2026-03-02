'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, Search, Users } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { PageHeader } from '@/components/PageHeader';
import { Loading } from '@/components/Loading';
import { api, ApiClient, getFileDisplayUrl } from '@/services/api';
import { useApp } from '@/context/AppContext';

function HistorialContent() {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useApp();

  const canAccess = user?.role === 'admin' || user?.role === 'team_lead';

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

  if (isLoading) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <PageHeader
            title="Historial"
            subtitle="Genera reportes en Excel por cliente y tipo de proyecto"
          />
          <Loading message="Cargando historial..." />
        </div>
      </LayoutWithSidebar>
    );
  }

  if (!canAccess) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <PageHeader
            title="Historial"
            subtitle="Genera reportes en Excel por cliente y tipo de proyecto"
          />
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No tienes permiso para acceder al historial de reportes.</p>
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
              Volver al inicio
            </Link>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Historial"
          subtitle="Genera reportes en Excel por cliente y tipo de proyecto"
          rightContent={
            <div className="w-full sm:w-auto">
              <input
                type="search"
                placeholder="Buscar clientes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar clientes"
                className="w-full sm:min-w-[18rem] sm:w-80 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base placeholder:text-gray-400"
              />
            </div>
          }
        />

        <section aria-label="Listado de clientes">
          {clients.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No hay clientes</h3>
              <p className="text-sm md:text-base text-gray-600">No hay clientes para generar reportes.</p>
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
                    <Link
                      href={`/historial/${client.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
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
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </LayoutWithSidebar>
  );
}

export default function HistorialPage() {
  return (
    <Suspense fallback={<LayoutWithSidebar><Loading fullScreen message="Cargando..." /></LayoutWithSidebar>}>
      <HistorialContent />
    </Suspense>
  );
}
