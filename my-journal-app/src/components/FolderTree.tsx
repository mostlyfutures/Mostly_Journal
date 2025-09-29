'use client';

import { useState, useCallback } from 'react';
import { TreeNode, Folder } from '@/lib/types';
import { NoteService } from '@/services/noteService';

interface FolderTreeProps {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  onSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

function TreeNodeComponent({
  node,
  level,
  isSelected,
  onSelect,
  onCreateFolder,
  onDeleteFolder,
  expandedNodes,
  onToggleExpand,
}: TreeNodeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showActions, setShowActions] = useState(false);

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;
  const indentLevel = level * 20;

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await onCreateFolder(newFolderName, node.type === 'folder' ? node.id : null);
      setNewFolderName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteFolder = async () => {
    if (window.confirm(`Are you sure you want to delete "${node.name}"? All contents will be moved to the parent folder.`)) {
      try {
        await onDeleteFolder(node.id);
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  if (node.type === 'note') {
    return null; // Notes are handled by NoteList component
  }

  return (
    <div>
      {/* Folder Node */}
      <div
        className={`group flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${indentLevel + 8}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-1 hover:bg-gray-200 rounded mr-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* Folder Icon and Name */}
        <div
          className="flex items-center flex-1 min-w-0"
          onClick={() => onSelect(node.id)}
        >
          <svg className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-sm text-gray-700 truncate">{node.name}</span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating(true);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Create subfolder"
            >
              <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder();
              }}
              className="p-1 hover:bg-red-100 rounded"
              title="Delete folder"
            >
              <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Create Folder Input */}
      {isCreating && (
        <div
          className="py-1 px-2"
          style={{ paddingLeft: `${indentLevel + 32}px` }}
        >
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Folder name..."
              className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
              className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children
            .filter(child => child.type === 'folder')
            .map(child => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
                isSelected={child.id === currentFolderId}
                onSelect={onSelect}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  folders,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onDeleteFolder,
  isLoading = false,
  className = '',
}: FolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isCreatingRoot, setIsCreatingRoot] = useState(false);
  const [newRootFolderName, setNewRootFolderName] = useState('');

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleCreateRootFolder = async () => {
    if (!newRootFolderName.trim()) return;
    
    try {
      await onCreateFolder(newRootFolderName, null);
      setNewRootFolderName('');
      setIsCreatingRoot(false);
    } catch (error) {
      console.error('Error creating root folder:', error);
    }
  };

  // Build tree structure
  const treeNodes = NoteService.buildHierarchicalTree([], folders);
  const rootFolders = treeNodes.filter(node => node.type === 'folder');

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Folders</h3>
        <button
          onClick={() => setIsCreatingRoot(true)}
          className="p-1 hover:bg-gray-100 rounded"
          title="Create new folder"
        >
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Root Level */}
      <div className="py-2">
        {/* All Notes (Root) */}
        <div
          onClick={() => onFolderSelect(null)}
          className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer transition-colors ${
            currentFolderId === null ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
        >
          <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <span className="text-sm text-gray-700">All Notes</span>
        </div>

        {/* Create Root Folder Input */}
        {isCreatingRoot && (
          <div className="px-3 py-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newRootFolderName}
                onChange={(e) => setNewRootFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateRootFolder();
                  } else if (e.key === 'Escape') {
                    setIsCreatingRoot(false);
                    setNewRootFolderName('');
                  }
                }}
                placeholder="Folder name..."
                className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleCreateRootFolder}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingRoot(false);
                  setNewRootFolderName('');
                }}
                className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Folder Tree */}
        {rootFolders.map(folder => (
          <TreeNodeComponent
            key={folder.id}
            node={folder}
            level={0}
            isSelected={folder.id === currentFolderId}
            onSelect={onFolderSelect}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
          />
        ))}

        {/* Empty State */}
        {rootFolders.length === 0 && !isCreatingRoot && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <p className="text-sm">No folders yet</p>
            <button
              onClick={() => setIsCreatingRoot(true)}
              className="text-blue-500 text-sm hover:text-blue-600 mt-1"
            >
              Create your first folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
