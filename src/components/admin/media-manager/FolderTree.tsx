'use client'

import { useState, useCallback } from 'react'
import { useMediaManager } from './MediaManagerProvider'
import type { FolderItem, FolderTreeNode } from './types'

// Dark theme color palette matching MediaGrid and Modal
const colors = {
  // Backgrounds
  backdrop: 'rgba(0, 0, 0, 0.85)',
  modalBg: '#0a0e1a',
  headerBg: '#0f1422',
  sidebarBg: '#0d1117',
  contentBg: '#0a0e1a',
  cardBg: '#151b2b',
  inputBg: '#1a2234',
  hoverBg: '#1e2739',

  // Borders
  border: '#1e2739',
  borderLight: '#2d3748',
  borderFocus: '#3b82f6',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textAccent: '#60a5fa',

  // Brand colors
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#60a5fa',
  success: '#10b981',
  successBg: '#064e3b',
  error: '#ef4444',
  errorBg: '#7f1d1d',
  warning: '#f59e0b',
  warningBg: '#78350f',

  // Accents
  accent: '#8b5cf6',
  accentHover: '#7c3aed',
  gold: '#f59e0b',

  // UI elements
  white: '#ffffff',
  black: '#000000',
}

interface FolderTreeItemProps {
  folder: FolderTreeNode
  depth: number
  selectedFolderId: string | null
  onSelect: (folder: FolderItem | null) => void
  onToggle: (folderId: string) => void
  onDelete: (folderId: string) => void
  onCreateChild: (parentId: string) => void
  expandedFolders: Set<string>
}

function FolderTreeItem({
  folder,
  depth,
  selectedFolderId,
  onSelect,
  onToggle,
  onDelete,
  onCreateChild,
  expandedFolders,
}: FolderTreeItemProps) {
  const [showActions, setShowActions] = useState(false)
  const hasChildren = folder.children.length > 0
  const isExpanded = expandedFolders.has(folder.id)
  const isSelected = selectedFolderId === folder.id

  return (
    <div>
      <div
        className="group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 mb-1"
        style={{
          marginLeft: `${depth * 20}px`,
          backgroundColor: isSelected ? colors.hoverBg : 'transparent',
          borderLeft: isSelected ? `3px solid ${colors.primary}` : '3px solid transparent',
        }}
        onClick={() => onSelect(folder)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle(folder.id)
          }}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
          style={{
            opacity: hasChildren ? 1 : 0,
            backgroundColor: hasChildren ? colors.cardBg : 'transparent',
          }}
        >
          {hasChildren && (
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: colors.textSecondary }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Folder icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: isSelected ? colors.cardBg : colors.inputBg }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: isSelected ? colors.primary : colors.gold }}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            {isExpanded ? (
              <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4.586a1 1 0 01.707.293L12 6h7a2 2 0 012 2v10a2 2 0 01-2 2z" />
            ) : (
              <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
            )}
          </svg>
        </div>

        {/* Folder name */}
        <span
          className="flex-1 text-base font-medium truncate"
          style={{ color: isSelected ? colors.textAccent : colors.textPrimary }}
        >
          {folder.name}
        </span>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateChild(folder.id)
              }}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ backgroundColor: colors.cardBg, color: colors.textSecondary }}
              title="Create subfolder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Delete folder "${folder.name}"? Media will be moved to root.`)) {
                  onDelete(folder.id)
                }
              }}
              className="p-2 rounded-lg transition-colors hover:bg-opacity-80"
              style={{ backgroundColor: colors.errorBg, color: colors.error }}
              title="Delete folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onToggle={onToggle}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface CreateFolderDialogProps {
  parentId?: string | null
  parentName?: string | undefined
  onClose: () => void
  onCreate: (name: string, parentId?: string) => void
}

