'use client'

import React, { useState, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp, Issue } from '@/context/AppContext';
import { AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { CreateIssueModal } from '@/components/CreateIssueModal';

// Create a singleton backend instance to prevent "Cannot have two HTML5 backends" error
// This ensures only one HTML5Backend instance exists, even if the component remounts
// (which can happen in React StrictMode or during navigation)
let backendInstance: HTML5Backend | null = null;

const getBackend = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return the class
    return HTML5Backend;
  }
  
  // Create singleton instance only once
  if (!backendInstance) {
    backendInstance = new HTML5Backend();
  }
  
  return backendInstance;
};

interface IssueCardProps {
  issue: Issue;
}

function IssueCard({ issue }: IssueCardProps) {
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

  const handleClick = () => {
    router.push(`/issue/${issue.id}`);
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
        
        {issue.comments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>💬</span>
            <span>{issue.comments.length}</span>
          </div>
        )}
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
}

function Column({ title, status, issues, count, color }: ColumnProps) {
  const { updateIssueStatus } = useApp();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'issue',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) {
        updateIssueStatus(item.id, status);
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
          <IssueCard key={issue.id} issue={issue} />
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

function Kanban() {
  const { issues } = useApp();

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
  
  // Use memoized backend instance to prevent multiple instances
  // This ensures the same backend instance is reused even if component remounts
  const backend = useMemo(() => getBackend(), []);

  return (
    <DndProvider backend={backend}>
      <div className="p-4 md:p-8 h-screen overflow-x-auto">
        <PageHeader
          title="Tablero Kanban"
          subtitle="Arrastra las tarjetas para cambiar su estado"
          action={{
            label: 'Nueva Tarea',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 pb-6 md:pb-8 overflow-x-auto md:overflow-x-auto">
          {columns.map((column) => {
            const columnIssues = issues.filter((issue) => issue.status === column.status);
            return (
              <Column
                key={column.status}
                title={column.title}
                status={column.status}
                issues={columnIssues}
                count={columnIssues.length}
                color={column.color}
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
      />
    </DndProvider>
  );
}

export default function KanbanPage() {
  return (
    <LayoutWithSidebar>
      <Kanban />
    </LayoutWithSidebar>
  );
}
