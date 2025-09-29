'use client';

import { useState } from 'react';
import AuthButton from '@/components/AuthButton';
import FolderTree from '@/components/FolderTree';
import NoteList from '@/components/NoteList';
import NoteEditor from '@/components/NoteEditor';
import { useDb } from '@/hooks/useDb';
import { useNotes } from '@/hooks/useNotes';
import { useUserStore } from '@/lib/store';

export default function Home() {
  const { address } = useUserStore();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const db = useDb();
  const { data: folders = [], isLoading: foldersLoading } = db.useFolders();
  const notes = useNotes(currentFolderId);

  // Get current folder name for display
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const currentFolderName = currentFolder?.name;

  // Handle folder selection
  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedNoteId(null); // Clear selected note when changing folders
  };

  // Handle note selection
  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    notes.setSelectedNoteId(noteId);
    notes.setIsEditing(true);
  };

  // Handle note creation
  const handleCreateNote = async (title: string) => {
    const newNote = await notes.createNote(title);
    setSelectedNoteId(newNote.id);
  };

  // Handle folder creation
  const createFolderMutation = db.useCreateFolder();
  const handleCreateFolder = async (name: string, parentId: string | null) => {
    await createFolderMutation.mutateAsync({ name, parent_id: parentId });
  };

  // Handle folder deletion
  const deleteFolderMutation = db.useDeleteFolder();
  const handleDeleteFolder = async (folderId: string) => {
    await deleteFolderMutation.mutateAsync(folderId);
    // If we're currently in the deleted folder, go to root
    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
      setSelectedNoteId(null);
    }
  };

  // If not authenticated, show auth screen
  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Decentralized Journal
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your notes, secured on the blockchain
            </p>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
                <p className="text-gray-600 mb-4">
                  Connect your wallet to start creating and managing your decentralized notes.
                </p>
                <AuthButton className="w-full justify-center" />
              </div>
              <div className="text-sm text-gray-500 space-y-2">
                <p>✨ Decentralized storage with Tableland</p>
                <p>🔐 Wallet-based authentication</p>
                <p>📝 Real-time collaborative editing</p>
                <p>🗂️ Hierarchical folder organization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Decentralized Journal
            </h1>
            <div className="hidden sm:block text-sm text-gray-500">
              Powered by Tableland & Web3
            </div>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Folders */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <FolderTree
            folders={folders}
            currentFolderId={currentFolderId}
            onFolderSelect={handleFolderSelect}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            isLoading={foldersLoading}
          />
        </div>

        {/* Middle Panel - Notes List */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <NoteList
            notes={notes.notes}
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
            onCreateNote={handleCreateNote}
            onDeleteNote={notes.deleteNote}
            onMoveNote={notes.moveNote}
            currentFolderName={currentFolderName}
            isLoading={notes.isLoading}
          />
        </div>

        {/* Main Panel - Note Editor */}
        <div className="flex-1 bg-white">
          <NoteEditor
            note={notes.selectedNote}
            onSave={notes.updateNote}
            onAutoSave={notes.autoSave}
            isLoading={notes.isUpdating}
          />
        </div>
      </div>
    </div>
  );
}
