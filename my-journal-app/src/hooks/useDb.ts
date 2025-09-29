import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesService, foldersService } from '@/lib/tableland';
import { useUserStore } from '@/lib/store';
import { Note, Folder, CreateNoteInput, CreateFolderInput, UpdateNoteInput } from '@/lib/types';

// Custom hook for database operations with React Query
export const useDb = () => {
  const queryClient = useQueryClient();
  const { address } = useUserStore();

  // Notes queries and mutations
  const useNotes = (folderId?: string | null) => {
    return useQuery({
      queryKey: ['notes', address, folderId],
      queryFn: async () => {
        if (!address) return [];
        if (folderId !== undefined) {
          return await notesService.getNotesByFolder(address, folderId);
        }
        return await notesService.getNotes(address);
      },
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    });
  };

  const useCreateNote = () => {
    return useMutation({
      mutationFn: async (noteData: CreateNoteInput) => {
        if (!address) throw new Error('No user address');
        return await notesService.createNote(address, noteData);
      },
      onSuccess: () => {
        // Invalidate and refetch notes queries
        queryClient.invalidateQueries({ queryKey: ['notes', address] });
      },
    });
  };

  const useUpdateNote = () => {
    return useMutation({
      mutationFn: async (updateData: UpdateNoteInput) => {
        if (!address) throw new Error('No user address');
        return await notesService.updateNote(address, updateData);
      },
      onSuccess: (updatedNote) => {
        // Update the specific note in the cache
        queryClient.setQueryData(['notes', address], (old: Note[] = []) => {
          return old.map(note => note.id === updatedNote.id ? updatedNote : note);
        });
        // Also invalidate to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['notes', address] });
      },
    });
  };

  const useDeleteNote = () => {
    return useMutation({
      mutationFn: async (noteId: string) => {
        if (!address) throw new Error('No user address');
        await notesService.deleteNote(address, noteId);
        return noteId;
      },
      onSuccess: (deletedNoteId) => {
        // Remove the note from cache
        queryClient.setQueryData(['notes', address], (old: Note[] = []) => {
          return old.filter(note => note.id !== deletedNoteId);
        });
      },
    });
  };

  // Folders queries and mutations
  const useFolders = () => {
    return useQuery({
      queryKey: ['folders', address],
      queryFn: async () => {
        if (!address) return [];
        return await foldersService.getFolders(address);
      },
      enabled: !!address,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    });
  };

  const useCreateFolder = () => {
    return useMutation({
      mutationFn: async (folderData: CreateFolderInput) => {
        if (!address) throw new Error('No user address');
        return await foldersService.createFolder(address, folderData);
      },
      onSuccess: () => {
        // Invalidate and refetch folders queries
        queryClient.invalidateQueries({ queryKey: ['folders', address] });
      },
    });
  };

  const useDeleteFolder = () => {
    return useMutation({
      mutationFn: async (folderId: string) => {
        if (!address) throw new Error('No user address');
        await foldersService.deleteFolder(address, folderId);
        return folderId;
      },
      onSuccess: () => {
        // Invalidate both folders and notes queries since notes might have moved
        queryClient.invalidateQueries({ queryKey: ['folders', address] });
        queryClient.invalidateQueries({ queryKey: ['notes', address] });
      },
    });
  };

  return {
    // Notes operations
    useNotes,
    useCreateNote,
    useUpdateNote,
    useDeleteNote,
    
    // Folders operations
    useFolders,
    useCreateFolder,
    useDeleteFolder,
    
    // Utility
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', address] });
      queryClient.invalidateQueries({ queryKey: ['folders', address] });
    },
  };
};
