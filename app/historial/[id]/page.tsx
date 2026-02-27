'use client'

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Building2, Download, Loader2 } from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Loading } from '@/components/Loading';
import { api, ApiClient, getFileDisplayUrl } from '@/services/api';
import { useApp } from '@/context/AppContext';

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export default function HistorialClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { user, issues } = useApp();
  const [client, setClient] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(() => new Date().getFullYear());

  const canAccess = user?.role === 'admin' || user?.role === 'team_lead';

  const filteredProjects = useMemo(() => {
    const projects = client?.projects ?? [];
    return projects.filter(
      (p) =>
        p.planning_month === filterMonth &&
        p.planning_year === filterYear
    );
  }, [client?.projects, filterMonth, filterYear]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const p of client?.projects ?? []) {
      if (p.planning_year != null) years.add(p.planning_year);
    }
    const arr = Array.from(years).sort((a, b) => a - b);
    if (arr.length === 0) {
      const y = new Date().getFullYear();
      return [y - 1, y, y + 1];
    }
    return arr;
  }, [client?.projects]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const c = await api.getClient(clientId);
        if (!cancelled) setClient(c);
      } catch (e) {
        if (!cancelled) {
          console.error('Error loading client:', e);
          setClient(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadClientReportFiltered(clientId, filterMonth, filterYear);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Historial_${client?.name ?? 'Cliente'}_${MONTH_LABELS[filterMonth]}_${filterYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error downloading report:', e);
      alert(e instanceof Error ? e.message : 'Error al descargar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <LayoutWithSidebar>
        <Loading fullScreen message="Cargando cliente..." />
      </LayoutWithSidebar>
    );
  }

  if (!client) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Cliente no encontrado</p>
            <Link href="/historial" className="text-indigo-600 hover:text-indigo-700">
              Volver a historial
            </Link>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  if (!canAccess) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No tienes permiso para acceder al historial.</p>
            <Link href="/historial" className="text-indigo-600 hover:text-indigo-700">
              Volver a historial
            </Link>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <header className="mb-6 md:mb-8 pr-12 md:pr-16">
          <Link
            href="/historial"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a historial</span>
          </Link>
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 min-w-14 min-h-14 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
              {client.logo ? (
                <>
                  <img
                    src={getFileDisplayUrl(client.logo) ?? ''}
                    alt={client.name}
                    className="w-full h-full object-cover min-w-full min-h-full absolute inset-0"
                    width={56}
                    height={56}
                    loading="eager"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  />
                  <Building2 className="w-8 h-8 text-indigo-600 hidden" aria-hidden />
                </>
              ) : (
                <Building2 className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl text-gray-800 truncate">{client.name}</h1>
              <p className="text-sm text-gray-600">Filtra por mes y año, descarga el reporte en Excel</p>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm font-medium text-gray-700">Periodo:</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por mes"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>{MONTH_LABELS[m]}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por año"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleDownload}
            disabled={filteredProjects.length === 0 || downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar Excel
              </>
            )}
          </button>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No hay proyectos para {MONTH_LABELS[filterMonth]} {filterYear}.</p>
              <Link
                href={`/clientes/${clientId}`}
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Ir al perfil del cliente
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Proyecto</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Mes/Año</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Estado</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-800">Tareas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{project.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.type || 'Campaña'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {project.planning_month != null && project.planning_year != null
                          ? `${MONTH_LABELS[project.planning_month]} ${project.planning_year}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project.status || 'planning'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{(issues ?? []).filter((i) => i.projectId === project.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </LayoutWithSidebar>
  );
}
