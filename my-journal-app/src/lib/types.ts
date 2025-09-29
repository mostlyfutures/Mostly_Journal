// Core data interfaces for the decentralized journal app

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  owner_address: `0x${string}`;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  owner_address: `0x${string}`;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  folder_id: string | null;
}

export interface CreateFolderInput {
  name: string;
  parent_id: string | null;
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  folder_id?: string | null;
}

// UI State interfaces
export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'note';
  children: TreeNode[];
  parent_id: string | null;
}

export interface AuthState {
  isConnected: boolean;
  address: `0x${string}` | null;
  isLoading: boolean;
  error: string | null;
}

// Tableland specific types
export interface TableMetadata {
  name: string;
  statement: string;
}

export type AuthProvider = 'privy' | 'siwe';
