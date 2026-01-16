'use client'

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CheckSquare, Filter } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { IssueCardList } from '@/components/IssueCardList';
import { EmptyState } from '@/components/EmptyState';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';

export default function MisTareas() {
  const { issues, user, users } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const myIssues = issues.filter((issue) => issue.assignedTo === user?.id);

  const filteredIssues = filterStatus === 'all' 
    ? myIssues 
    : myIssues.filter(issue => issue.status === filterStatus);

  const statusCounts = {
    all: myIssues.length,
    todo: myIssues.filter(i => i.status === 'todo').length,
    'in-progress': myIssues.filter(i => i.status === 'in-progress').length,
    review: myIssues.filter(i => i.status === 'review').length,
    done: myIssues.filter(i => i.status === 'done').length,
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <PageHeader
          title="Mis Tareas"
          subtitle="Todas las tareas asignadas a ti"
        />

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todas ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'todo'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Por Hacer ({statusCounts.todo})
          </button>
          <button
            onClick={() => setFilterStatus('in-progress')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'in-progress'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            En Progreso ({statusCounts['in-progress']})
          </button>
          <button
            onClick={() => setFilterStatus('review')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'review'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            En Revisión ({statusCounts.review})
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'done'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Completadas ({statusCounts.done})
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl text-gray-800">
                {filterStatus === 'all' ? 'Todas las Tareas' : 'Tareas Filtradas'} ({filteredIssues.length})
              </h2>
            </div>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Ordenar</span>
            </button>
          </div>
          {filteredIssues.length > 0 ? (
            <div>
              {filteredIssues.map((issue) => {
                const assignedUser = users.find((u) => u.id === issue.assignedTo);
                return <IssueCardList key={issue.id} issue={issue} assignedUser={assignedUser} />;
              })}
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No hay tareas"
              description={
                filterStatus === 'all'
                  ? 'No tienes tareas asignadas en este momento'
                  : 'No tienes tareas en este estado'
              }
            />
          )}
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
