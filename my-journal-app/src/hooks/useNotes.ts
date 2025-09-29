import { useState, useCallback } from 'react';
import { useDb } from './useDb';
import { Note, TreeNode } from '@/lib/types';

// Specialized hook for notes management with UI state
export const useNotes = (currentFolderId: string | null = null) => {
  const db = useDb();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Get notes for current folder
  const { data: notes = [], isLoading, error } = db.useNotes(currentFolderId);
  const { data: allFolders = [] } = db.useFolders();

  // Mutations
  const createNoteMutation = db.useCreateNote();
  const updateNoteMutation = db.useUpdateNote();
  const deleteNoteMutation = db.useDeleteNote();

  // Get currently selected note
  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  // Create a new note
  const createNote = useCallback(async (title: string, content: string = '') => {
    try {
      const newNote = await createNoteMutation.mutateAsync({
        title,
        content,
        folder_id: currentFolderId,
      });
      setSelectedNoteId(newNote.id);
      setIsEditing(true);
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }, [createNoteMutation, currentFolderId]);

  // Update the selected note
  const updateNote = useCallback(async (updates: { title?: string; content?: string }) => {
    if (!selectedNoteId) return;
    
    try {
      const updatedNote = await updateNoteMutation.mutateAsync({
        id: selectedNoteId,
        ...updates,
      });
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }, [selectedNoteId, updateNoteMutation]);

  // Move note to different folder
  const moveNote = useCallback(async (noteId: string, targetFolderId: string | null) => {
    try {
      const updatedNote = await updateNoteMutation.mutateAsync({
        id: noteId,
        folder_id: targetFolderId,
      });
      return updatedNote;
    } catch (error) {
      console.error('Error moving note:', error);
      throw error;
    }
  }, [updateNoteMutation]);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNoteMutation.mutateAsync(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }, [deleteNoteMutation, selectedNoteId]);

  // Auto-save functionality for the editor
  const autoSave = useCallback(async (content: string) => {
    if (!selectedNote || !isEditing) return;
    
    // Only save if content has changed
    if (content !== selectedNote.content) {
      try {
        await updateNote({ content });
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [selectedNote, isEditing, updateNote]);

  // Build tree structure for hierarchical display
  const buildNoteTree = useCallback((): TreeNode[] => {
    const tree: TreeNode[] = [];
    
    // Add folders to tree
    allFolders.forEach(folder => {
      tree.push({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        children: [],
        parent_id: folder.parent_id,
      });
    });

    // Add notes to tree
    notes.forEach(note => {
      tree.push({
        id: note.id,
        name: note.title,
        type: 'note',
        children: [],
        parent_id: note.folder_id,
      });
    });

    return tree;
  }, [notes, allFolders]);

  return {
    // Data
    notes,
    selectedNote,
    isLoading,
    error: error?.message || null,
    
    // UI State
    selectedNoteId,
    setSelectedNoteId,
    isEditing,
    setIsEditing,
    
    // Actions
    createNote,
    updateNote,
    moveNote,
    deleteNote,
    autoSave,
    
    // Tree utilities
    buildNoteTree,
    
    // Mutation states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
};
