'use client';

import { useState } from 'react';
import { Note } from '@/lib/types';
import { NoteService } from '@/services/noteService';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: (title: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  onMoveNote: (noteId: string, targetFolderId: string | null) => Promise<void>;
  currentFolderName?: string;
  isLoading?: boolean;
  className?: string;
}

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (noteId: string) => void;
  onDelete: (noteId: string) => Promise<void>;
  onMove: (noteId: string, targetFolderId: string | null) => Promise<void>;
}

function NoteItem({ note, isSelected, onSelect, onDelete, onMove }: NoteItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      try {
        await onDelete(note.id);
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPreview = (content: string, maxLength: number = 100) => {
    const cleanContent = content.replace(/\n+/g, ' ').trim();
    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'
      : cleanContent;
  };

  return (
    <div
      className={`group relative p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onSelect(note.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowMoveMenu(false);
      }}
    >
      {/* Note Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-start justify-between mb-1">
          <h4 className={`text-sm font-medium truncate ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {note.title || 'Untitled'}
          </h4>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatDate(note.updated_at)}
          </span>
        </div>
        
        {note.content && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {getPreview(note.content)}
          </p>
        )}
      </div>

      {/* Action Menu */}
      {showActions && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-sm border">
          {/* Move Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(!showMoveMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Move note"
            >
              <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {showMoveMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white border rounded shadow-lg z-10 min-w-32">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(note.id, null);
                    setShowMoveMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                >
                  Move to Root
                </button>
                {/* TODO: Add folder options dynamically */}
              </div>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 hover:bg-red-100 rounded"
            title="Delete note"
          >
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function NoteList({
  notes,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  onMoveNote,
  currentFolderName,
  isLoading = false,
  className = '',
}: NoteListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateNote = async () => {
    const title = newNoteTitle.trim() || 'Untitled';
    const existingTitles = notes.map(note => note.title);
    const uniqueTitle = NoteService.generateUniqueTitle(existingTitles, title);
    
    try {
      await onCreateNote(uniqueTitle);
      setNewNoteTitle('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  // Filter notes based on search
  const filteredNotes = searchQuery 
    ? NoteService.searchNotes(notes, searchQuery)
    : notes;

  // Sort notes by update time (most recent first)
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b border-gray-100 pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentFolderName || 'All Notes'}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Note
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Create Note Input */}
      {isCreating && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNote();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewNoteTitle('');
                }
              }}
              placeholder="Note title..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNoteTitle('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-auto bg-white">
        {sortedNotes.length > 0 ? (
          sortedNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onSelect={onNoteSelect}
              onDelete={onDeleteNote}
              onMove={onMoveNote}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? (
              <>
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">No notes found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-500 text-sm hover:text-blue-600 mt-1"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <p className="text-sm mb-2">
                  {currentFolderName ? `No notes in "${currentFolderName}"` : 'No notes yet'}
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="text-blue-500 text-sm hover:text-blue-600"
                >
                  Create your first note
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
