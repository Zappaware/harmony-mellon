'use client'

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LayoutWithSidebar } from '@/components/LayoutWithSidebar';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, getDaysInMonth, getDay, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useRouter } from 'next/navigation';

export default function CalendarioPage() {
  const { issues, users } = useApp();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(new Date());

  // Get issues for selected date
  const getIssuesForDate = (date: Date) => {
    if (!date) return [];
    return issues.filter(issue => {
      const issueDate = parseISO(issue.createdAt);
      return isSameDay(issueDate, date);
    });
  };

  // Get all dates that have issues
  const getDatesWithIssues = () => {
    return issues.map(issue => parseISO(issue.createdAt));
  };

  const selectedDateIssues = selectedDate ? getIssuesForDate(selectedDate) : [];

  // Get all days in the month view (including previous/next month days)
  const getDaysInMonthView = () => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const startDay = getDay(start); // 0 = Sunday, 1 = Monday, etc.
    
    // Adjust to start week on Monday (1) instead of Sunday (0)
    const daysBefore = startDay === 0 ? 6 : startDay - 1;
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month days
    for (let i = daysBefore - 1; i >= 0; i--) {
      const date = subDays(start, i + 1);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Current month days
    const daysInMonth = getDaysInMonth(month);
    for (let i = 0; i < daysInMonth; i++) {
      const date = addDays(start, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month days to fill the last week (6 weeks total = 42 days)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = addDays(end, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const getIssueColor = (issue: typeof issues[0]) => {
    // Status colors take priority
    if (issue.status === 'done') {
      return 'bg-gray-400';
    } else if (issue.status === 'in-progress') {
      return 'bg-blue-500';
    } else if (issue.status === 'review') {
      return 'bg-purple-500';
    }
    
    // Then priority colors
    if (issue.priority === 'high') {
      return 'bg-red-500';
    } else if (issue.priority === 'medium') {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'todo': 'Por hacer',
      'in-progress': 'En progreso',
      'review': 'En revisión',
      'done': 'Completada'
    };
    return statusMap[status] || status;
  };

  return (
    <LayoutWithSidebar>
      <div className="p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-3xl text-gray-800 mb-2 pr-12 md:pr-16">Calendario de Tareas</h1>
          <p className="text-sm md:text-base text-gray-600">Visualiza tus tareas por fecha</p>
        </div>

        {/* Mobile View: Calendar + List */}
        <div className="md:hidden space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border-0"
              modifiers={{
                hasIssues: getDatesWithIssues(),
              }}
              modifiersClassNames={{
                hasIssues: 'bg-indigo-50',
              }}
              locale={es}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                  : 'Selecciona una fecha'}
              </h2>
            </div>

            {selectedDateIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No hay tareas para esta fecha</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => router.push(`/issue/${issue.id}`)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded ${getIssueColor(issue)} text-white`}>
                        {getStatusText(issue.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop/Tablet View: Traditional Calendar Grid */}
        <div className="hidden md:block">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800 capitalize">
                  {format(month, "MMMM yyyy", { locale: es })}
                </h2>
                <button
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => {
                  setMonth(new Date());
                  setSelectedDate(new Date());
                }}
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* Calendar Grid Header - Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid - Days */}
            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonthView().map((dayInfo, index) => {
                const { date: currentDate, isCurrentMonth } = dayInfo;
                const dayIssues = isCurrentMonth ? getIssuesForDate(currentDate) : [];
                const isSelected = selectedDate && isSameDay(currentDate, selectedDate);
                const isToday = isSameDay(currentDate, new Date());

                return (
                  <div
                    key={index}
                    onClick={() => isCurrentMonth && setSelectedDate(currentDate)}
                    className={`
                      min-h-[120px] p-2 border rounded cursor-pointer transition-all
                      ${!isCurrentMonth 
                        ? 'bg-gray-50 border-gray-200 opacity-40' 
                        : isSelected
                        ? 'bg-indigo-50 border-indigo-400 border-2'
                        : isToday
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    {/* Day Number */}
                    <div className="mb-2">
                      <span
                        className={`
                          text-sm font-semibold
                          ${isSelected
                            ? 'text-indigo-700'
                            : isToday
                            ? 'text-blue-600'
                            : !isCurrentMonth
                            ? 'text-gray-400'
                            : 'text-gray-700'
                          }
                        `}
                      >
                        {currentDate.getDate()}
                      </span>
                    </div>

                    {/* Issues as colored rectangles with full title */}
                    <div className="space-y-1.5">
                      {dayIssues.map((issue) => {
                        const bgColor = getIssueColor(issue);

                        return (
                          <button
                            key={issue.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/issue/${issue.id}`);
                            }}
                            className={`
                              w-full text-left px-2 py-1.5 rounded text-xs font-medium text-white
                              ${bgColor}
                              hover:opacity-90 hover:shadow-sm transition-all
                              block truncate
                            `}
                            title={`${issue.title} - ${getStatusText(issue.status)}`}
                          >
                            {issue.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Alta prioridad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Media prioridad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Baja prioridad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>En progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>En revisión</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded"></div>
                <span>Completada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tareas</p>
                <p className="text-2xl font-bold text-gray-800">{issues.length}</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-indigo-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por Hacer</p>
                <p className="text-2xl font-bold text-gray-800">
                  {issues.filter(i => i.status === 'todo').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-800">
                  {issues.filter(i => i.status === 'in-progress').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {issues.filter(i => i.status === 'done').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
