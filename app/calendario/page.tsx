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
  const { issues } = useApp();
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
      return '#9ca3af'; // gray-400
    } else if (issue.status === 'in-progress') {
      return '#3b82f6'; // blue-500
    } else if (issue.status === 'review') {
      return '#a855f7'; // purple-500
    }
    
    // Then priority colors
    if (issue.priority === 'high') {
      return '#ef4444'; // red-500
    } else if (issue.priority === 'medium') {
      return '#eab308'; // yellow-500
    } else {
      return '#22c55e'; // green-500
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
      <div style={{ padding: '1rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem', paddingRight: '4rem' }}>
            Calendario de Tareas
          </h1>
          <p style={{ fontSize: '1rem', color: '#4b5563' }}>Visualiza tus tareas por fecha</p>
        </div>

        {/* Mobile View: Calendar + List */}
        <div className="block md:hidden">
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', width: '100%' }}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={month}
              onMonthChange={setMonth}
              className="rounded-md border-0 w-full"
              classNames={{
                table: 'w-full',
                row: 'flex w-full mt-2 justify-between',
                cell: 'flex-1 flex justify-center',
                head_row: 'flex w-full justify-between',
                head_cell: 'flex-1 text-center'
              }}
              modifiers={{
                hasIssues: getDatesWithIssues(),
              }}
              modifiersClassNames={{
                hasIssues: 'bg-indigo-50',
              }}
              locale={es}
            />
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CalendarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#4f46e5' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                  : 'Selecciona una fecha'}
              </h2>
            </div>

            {selectedDateIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
                <Clock style={{ width: '3rem', height: '3rem', margin: '0 auto 0.75rem', color: '#9ca3af' }} />
                <p style={{ fontSize: '0.875rem' }}>No hay tareas para esta fecha</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedDateIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => router.push(`/issue/${issue.id}`)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  >
                    <h3 style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {issue.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: getIssueColor(issue),
                        color: 'white',
                        fontSize: '0.75rem'
                      }}>
                        {getStatusText(issue.status)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop/Tablet View: Google Calendar Style Grid */}
        <div className="hidden md:block">
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Header with navigation */}
            <div style={{
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              padding: '1rem 1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                  </button>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    textTransform: 'capitalize',
                    minWidth: '200px',
                    textAlign: 'center'
                  }}>
                    {format(month, "MMMM yyyy", { locale: es })}
                  </h2>
                  <button
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight style={{ width: '1.25rem', height: '1.25rem', color: '#4b5563' }} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setMonth(new Date());
                    setSelectedDate(new Date());
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  Hoy
                </button>
              </div>
            </div>

            {/* Calendar Grid - Google Calendar Style */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '800px' }}>
                {/* Days of week header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}>
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => (
                    <div
                      key={day}
                      style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#4b5563',
                        padding: '0.75rem 0.5rem',
                        borderLeft: index > 0 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid - Days */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {getDaysInMonthView().map((dayInfo, index) => {
                    const { date: currentDate, isCurrentMonth } = dayInfo;
                    const dayIssues = isCurrentMonth ? getIssuesForDate(currentDate) : [];
                    const isSelected = selectedDate && isSameDay(currentDate, selectedDate);
                    const isToday = isSameDay(currentDate, new Date());

                    const cellStyle: React.CSSProperties = {
                      minHeight: '140px',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      padding: '0.5rem',
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                      ...(index % 7 === 0 && { borderLeft: '1px solid #e5e7eb' }),
                      ...(!isCurrentMonth
                        ? { backgroundColor: '#f9fafb', opacity: 0.4 }
                        : isSelected || isToday
                        ? { backgroundColor: '#dbeafe' }
                        : { backgroundColor: 'white' })
                    };

                    return (
                      <div
                        key={`${currentDate.getTime()}-${index}`}
                        style={cellStyle}
                        onClick={() => isCurrentMonth && setSelectedDate(currentDate)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && isCurrentMonth) {
                            e.preventDefault();
                            setSelectedDate(currentDate);
                          }
                        }}
                        role={isCurrentMonth ? 'button' : undefined}
                        tabIndex={isCurrentMonth ? 0 : undefined}
                        onMouseEnter={(e) => {
                          if (isCurrentMonth && !isSelected && !isToday) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isCurrentMonth && !isSelected && !isToday) {
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        {/* Day Number */}
                        <div style={{ marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              ...(isSelected || isToday
                                ? { backgroundColor: '#2563eb', color: 'white' }
                                : !isCurrentMonth
                                ? { color: '#9ca3af' }
                                : { color: '#374151' })
                            }}
                          >
                            {currentDate.getDate()}
                          </span>
                        </div>

                        {/* Issues as colored rectangles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {dayIssues.slice(0, 4).map((issue) => {
                            const bgColor = getIssueColor(issue);
                            const truncatedTitle = issue.title.length > 20
                              ? issue.title.substring(0, 17) + '...'
                              : issue.title;

                            return (
                              <button
                                key={issue.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/issue/${issue.id}`);
                                }}
                                style={{
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  color: 'white',
                                  backgroundColor: bgColor,
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'opacity 0.2s, box-shadow 0.2s',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.9';
                                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                                title={`${issue.title} - ${getStatusText(issue.status)}`}
                              >
                                {truncatedTitle}
                              </button>
                            );
                          })}
                          {dayIssues.length > 4 && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              padding: '0.25rem 0.5rem'
                            }}>
                              +{dayIssues.length - 4} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              padding: '1rem 1.5rem'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#4b5563' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '0.25rem' }}></div>
                  <span>Alta prioridad</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '0.25rem' }}></div>
                  <span>Media prioridad</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '0.25rem' }}></div>
                  <span>Baja prioridad</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#3b82f6', borderRadius: '0.25rem' }}></div>
                  <span>En progreso</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#a855f7', borderRadius: '0.25rem' }}></div>
                  <span>En revisión</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#9ca3af', borderRadius: '0.25rem' }}></div>
                  <span>Completada</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{
          marginTop: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: '1rem'
        }} className="md:grid-cols-4">
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Total Tareas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>{issues.length}</p>
              </div>
              <CalendarIcon style={{ width: '2rem', height: '2rem', color: '#4f46e5', opacity: 0.5 }} />
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Por Hacer</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {issues.filter(i => i.status === 'todo').length}
                </p>
              </div>
              <div style={{ width: '2rem', height: '2rem', backgroundColor: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#4b5563', borderRadius: '50%' }}></div>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>En Progreso</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {issues.filter(i => i.status === 'in-progress').length}
                </p>
              </div>
              <div style={{ width: '2rem', height: '2rem', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#2563eb', borderRadius: '50%' }}></div>
              </div>
            </div>
          </div>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>Completadas</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  {issues.filter(i => i.status === 'done').length}
                </p>
              </div>
              <div style={{ width: '2rem', height: '2rem', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '1rem', height: '1rem', backgroundColor: '#22c55e', borderRadius: '50%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutWithSidebar>
  );
}
