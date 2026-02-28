'use client'

import React from 'react';
import Link from 'next/link';
import { Issue, User } from '@/context/AppContext';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Calendar, MessageSquare, FolderKanban, Star } from 'lucide-react';
import { DateDisplay } from './DateDisplay';
import { useApp } from '@/context/AppContext';

/** Compact card for grid layout (2-column task display) */
export function IssueCardGrid({ issue, assignedUser, showApprovedStar }: { issue: Issue; assignedUser?: User; showApprovedStar?: boolean }) {
  return (
    <Link
      href={`/issue/${issue.id}`}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 flex-1 min-w-0">{issue.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {showApprovedStar && issue.approvedAt && (
            <span title="Aprobada" aria-label="Aprobada"><Star className="w-4 h-4 fill-amber-500 text-amber-500" /></span>
          )}
          <Badge variant="priority" value={issue.priority} className="text-xs" />
        </div>
      </div>
      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{issue.description || '—'}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        {assignedUser ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={assignedUser.name} size="sm" src={assignedUser.avatar} />
            <span className="truncate">{assignedUser.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-gray-400">Sin asignar</span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-0.5">
            <Calendar className="w-3 h-3" />
            <DateDisplay date={issue.createdAt} format="date" />
          </div>
          {issue.comments.length > 0 && (
            <div className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3" />
              <span>{issue.comments.length}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Badge variant="status" value={issue.status} className="text-xs" />
      </div>
    </Link>
  );
}

interface IssueCardListProps {
  issue: Issue;
  assignedUser?: User;
  showProject?: boolean;
  /** Show a star when the task was approved by a team_lead/admin (Planner/Branding score) */
  showApprovedStar?: boolean;
}

export function IssueCardList({ issue, assignedUser, showProject, showApprovedStar }: IssueCardListProps) {
  const { projects } = useApp();
  const project = showProject && issue.projectId 
    ? projects.find(p => p.id === issue.projectId)
    : null;

  return (
    <Link
      href={`/issue/${issue.id}`}
      className="p-6 hover:bg-gray-50 transition-colors block border-b border-gray-200 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            {assignedUser && (
              <Avatar name={assignedUser.name} size="sm" src={assignedUser.avatar} />
            )}
            <div className="flex-1">
              <h3 className="text-gray-800 mb-1 truncate">{issue.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <DateDisplay date={issue.createdAt} format="date" />
            </div>
            {showProject && project && (
              <div className="flex items-center gap-1">
                <FolderKanban className="w-4 h-4" />
                <span>{project.name}</span>
              </div>
            )}
            {issue.comments.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{issue.comments.length}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {showApprovedStar && issue.approvedAt && (
            <span className="inline-flex items-center gap-1 text-amber-600" title="Aprobada por líder o administrador">
              <Star className="w-5 h-5 fill-amber-500" />
            </span>
          )}
          <Badge variant="priority" value={issue.priority} />
          <Badge variant="status" value={issue.status} />
        </div>
      </div>
    </Link>
  );
}