function CreateFolderDialog({ parentId, parentName, onClose, onCreate }: CreateFolderDialogProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    await onCreate(name.trim(), parentId || undefined)
    setIsCreating(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[10003] flex items-center justify-center p-4"
      style={{ backgroundColor: colors.backdrop }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-md p-8 border"
        style={{ backgroundColor: colors.modalBg, borderColor: colors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: colors.warningBg }}
          >
            <svg className="w-6 h-6" style={{ color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-semibold" style={{ color: colors.textPrimary }}>New Folder</h3>
            {parentName && (
              <p className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>Inside: {parentName}</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter folder name..."
            autoFocus
            className="w-full px-5 py-4 text-base border-2 rounded-xl focus:outline-none transition-colors mb-6"
            style={{
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
            onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
          />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-base font-medium rounded-xl transition-colors hover:bg-opacity-80"
              style={{ color: colors.textSecondary, backgroundColor: colors.cardBg }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="px-6 py-3 text-base font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90"
              style={{ backgroundColor: colors.primary, color: colors.white }}
            >
              {isCreating ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Folder tree navigation component
 */
export function FolderTree() {
  const {
    folderTree,
    currentFolder,
    setCurrentFolder,
    toggleFolderExpanded,
    expandedFolders,
    isFoldersLoading,
    createFolder,
    deleteFolder,
    showToast,
  } = useMediaManager()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createParentId, setCreateParentId] = useState<string | null>(null)
  const [createParentName, setCreateParentName] = useState<string | undefined>()

  const handleCreateFolder = useCallback(async (name: string, parentId?: string) => {
    const folder = await createFolder(name, parentId)
    if (folder) {
      showToast('success', `Created folder "${name}"`)
    }
  }, [createFolder, showToast])

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    await deleteFolder(folderId)
    showToast('success', 'Folder deleted')
  }, [deleteFolder, showToast])

  const openCreateDialog = useCallback((parentId?: string, parentName?: string) => {
    setCreateParentId(parentId || null)
    setCreateParentName(parentName)
    setCreateDialogOpen(true)
  }, [])

  if (isFoldersLoading) {
    return (
      <div className="p-8 flex items-center justify-center" style={{ backgroundColor: colors.sidebarBg }}>
        <div
          className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent"
          style={{ borderColor: colors.primary, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.sidebarBg }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-5 border-b"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>Folders</h3>
          <button
            onClick={() => openCreateDialog()}
            className="p-2.5 rounded-xl transition-colors hover:bg-opacity-80"
            style={{ backgroundColor: colors.cardBg, color: colors.textSecondary }}
            title="Create folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* All Media (Root) */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 mb-2"
          style={{
            backgroundColor: currentFolder === null ? colors.hoverBg : 'transparent',
            borderLeft: currentFolder === null ? `3px solid ${colors.primary}` : '3px solid transparent',
          }}
          onClick={() => setCurrentFolder(null)}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: currentFolder === null ? colors.cardBg : colors.inputBg }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: currentFolder === null ? colors.primary : colors.textMuted }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span
            className="text-base font-medium"
            style={{ color: currentFolder === null ? colors.textAccent : colors.textPrimary }}
          >
            All Media
          </span>
        </div>

        {/* Divider */}
        {folderTree.length > 0 && (
          <div className="h-px my-3" style={{ backgroundColor: colors.border }} />
        )}

        {/* Folder tree */}
        {folderTree.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: colors.cardBg }}
            >
              <svg className="w-8 h-8" style={{ color: colors.textMuted }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-base font-medium mb-2" style={{ color: colors.textSecondary }}>No folders yet</p>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>Organize your media into folders</p>
            <button
              onClick={() => openCreateDialog()}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-opacity-90"
              style={{ backgroundColor: colors.primary, color: colors.white }}
            >
              Create First Folder
            </button>
          </div>
        ) : (
          folderTree.map((folder) => (
            <FolderTreeItem
              key={folder.id}
              folder={folder}
              depth={0}
              selectedFolderId={currentFolder?.id || null}
              onSelect={setCurrentFolder}
              onToggle={toggleFolderExpanded}
              onDelete={handleDeleteFolder}
              onCreateChild={(parentId) => openCreateDialog(parentId, folder.name)}
              expandedFolders={expandedFolders}
            />
          ))
        )}
      </div>

      {/* Create folder dialog */}
      {createDialogOpen && (
        <CreateFolderDialog
          parentId={createParentId}
          parentName={createParentName}
          onClose={() => setCreateDialogOpen(false)}
          onCreate={handleCreateFolder}
        />
      )}
    </div>
  )
}
