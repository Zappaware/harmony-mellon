'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Plus,
  LayoutList,
  Palette,
  Megaphone,
  FolderPlus,
  Star,
} from 'lucide-react';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Loading } from '@/components/Loading';
import { api, ApiClient, ApiProject } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { IssueCardList } from '@/components/IssueCardList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { CreateIssueModal } from '@/components/CreateIssueModal';
import { Badge } from '@/components/Badge';

const PROJECT_TYPES = [
  { type: 'Planner' as const, label: 'Planner', icon: LayoutList, color: 'bg-violet-100 text-violet-800' },
  { type: 'Branding' as const, label: 'Branding', icon: Palette, color: 'bg-amber-100 text-amber-800' },
  { type: 'Campaña' as const, label: 'Campaña', icon: Megaphone, color: 'bg-sky-100 text-sky-800' },
] as const;

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { issues, users, user: currentUser } = useApp();

  const [client, setClient] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createIssueModalOpen, setCreateIssueModalOpen] = useState(false);
  const [projectTypeToAdd, setProjectTypeToAdd] = useState<'Planner' | 'Branding' | 'Campaña' | null>(null);
  const [projectIdForNewIssue, setProjectIdForNewIssue] = useState<string | null>(null);

  const canCreate = currentUser?.role === 'admin' || currentUser?.role === 'team_lead';

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

  const clientProjects = useMemo(() => {
    if (!client?.projects?.length) return [];
    return client.projects!;
  }, [client]);

  const projectsByType = useMemo(() => {
    const map: Record<string, ApiProject[]> = { Planner: [], Branding: [], Campaña: [] };
    for (const p of clientProjects) {
      const t = p.type || 'Campaña';
      if (t in map) map[t].push(p);
    }
    return map;
  }, [clientProjects]);

  const openCreateProject = (type: 'Planner' | 'Branding' | 'Campaña') => {
    setProjectTypeToAdd(type);
    setCreateProjectModalOpen(true);
  };

  const openCreateIssue = (projectId: string) => {
    setProjectIdForNewIssue(projectId);
    setCreateIssueModalOpen(true);
  };

  const handleProjectCreated = async () => {
    const c = await api.getClient(clientId);
    setClient(c);
    setCreateProjectModalOpen(false);
    setProjectTypeToAdd(null);
  };

  const handleIssueCreated = () => {
    setCreateIssueModalOpen(false);
    setProjectIdForNewIssue(null);
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
            <Link href="/clientes" className="text-indigo-600 hover:text-indigo-700">
              Volver a clientes
            </Link>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a clientes</span>
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl text-gray-800">{client.name}</h1>
            {client.description && (
              <p className="text-gray-600 mt-1">{client.description}</p>
            )}
          </div>
        </div>

        {PROJECT_TYPES.map(({ type, label, icon: Icon, color }) => {
          const typeProjects = projectsByType[type] || [];
          return (
            <section key={type} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
                {canCreate && typeProjects.length === 0 && (
                  <button
                    onClick={() => openCreateProject(type)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Añadir proyecto
                  </button>
                )}
              </div>

              {typeProjects.length === 0 && !canCreate && (
                <p className="text-sm text-gray-500 py-4">No hay proyectos de tipo {label}.</p>
              )}

              {typeProjects.map((project) => {
                const projectIssues = issues.filter((i) => i.projectId === project.id);
                const approvedCount = projectIssues.filter((i) => i.approvedAt).length;
                const showScore = (type === 'Planner' || type === 'Branding') && projectIssues.length > 0;
                return (
                  <div key={project.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-800">{project.name}</h2>
                        <Badge variant="status" value={project.status || 'planning'} />
                        {showScore && (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full" title="Tareas aprobadas por líder o administrador">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span>{approvedCount}/{projectIssues.length}</span>
                          </span>
                        )}
                      </div>
                      {canCreate && (
                        <button
                          onClick={() => openCreateIssue(project.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Nueva tarea
                        </button>
                      )}
                    </div>
                    <div>
                      {projectIssues.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          No hay tareas en este proyecto.
                          {canCreate && (
                            <button
                              onClick={() => openCreateIssue(project.id)}
                              className="block mx-auto mt-2 text-indigo-600 hover:text-indigo-700"
                            >
                              Crear primera tarea
                            </button>
                          )}
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-100">
                          {projectIssues.map((issue) => (
                            <li key={issue.id}>
                              <IssueCardList
                                issue={issue}
                                assignedUser={issue.assignedTo ? users.find((u) => u.id === issue.assignedTo) : undefined}
                                showProject={false}
                                showApprovedStar={type === 'Planner' || type === 'Branding'}
                              />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}

        <CreateProjectModal
          isOpen={createProjectModalOpen}
          onClose={() => { setCreateProjectModalOpen(false); setProjectTypeToAdd(null); }}
          onSuccess={handleProjectCreated}
          projectToEdit={undefined}
          initialClientId={clientId}
          initialType={projectTypeToAdd ?? undefined}
        />

        <CreateIssueModal
          isOpen={createIssueModalOpen}
          onClose={() => { setCreateIssueModalOpen(false); setProjectIdForNewIssue(null); }}
          onSuccess={handleIssueCreated}
          initialProjectId={projectIdForNewIssue ?? undefined}
          initialClientId={clientId}
        />
      </div>
    </LayoutWithSidebar>
  );
}
