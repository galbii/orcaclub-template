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

// Keyframe animations
const spinKeyframes = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`

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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          marginBottom: '4px',
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
          style={{
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
            opacity: hasChildren ? 1 : 0,
            backgroundColor: hasChildren ? colors.cardBg : 'transparent',
            border: 'none',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
        >
          {hasChildren && (
            <svg
              style={{
                width: '16px',
                height: '16px',
                transition: 'transform 0.2s ease',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                color: colors.textSecondary,
              }}
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
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            backgroundColor: isSelected ? colors.cardBg : colors.inputBg,
          }}
        >
          <svg
            style={{
              width: '20px',
              height: '20px',
              color: isSelected ? colors.primary : colors.gold,
            }}
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
          style={{
            flex: 1,
            fontSize: '16px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: isSelected ? colors.textAccent : colors.textPrimary,
          }}
        >
          {folder.name}
        </span>

        {/* Actions */}
        {showActions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateChild(folder.id)
              }}
              style={{
                padding: '8px',
                borderRadius: '8px',
                transition: 'opacity 0.2s ease',
                backgroundColor: colors.cardBg,
                color: colors.textSecondary,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              title="Create subfolder"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              style={{
                padding: '8px',
                borderRadius: '8px',
                transition: 'opacity 0.2s ease',
                backgroundColor: colors.errorBg,
                color: colors.error,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              title="Delete folder"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div style={{ marginTop: '4px' }}>
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10003,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: colors.backdrop,
      }}
      onClick={onClose}
    >
      <div
        style={{
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '448px',
          padding: '32px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.modalBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.warningBg,
            }}
          >
            <svg style={{ width: '24px', height: '24px', color: colors.gold }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: colors.textPrimary }}>New Folder</h3>
            {parentName && (
              <p style={{ fontSize: '14px', marginTop: '2px', color: colors.textSecondary }}>Inside: {parentName}</p>
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
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '16px',
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              marginBottom: '24px',
              backgroundColor: colors.inputBg,
              color: colors.textPrimary,
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = colors.borderFocus}
            onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                borderRadius: '12px',
                transition: 'opacity 0.2s ease',
                color: colors.textSecondary,
                backgroundColor: colors.cardBg,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: '12px',
                transition: 'opacity 0.2s ease',
                opacity: !name.trim() || isCreating ? 0.5 : 1,
                cursor: !name.trim() || isCreating ? 'not-allowed' : 'pointer',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
              }}
              onMouseEnter={(e) => {
                if (name.trim() && !isCreating) e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                if (name.trim() && !isCreating) e.currentTarget.style.opacity = '1'
              }}
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
      <>
        <style>{spinKeyframes}</style>
        <div style={{
          padding: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.sidebarBg
        }}>
          <div
            style={{
              animation: 'spin 1s linear infinite',
              borderRadius: '9999px',
              height: '32px',
              width: '32px',
              border: '3px solid',
              borderColor: colors.primary,
              borderTopColor: 'transparent',
            }}
          />
        </div>
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: colors.sidebarBg }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>Folders</h3>
          <button
            onClick={() => openCreateDialog()}
            style={{
              padding: '10px',
              borderRadius: '12px',
              transition: 'opacity 0.2s ease',
              backgroundColor: colors.cardBg,
              color: colors.textSecondary,
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title="Create folder"
          >
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* All Media (Root) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginBottom: '8px',
            backgroundColor: currentFolder === null ? colors.hoverBg : 'transparent',
            borderLeft: currentFolder === null ? `3px solid ${colors.primary}` : '3px solid transparent',
          }}
          onClick={() => setCurrentFolder(null)}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: currentFolder === null ? colors.cardBg : colors.inputBg,
            }}
          >
            <svg
              style={{
                width: '20px',
                height: '20px',
                color: currentFolder === null ? colors.primary : colors.textMuted,
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 500,
              color: currentFolder === null ? colors.textAccent : colors.textPrimary,
            }}
          >
            All Media
          </span>
        </div>

        {/* Divider */}
        {folderTree.length > 0 && (
          <div style={{ height: '1px', margin: '12px 0', backgroundColor: colors.border }} />
        )}

        {/* Folder tree */}
        {folderTree.length === 0 ? (
          <div style={{ padding: '16px', paddingTop: '32px', paddingBottom: '32px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.cardBg,
              }}
            >
              <svg style={{ width: '32px', height: '32px', color: colors.textMuted }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 7V17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6.586a1 1 0 01-.707-.293L10 5H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: colors.textSecondary }}>No folders yet</p>
            <p style={{ fontSize: '14px', marginBottom: '16px', color: colors.textMuted }}>Organize your media into folders</p>
            <button
              onClick={() => openCreateDialog()}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '12px',
                transition: 'opacity 0.2s ease',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
