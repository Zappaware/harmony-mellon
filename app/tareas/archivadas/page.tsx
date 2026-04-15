'use client'

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { api, ApiIssue } from '@/services/api';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { Archive, ArchiveRestore, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ArchivedIssue {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdBy: string;
  projectId?: string;
  clientId?: string;
  taskType?: string;
  archivedAt?: string;
  approvedAt?: string;
  createdAt: string;
}

function convertApiIssue(apiIssue: ApiIssue): ArchivedIssue {
  return {
    id: apiIssue.id,
    title: apiIssue.title,
    description: apiIssue.description,
    status: apiIssue.status,
    priority: apiIssue.priority,
    assignedTo: apiIssue.assigned_to,
    createdBy: apiIssue.created_by,
    projectId: apiIssue.project_id,
    clientId: apiIssue.client_id,
    taskType: apiIssue.task_type,
    archivedAt: apiIssue.archived_at,
    approvedAt: apiIssue.approved_at,
    createdAt: apiIssue.created_at,
  };
}

export default function TareasArchivadas() {
  const { users, projects, unarchiveIssue } = useApp();
  const router = useRouter();
  const [archivedIssues, setArchivedIssues] = useState<ArchivedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    try {
      setLoading(true);
      const apiIssues = await api.getArchivedIssues();
      setArchivedIssues((apiIssues || []).map(convertApiIssue));
    } catch (error) {
      console.error('Error loading archived issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (issueId: string) => {
    try {
      setRestoringId(issueId);
      await unarchiveIssue(issueId);
      setArchivedIssues((prev) => prev.filter((i) => i.id !== issueId));
    } catch (error) {
      console.error('Error unarchiving issue:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const filteredIssues = archivedIssues.filter((issue) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      issue.title.toLowerCase().includes(q) ||
      issue.description.toLowerCase().includes(q)
    );
  });

  const getAssigneeName = (userId?: string) => {
    if (!userId) return 'Sin asignar';
    return users.find((u) => u.id === userId)?.name || 'Usuario';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name || null;
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 md:p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Link
                  href="/kanban"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
                  <h1 className="text-lg md:text-xl font-semibold text-gray-800">
                    Tareas Archivadas
                  </h1>
                </div>
                <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                  {filteredIssues.length}
                </span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tareas archivadas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'No se encontraron tareas archivadas con ese criterio.' : 'No hay tareas archivadas.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredIssues.map((issue) => {
                const projectName = getProjectName(issue.projectId);
                return (
                  <div
                    key={issue.id}
                    className="p-4 md:px-6 hover:bg-gray-50 transition-colors flex items-center gap-4"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/issue/${issue.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-800 truncate">
                          {issue.title}
                        </h3>
                        <Badge variant="priority" value={issue.priority} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Avatar name={getAssigneeName(issue.assignedTo)} size="sm" />
                          <span>{getAssigneeName(issue.assignedTo)}</span>
                        </div>
                        {projectName && (
                          <span className="truncate">📁 {projectName}</span>
                        )}
                        {issue.archivedAt && (
                          <span>
                            Archivada: {new Date(issue.archivedAt).toLocaleDateString('es-MX')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnarchive(issue.id)}
                      disabled={restoringId === issue.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                      title="Restaurar tarea al tablero"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {restoringId === issue.id ? 'Restaurando...' : 'Restaurar'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
