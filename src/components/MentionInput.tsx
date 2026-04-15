'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/context/AppContext';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
}

export function MentionInput({ value, onChange, users, placeholder, className = '', onSubmit }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [mentionStartIdx, setMentionStartIdx] = useState(-1);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(suggestionFilter.toLowerCase())
  ).slice(0, 6);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart ?? newValue.length;
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (atMatch) {
      setMentionStartIdx(cursorPos - atMatch[0].length);
      setSuggestionFilter(atMatch[1]);
      setShowSuggestions(true);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
      setMentionStartIdx(-1);
    }
  }, [onChange]);

  const insertMention = useCallback((user: User) => {
    if (mentionStartIdx < 0) return;
    const before = value.slice(0, mentionStartIdx);
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const after = value.slice(cursorPos);
    const mention = `@${user.name} `;
    const newValue = before + mention + after;
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStartIdx(-1);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newCursorPos = before.length + mention.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current.focus();
      }
    });
  }, [mentionStartIdx, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[selectedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Enter' && !showSuggestions) {
      e.preventDefault();
      onSubmit?.();
    }
  }, [showSuggestions, filteredUsers, selectedSuggestion, insertMention, onSubmit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
            Mencionar usuario
          </div>
          {filteredUsers.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                idx === selectedSuggestion ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{user.name}</span>
              <span className="text-xs text-gray-400 ml-auto shrink-0">
                {user.role === 'admin' ? 'Admin' : user.role === 'team_lead' ? 'Líder' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Parses a comment string and returns JSX with highlighted @mentions.
 * Matches @UserName against known user names (longest match first).
 */
export function renderMentions(text: string, users: User[]): React.ReactNode {
  if (!text || users.length === 0) return text;

  // Sort by name length descending so "Juan Carlos" matches before "Juan"
  const sortedUsers = [...users].sort((a, b) => b.name.length - a.name.length);

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    const atIdx = remaining.indexOf('@');
    if (atIdx === -1) {
      parts.push(remaining);
      break;
    }

    if (atIdx > 0) {
      parts.push(remaining.slice(0, atIdx));
    }

    const afterAt = remaining.slice(atIdx + 1);
    let matched = false;
    for (const user of sortedUsers) {
      if (afterAt.toLowerCase().startsWith(user.name.toLowerCase())) {
        const charAfter = afterAt[user.name.length];
        if (!charAfter || charAfter === ' ' || charAfter === '\n' || charAfter === '@') {
          parts.push(
            <span key={keyIdx++} className="bg-indigo-100 text-indigo-700 rounded px-1 font-medium">
              @{user.name}
            </span>
          );
          remaining = afterAt.slice(user.name.length);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      parts.push('@');
      remaining = afterAt;
    }
  }

  return parts.length > 0 ? <>{parts}</> : text;
}
