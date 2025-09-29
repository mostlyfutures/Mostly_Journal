'use client';

import { useState, useEffect, useRef } from 'react';
import { Note } from '@/lib/types';

interface NoteEditorProps {
  note: Note | null;
  onSave: (updates: { title?: string; content?: string }) => Promise<void>;
  onAutoSave: (content: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export default function NoteEditor({ 
  note, 
  onSave, 
  onAutoSave, 
  isLoading = false, 
  className = '' 
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasUnsavedChanges(false);
      setLastSaved(new Date(note.updated_at));
    } else {
      setTitle('');
      setContent('');
      setHasUnsavedChanges(false);
      setLastSaved(null);
    }
  }, [note]);

  // Auto-save functionality
  useEffect(() => {
    if (!note || !hasUnsavedChanges) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (content !== note.content) {
        setIsAutoSaving(true);
        try {
          await onAutoSave(content);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, note, hasUnsavedChanges, onAutoSave]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleManualSave = async () => {
    if (!note) return;

    try {
      const updates: { title?: string; content?: string } = {};
      
      if (title !== note.title) {
        updates.title = title;
      }
      if (content !== note.content) {
        updates.content = content;
      }

      if (Object.keys(updates).length > 0) {
        await onSave(updates);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  if (!note) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📝</div>
          <p className="text-lg font-medium">Select a note to start editing</p>
          <p className="text-sm">Or create a new note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with save status */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isAutoSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600">Saving...</span>
              </>
            ) : hasUnsavedChanges ? (
              <>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-orange-600">Unsaved changes</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">
                  {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved'}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleManualSave}
          disabled={isLoading || !hasUnsavedChanges}
          className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Save (Ctrl+S)
        </button>
      </div>

      {/* Editor content */}
      <div className="flex-1 flex flex-col p-6 bg-white overflow-auto">
        {/* Title input */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          disabled={isLoading}
          className="w-full text-3xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent mb-6 resize-none"
        />

        {/* Content textarea */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={(e) => {
            handleContentChange(e.target.value);
            adjustTextareaHeight();
          }}
          placeholder="Start writing your note..."
          disabled={isLoading}
          className="w-full text-lg text-gray-800 placeholder-gray-400 border-none outline-none bg-transparent resize-none leading-relaxed min-h-[300px] font-serif"
          style={{ fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
        />
      </div>

      {/* Footer with metadata */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <div>
            Created: {new Date(note.created_at).toLocaleDateString()}
          </div>
          <div>
            Last updated: {new Date(note.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
