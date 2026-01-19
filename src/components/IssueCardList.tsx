'use client'

import React from 'react';
import Link from 'next/link';
import { Issue, User } from '@/context/AppContext';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Calendar, MessageSquare, FolderKanban } from 'lucide-react';
import { DateDisplay } from './DateDisplay';
import { useApp } from '@/context/AppContext';

interface IssueCardListProps {
  issue: Issue;
  assignedUser?: User;
  showProject?: boolean;
}

export function IssueCardList({ issue, assignedUser, showProject }: IssueCardListProps) {
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
              <Avatar name={assignedUser.name} size="sm" />
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
          <Badge variant="priority" value={issue.priority} />
          <Badge variant="status" value={issue.status} />
        </div>
      </div>
    </Link>
  );
}
