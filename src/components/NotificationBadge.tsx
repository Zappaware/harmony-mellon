'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare, UserPlus, CheckCircle2 } from 'lucide-react';
import { api, ApiNotification } from '@/services/api';
import { DateDisplay } from './DateDisplay';

export function NotificationBadge() {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setLoading(false);
          return;
        }
        const allNotifications = await api.getNotifications();
        const unread = allNotifications.filter(n => !n.read);
        setNotifications(allNotifications.slice(0, 10)); // Show last 10
        setUnreadCount(unread.length);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notification: ApiNotification) => {
    if (!notification.read) {
      try {
        await api.markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Navigate based on notification type
    if (notification.related_id) {
      if (notification.type === 'comment' || notification.type === 'status') {
        router.push(`/issue/${notification.related_id}`);
      } else if (notification.type === 'assignment') {
        router.push(`/issue/${notification.related_id}`);
      }
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'assignment':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'user':
        return <UserPlus className="w-4 h-4 text-purple-600" />;
      case 'status':
        return <Bell className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:bg-gray-50 border border-gray-200"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} no leídas)` : ''}`}
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-[60] max-h-[500px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
            <Link
              href="/notificaciones"
              onClick={() => setIsOpen(false)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Ver todas
            </Link>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          <DateDisplay date={notification.created_at} format="datetime" />
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
