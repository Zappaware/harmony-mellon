'use client'

import React, { useState, useMemo, Suspense } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp, Issue } from '@/context/AppContext';
import { AlertCircle, Clock, Edit } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { CreateIssueModal } from '@/components/CreateIssueModal';
import { EditIssueModal } from '@/components/EditIssueModal';
import { Loading } from '@/components/Loading';
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

// Use a memoized backend to prevent "Cannot have two HTML5 backends" error
// HTML5Backend should be passed directly to DndProvider, not instantiated
// The memoization ensures the same reference is used even if component remounts

interface IssueCardProps {
  issue: Issue;
}

function IssueCard({ issue, onEdit }: IssueCardProps & { onEdit?: (issue: Issue) => void }) {
  const { users } = useApp();
  const router = useRouter();
  const assignedUser = users.find((u) => u.id === issue.assignedTo);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'issue',
    item: { id: issue.id, status: issue.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on edit button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/issue/${issue.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(issue);
  };

  return (
    <div
      ref={drag as any}
      onClick={handleClick}
      className={`bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <h3 className="text-xs md:text-sm text-gray-800 pr-2 flex-1 font-medium">{issue.title}</h3>
        <Badge variant="priority" value={issue.priority} className="flex-shrink-0" />
      </div>
      
      <p className="text-xs text-gray-600 mb-2 md:mb-3 line-clamp-2">{issue.description}</p>
      
      <div className="flex items-center justify-between">
        {assignedUser ? (
          <div className="flex items-center gap-2">
            <Avatar name={assignedUser.name} size="sm" />
            <span className="text-xs text-gray-600">{assignedUser.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">Sin asignar</span>
        )}
        
        <div className="flex items-center gap-2">
          {issue.comments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>💬</span>
              <span>{issue.comments.length}</span>
            </div>
          )}
          {onEdit && (
            <button
              onClick={handleEditClick}
              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Editar tarea"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


interface ColumnProps {
  title: string;
  status: Issue['status'];
  issues: Issue[];
  count: number;
  color: string;
  onEditIssue?: (issue: Issue) => void;
  onStatusChangeRequest?: (issueId: string, oldStatus: Issue['status'], newStatus: Issue['status']) => void;
}

function Column({ title, status, issues, count, color, onEditIssue, onStatusChangeRequest }: ColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'issue',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status && onStatusChangeRequest) {
        onStatusChangeRequest(item.id, item.status as Issue['status'], status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={`w-full md:flex-1 min-w-0 md:min-w-[300px] rounded-lg transition-all ${
        isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-50'
      }`}
    >
      <div className={`${color} rounded-t-lg p-3 md:p-4 text-white`}>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm md:text-base">{title}</h2>
          <span className="bg-white bg-opacity-30 text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
            {count}
          </span>
        </div>
      </div>
      
      <div className="p-3 md:p-4 space-y-2 md:space-y-3 min-h-[200px] md:min-h-[500px]">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} onEdit={onEditIssue} />
        ))}
        {issues.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">Arrastra tarjetas aquí</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanContent() {
  const { issues, projects } = useApp();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');

  // Filter issues by project if projectId is provided
  const filteredIssues = useMemo(() => {
    if (projectId) {
      return issues.filter(issue => issue.projectId === projectId);
    }
    return issues;
  }, [issues, projectId]);

  const project = projectId ? projects.find(p => p.id === projectId) : null;

  const columns = [
    { 
      title: 'Por Hacer', 
      status: 'todo' as const, 
      color: 'bg-red-600',
      icon: Clock 
    },
    { 
      title: 'En Progreso', 
      status: 'in-progress' as const, 
      color: 'bg-blue-600',
      icon: Clock 
    },
    { 
      title: 'En Revisión', 
      status: 'review' as const, 
      color: 'bg-purple-600',
      icon: AlertCircle 
    },
    { 
      title: 'Completadas', 
      status: 'done' as const, 
      color: 'bg-green-600',
      icon: Clock 
    },
  ];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<Issue | null>(null);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    issueId: string;
    oldStatus: Issue['status'];
    newStatus: Issue['status'];
    issueTitle: string;
  } | null>(null);
  const { updateIssueStatus } = useApp();
  
  const getStatusLabel = (status: Issue['status']) => {
    const labels: Record<Issue['status'], string> = {
      'todo': 'Por Hacer',
      'in-progress': 'En Progreso',
      'review': 'En Revisión',
      'done': 'Completada',
    };
    return labels[status] || status;
  };

  const handleStatusChangeRequest = (issueId: string, oldStatus: Issue['status'], newStatus: Issue['status']) => {
    const issue = filteredIssues.find(i => i.id === issueId);
    if (issue) {
      setPendingStatusChange({
        issueId,
        oldStatus,
        newStatus,
        issueTitle: issue.title,
      });
      setShowStatusConfirmDialog(true);
    }
  };

  const handleStatusChangeConfirm = async () => {
    if (!pendingStatusChange) return;
    try {
      await updateIssueStatus(pendingStatusChange.issueId, pendingStatusChange.newStatus);
      setShowStatusConfirmDialog(false);
      setPendingStatusChange(null);
    } catch (error) {
      console.error('Error updating issue status:', error);
      alert('Error al actualizar el estado. Por favor, intenta de nuevo.');
    }
  };
  
  // Use memoized backend to prevent multiple instances
  // This ensures the same backend reference is reused even if component remounts
  const backend = useMemo(() => HTML5Backend, []);

  return (
    <DndProvider backend={backend}>
      <div className="p-4 md:p-8 h-screen overflow-x-auto">
        <PageHeader
          title={project ? `Kanban - ${project.name}` : "Tablero Kanban"}
          subtitle={project ? `Tareas del proyecto: ${project.name}` : "Arrastra las tarjetas para cambiar su estado"}
          action={{
            label: 'Nueva Tarea',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 pb-6 md:pb-8 overflow-x-auto md:overflow-x-auto">
          {columns.map((column) => {
            const columnIssues = filteredIssues.filter((issue) => issue.status === column.status);
            return (
              <Column
                key={column.status}
                title={column.title}
                status={column.status}
                issues={columnIssues}
                count={columnIssues.length}
                color={column.color}
                onEditIssue={setIssueToEdit}
                onStatusChangeRequest={handleStatusChangeRequest}
              />
            );
          })}
        </div>
      </div>
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Issues will be reloaded automatically via useEffect in AppContext
        }}
        initialProjectId={projectId || undefined}
      />
      <EditIssueModal
        isOpen={issueToEdit !== null}
        onClose={() => setIssueToEdit(null)}
        onSuccess={() => {
          // Issues will be reloaded automatically via useEffect in AppContext
          window.location.reload();
        }}
        issue={issueToEdit}
      />
      <AlertDialog open={showStatusConfirmDialog} onOpenChange={setShowStatusConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cambiar el estado de la tarea{' '}
              <strong>{pendingStatusChange?.issueTitle}</strong> de{' '}
              <strong>{pendingStatusChange ? getStatusLabel(pendingStatusChange.oldStatus) : ''}</strong> a{' '}
              <strong>{pendingStatusChange ? getStatusLabel(pendingStatusChange.newStatus) : ''}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChangeConfirm}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndProvider>
  );
}

function Kanban() {
  return (
    <LayoutWithSidebar>
      <Suspense fallback={<Loading fullScreen message="Cargando kanban..." />}>
        <KanbanContent />
      </Suspense>
    </LayoutWithSidebar>
  );
}

export default function KanbanPage() {
  return <Kanban />;
}
