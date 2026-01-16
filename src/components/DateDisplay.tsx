'use client'

import React, { useState, useEffect } from 'react';

interface DateDisplayProps {
  date: string | Date;
  format?: 'date' | 'datetime' | 'time';
  className?: string;
}

// Format date consistently for SSR (ISO-like format that's locale-independent)
function formatDateForSSR(date: Date, format: 'date' | 'datetime' | 'time'): string {
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'datetime':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'date':
    default:
      return `${year}-${month}-${day}`;
  }
}

export function DateDisplay({ date, format = 'date', className = '' }: DateDisplayProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Format with locale on client side after mount
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      setFormattedDate('Invalid date');
      return;
    }

    let formatted: string;
    switch (format) {
      case 'datetime':
        formatted = dateObj.toLocaleString();
        break;
      case 'time':
        formatted = dateObj.toLocaleTimeString();
        break;
      case 'date':
      default:
        formatted = dateObj.toLocaleDateString();
        break;
    }
    
    setFormattedDate(formatted);
  }, [date, format, mounted]);

  // Use consistent format for SSR to avoid hydration mismatch
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const ssrFormatted = formatDateForSSR(dateObj, format);

  // During SSR and initial render, use consistent format
  // After mount, switch to locale-specific format
  return (
    <span className={className} suppressHydrationWarning>
      {mounted && formattedDate ? formattedDate : ssrFormatted}
    </span>
  );
}
