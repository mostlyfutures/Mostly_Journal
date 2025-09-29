import { Note, Folder, TreeNode } from '@/lib/types';

// Business logic service for note operations
export class NoteService {
  // Build hierarchical tree structure from flat arrays
  static buildHierarchicalTree(notes: Note[], folders: Folder[]): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Create folder nodes
    folders.forEach(folder => {
      const node: TreeNode = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        children: [],
        parent_id: folder.parent_id,
      };
      nodeMap.set(folder.id, node);
    });

    // Create note nodes
    notes.forEach(note => {
      const node: TreeNode = {
        id: note.id,
        name: note.title,
        type: 'note',
        children: [],
        parent_id: note.folder_id,
      };
      nodeMap.set(note.id, node);
    });

    // Build hierarchy
    nodeMap.forEach(node => {
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent doesn't exist, add to root
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort children: folders first, then notes, both alphabetically
    const sortChildren = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    const applySorting = (nodes: TreeNode[]): TreeNode[] => {
      return sortChildren(nodes).map(node => ({
        ...node,
        children: applySorting(node.children),
      }));
    };

    return applySorting(rootNodes);
  }

  // Get folder breadcrumb path
  static getFolderPath(folderId: string | null, folders: Folder[]): Folder[] {
    if (!folderId) return [];

    const path: Folder[] = [];
    let currentId = folderId;

    while (currentId) {
      const folder = folders.find(f => f.id === currentId);
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parent_id;
    }

    return path;
  }

  // Search notes by title and content
  static searchNotes(notes: Note[], query: string): Note[] {
    if (!query.trim()) return notes;

    const searchTerm = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  }

  // Get recent notes (last 10, sorted by update time)
  static getRecentNotes(notes: Note[], limit: number = 10): Note[] {
    return [...notes]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);
  }

  // Generate a unique title for new notes
  static generateUniqueTitle(existingTitles: string[], baseTitle: string = 'Untitled'): string {
    if (!existingTitles.includes(baseTitle)) {
      return baseTitle;
    }

    let counter = 1;
    let newTitle = `${baseTitle} ${counter}`;
    
    while (existingTitles.includes(newTitle)) {
      counter++;
      newTitle = `${baseTitle} ${counter}`;
    }

    return newTitle;
  }
}
