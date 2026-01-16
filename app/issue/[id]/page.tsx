'use client'

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { User, Calendar, MessageSquare, Send, Clock } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { PageHeader } from '@/components/PageHeader';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { DateDisplay } from '@/components/DateDisplay';

export default function DetalleIssue() {
  const params = useParams();
  const id = params.id as string;
  const { issues, addComment, users, user: currentUser } = useApp();
  const router = useRouter();
  const [newComment, setNewComment] = useState('');

  const issue = issues.find((i) => i.id === id);

  if (!issue) {
    return (
      <LayoutWithSidebar>
        <div className="p-4 md:p-8">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl text-gray-800 mb-4">Issue no encontrado</h1>
            <button
              onClick={() => router.back()}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Volver atrás
            </button>
          </div>
        </div>
      </LayoutWithSidebar>
    );
  }

  const assignedUser = users.find((u) => u.id === issue.assignedTo);
  const createdByUser = users.find((u) => u.id === issue.createdBy);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(issue.id, newComment);
      setNewComment('');
    }
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <PageHeader title="" subtitle="" showBack />

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Issue #{issue.id}</span>
              </div>
              <h1 className="text-xl md:text-3xl text-gray-800 mb-4">{issue.title}</h1>
              <div className="flex items-center gap-3">
                <Badge variant="priority" value={issue.priority} />
                <Badge variant="status" value={issue.status} />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-gray-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Descripción
            </h2>
            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {issue.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Asignado a</span>
              </div>
              {assignedUser ? (
                <div className="flex items-center gap-2">
                  <Avatar name={assignedUser.name} size="sm" />
                  <span className="text-gray-800">{assignedUser.name}</span>
                </div>
              ) : (
                <span className="text-gray-500">Sin asignar</span>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Creado por</span>
              </div>
              {createdByUser && (
                <div className="flex items-center gap-2">
                  <Avatar name={createdByUser.name} size="sm" />
                  <span className="text-gray-800">{createdByUser.name}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Fecha de creación</span>
              </div>
              <p className="text-gray-800">
                <DateDisplay date={issue.createdAt} format="date" />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <h2 className="text-lg md:text-xl text-gray-800 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comentarios ({issue.comments.length})
          </h2>

          <div className="space-y-4 mb-6">
            {issue.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={comment.userName} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{comment.userName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <DateDisplay date={comment.createdAt} format="datetime" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 pl-11">{comment.text}</p>
              </div>
            ))}
            {issue.comments.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No hay comentarios aún</p>
                <p className="text-sm text-gray-400 mt-1">Sé el primero en comentar</p>
              </div>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-3">
            <div className="hidden sm:block">
              <Avatar name={currentUser?.name || 'Usuario'} size="md" />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                <span>Enviar</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
