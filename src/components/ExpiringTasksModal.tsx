'use client'

import React from 'react';
import Link from 'next/link';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, AlertTriangle, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Issue } from '@/context/AppContext';

const EXPIRING_DAYS = 7;

export function getExpiringIssues(
  issues: Issue[],
  currentUserId: string | undefined,
  role: 'user' | 'admin' | 'team_lead'
): Issue[] {
  if (!currentUserId) return [];
  const now = new Date();
  const limit = addDays(now, EXPIRING_DAYS);
  const candidate = issues.filter((issue) => {
    if (issue.status === 'done' || !issue.dueDate) return false;
    const due = parseISO(issue.dueDate);
    if (due > limit) return false;
    if (role === 'user') return issue.assignedTo === currentUserId;
    return true;
  });
  return candidate.sort((a, b) => {
    const dA = a.dueDate ? parseISO(a.dueDate).getTime() : 0;
    const dB = b.dueDate ? parseISO(b.dueDate).getTime() : 0;
    return dA - dB;
  });
}

interface ExpiringTasksModalProps {
  open: boolean;
  onClose: () => void;
  issues: Issue[];
  onDismiss?: () => void;
}

export function ExpiringTasksModal({ open, onClose, issues, onDismiss }: ExpiringTasksModalProps) {
  const handleClose = () => {
    onDismiss?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Tareas por vencer</DialogTitle>
          </div>
          <DialogDescription>
            Las siguientes tareas vencen en los próximos {EXPIRING_DAYS} días. Revisa y actualiza su estado si es necesario.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {issues.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No hay tareas por vencer en los próximos {EXPIRING_DAYS} días.
            </p>
          ) : (
            <ul className="space-y-3">
              {issues.map((issue) => {
                const dueDate = issue.dueDate ? parseISO(issue.dueDate) : null;
                const isOverdue = dueDate && isBefore(dueDate, new Date());
                return (
                  <li key={issue.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <Calendar className={`h-4 w-4 mt-0.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <Link
                        href="/tareas"
                        className="font-medium text-gray-900 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                        onClick={handleClose}
                      >
                        {issue.title}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        {dueDate && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {isOverdue ? 'Vencida' : 'Vence'}: {format(dueDate, "d 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        )}
                        <span className="capitalize"> · {issue.status}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Entendido
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
