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
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  User,
  Users,
  Info,
  X,
} from 'lucide-react';
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
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Loading } from '@/components/Loading';
import { api, ApiClient, ApiClientMember, ApiProject, getFileDisplayUrl } from '@/services/api';
import { useApp } from '@/context/AppContext';
import { IssueCardList } from '@/components/IssueCardList';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { CreateIssueModal } from '@/components/CreateIssueModal';
import { CreateClientModal } from '@/components/CreateClientModal';
import { Badge } from '@/components/Badge';
import { getAllProjectTypes } from '@/lib/projectTypes';

const TYPE_STYLE: Record<string, { icon: typeof LayoutList; color: string }> = {
  Planner: { icon: LayoutList, color: 'bg-violet-100 text-violet-800' },
  Branding: { icon: Palette, color: 'bg-amber-100 text-amber-800' },
  Campaña: { icon: Megaphone, color: 'bg-sky-100 text-sky-800' },
};
function getTypeStyle(type: string) {
  return TYPE_STYLE[type] ?? { icon: FolderPlus, color: 'bg-gray-100 text-gray-800' };
}

const MONTH_LABELS: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const { issues, users, user: currentUser, deleteProject: deleteProjectFromContext } = useApp();

  const [client, setClient] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createIssueModalOpen, setCreateIssueModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [infoClientModalOpen, setInfoClientModalOpen] = useState(false);
  const [projectTypeToAdd, setProjectTypeToAdd] = useState<string | null>(null);
  const [personalizedProjectOpen, setPersonalizedProjectOpen] = useState(false);
  const [projectIdForNewIssue, setProjectIdForNewIssue] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ApiProject | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [filterMonth, setFilterMonth] = useState<number | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [teamAddUserId, setTeamAddUserId] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

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

  const filteredProjects = useMemo(() => {
    if (filterMonth === '' || filterYear === '') return clientProjects;
    return clientProjects.filter(
      (p) => p.planning_month === filterMonth && p.planning_year === filterYear
    );
  }, [clientProjects, filterMonth, filterYear]);

  const sectionTypes = useMemo(() => {
    const known = getAllProjectTypes();
    const fromProjects = new Set(filteredProjects.map((p) => p.type).filter(Boolean) as string[]);
    return [...known, ...Array.from(fromProjects).filter((t) => !known.includes(t))];
  }, [filteredProjects]);

  const projectsByType = useMemo(() => {
    const map: Record<string, ApiProject[]> = {};
    for (const t of sectionTypes) map[t] = [];
    for (const p of filteredProjects) {
      const t = p.type || 'Campaña';
      if (!map[t]) map[t] = [];
      map[t].push(p);
    }
    return map;
  }, [filteredProjects, sectionTypes]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const p of clientProjects) {
      if (p.planning_year != null) years.add(p.planning_year);
    }
    const arr = Array.from(years).sort((a, b) => a - b);
    if (arr.length === 0) {
      const y = new Date().getFullYear();
      return [y - 1, y, y + 1];
    }
    return arr;
  }, [clientProjects]);

  const openCreateProject = (type: string) => {
    setProjectTypeToAdd(type);
    setPersonalizedProjectOpen(false);
    setCreateProjectModalOpen(true);
  };

  const openCreateProjectPersonalized = () => {
    setProjectTypeToAdd(null);
    setPersonalizedProjectOpen(true);
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
    setPersonalizedProjectOpen(false);
  };

  const handleIssueCreated = async () => {
    setCreateIssueModalOpen(false);
    setProjectIdForNewIssue(null);
    const c = await api.getClient(clientId);
    setClient(c);
  };

  const handleClientUpdated = async () => {
    const c = await api.getClient(clientId);
    setClient(c);
    setEditClientModalOpen(false);
  };

  const clientMembers = client?.client_members ?? [];
  const usersNotInTeam = users.filter((u) => !clientMembers.some((m) => m.user_id === u.id));

  const handleAddClientMember = async () => {
    if (!teamAddUserId || teamLoading) return;
    setTeamLoading(true);
    try {
      await api.addClientMember(clientId, teamAddUserId);
      const c = await api.getClient(clientId);
      setClient(c);
      setTeamAddUserId('');
    } catch (e) {
      console.error('Error adding team member:', e);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleRemoveClientMember = async (member: ApiClientMember) => {
    if (teamLoading) return;
    setTeamLoading(true);
    try {
      await api.removeClientMember(clientId, member.user_id);
      const c = await api.getClient(clientId);
      setClient(c);
    } catch (e) {
      console.error('Error removing team member:', e);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || !deleteProjectFromContext) return;
    setIsDeletingProject(true);
    try {
      await deleteProjectFromContext(projectToDelete.id);
      const c = await api.getClient(clientId);
      setClient(c);
      setProjectToDelete(null);
    } finally {
      setIsDeletingProject(false);
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
        {/* Header: same pattern as client list — pr-12 md:pr-16 for bell, plus in row */}
        <header className="mb-6 md:mb-8 pr-12 md:pr-16">
          <Link
            href="/clientes"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a clientes</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
                {client.description && (
                  <p className="text-gray-600 mt-1 line-clamp-2">{client.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreateProjectPersonalized}
                  className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
                  title="Añadir proyecto"
                  aria-label="Añadir proyecto"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setInfoClientModalOpen(true)}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Ver información del cliente"
                aria-label="Ver información del cliente"
              >
                <Info className="w-5 h-5" />
              </button>
              {canCreate && (
                <button
                  onClick={() => setEditClientModalOpen(true)}
                  className="inline-flex items-center justify-center w-10 h-10 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Editar cliente"
                  aria-label="Editar cliente"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {infoClientModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInfoClientModalOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">Información del cliente</h2>
                <button
                  type="button"
                  onClick={() => setInfoClientModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {client.description && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</span>
                    <p className="text-gray-700 mt-1">{client.description}</p>
                  </div>
                )}
                {(client.email || client.phone || client.address) && (
                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <a href={`mailto:${client.email}`} className="text-indigo-600 hover:underline break-all">{client.email}</a>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                )}
                {(client.contact_name || client.contact_email || client.contact_phone) && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Persona de contacto</span>
                    <div className="mt-2 space-y-2">
                      {client.contact_name && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{client.contact_name}</span>
                        </div>
                      )}
                      {client.contact_email && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                          <a href={`mailto:${client.contact_email}`} className="text-indigo-600 hover:underline break-all">{client.contact_email}</a>
                        </div>
                      )}
                      {client.contact_phone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{client.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!client.description && !client.email && !client.phone && !client.address && !client.contact_name && !client.contact_email && !client.contact_phone && (
                  <p className="text-gray-500 text-sm">No hay información adicional.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm font-medium text-gray-700">Periodo:</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por mes"
          >
            <option value="">Todos los meses</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>{MONTH_LABELS[m]}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Filtrar por año"
          >
            <option value="">Todos los años</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {(filterMonth !== '' || filterYear !== '') && (
            <button
              type="button"
              onClick={() => { setFilterMonth(''); setFilterYear(''); }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Ver todos
            </button>
          )}
        </div>

        {canCreate && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Equipo del cliente
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <select
                  value={teamAddUserId}
                  onChange={(e) => setTeamAddUserId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                  aria-label="Añadir usuario al equipo"
                >
                  <option value="">Seleccionar usuario...</option>
                  {usersNotInTeam.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddClientMember}
                  disabled={!teamAddUserId || teamLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </div>
              {clientMembers.length === 0 ? (
                <p className="text-sm text-gray-500">Ningún usuario en el equipo.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {clientMembers.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2 first:pt-0">
                      <span className="text-gray-800">
                        {m.user?.name ?? m.user_id}
                        {m.user?.email && (
                          <span className="text-gray-500 text-sm ml-2">({m.user.email})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClientMember(m)}
                        disabled={teamLoading}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title="Quitar del equipo"
                        aria-label="Quitar del equipo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {sectionTypes.map((type) => {
          const typeProjects = projectsByType[type] || [];
          const { icon: Icon, color } = getTypeStyle(type);
          return (
            <section key={type} className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
                  <Icon className="w-4 h-4" />
                  {type}
                </span>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => openCreateProject(type)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Añadir proyecto
                  </button>
                )}
              </div>

              {typeProjects.length === 0 && !canCreate && (
                <p className="text-sm text-gray-500 py-4">No hay proyectos de tipo {type}.</p>
              )}

              {typeProjects.map((project) => {
                const projectIssues = issues.filter((i) => i.projectId === project.id);
                const approvedCount = projectIssues.filter((i) => i.approvedAt).length;
                const showScore = ['Planner', 'Branding'].includes(type) && projectIssues.length > 0;
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
                      <div className="flex items-center gap-2">
                        {canCreate && (
                          <>
                            <button
                              onClick={() => openCreateIssue(project.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Nueva tarea
                            </button>
                            <button
                              onClick={() => setProjectToDelete(project)}
                              className="inline-flex items-center justify-center w-9 h-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar proyecto"
                              aria-label="Eliminar proyecto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
                                showApprovedStar={['Planner', 'Branding'].includes(type)}
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
          onClose={() => { setCreateProjectModalOpen(false); setProjectTypeToAdd(null); setPersonalizedProjectOpen(false); }}
          onSuccess={handleProjectCreated}
          projectToEdit={undefined}
          initialClientId={clientId}
          initialType={projectTypeToAdd ?? undefined}
          projectTypes={getAllProjectTypes()}
          allowOtherType={personalizedProjectOpen}
        />

        <CreateIssueModal
          isOpen={createIssueModalOpen}
          onClose={() => { setCreateIssueModalOpen(false); setProjectIdForNewIssue(null); }}
          onSuccess={handleIssueCreated}
          initialProjectId={projectIdForNewIssue ?? undefined}
          initialClientId={clientId}
        />

        <CreateClientModal
          isOpen={editClientModalOpen}
          onClose={() => setEditClientModalOpen(false)}
          onSuccess={handleClientUpdated}
          clientToEdit={client}
        />

        <AlertDialog open={projectToDelete !== null} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <AlertDialogContent className="bg-red-600 border-red-600 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">¿Eliminar proyecto?</AlertDialogTitle>
              <AlertDialogDescription className="text-white">
                Esta operación eliminará el proyecto &quot;{projectToDelete?.name}&quot; y <strong>todas las tareas</strong> relacionadas con él. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel
                disabled={isDeletingProject}
                className="bg-transparent border-2 border-white text-white hover:bg-red-500 hover:text-white hover:border-white"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDeleteProject(); }}
                disabled={isDeletingProject}
                className="bg-white text-red-600 hover:bg-gray-100"
              >
                {isDeletingProject ? 'Eliminando...' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWithSidebar>
  );
}
