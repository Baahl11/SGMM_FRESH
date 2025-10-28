"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TagBadge } from './tag-badge'
import type { PatientTag, CreateTagInput } from '@/types/patient-tags'
import { toast } from 'sonner'

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#fbbf24', // amber
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // slate
]

interface TagManagerProps {
  patientId?: string // If provided, shows tag assignment UI
}

export function TagManager({ patientId }: TagManagerProps) {
  const [tags, setTags] = useState<PatientTag[]>([])
  const [assignedTags, setAssignedTags] = useState<PatientTag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<PatientTag | null>(null)
  
  const [formData, setFormData] = useState<CreateTagInput>({
    name: '',
    color: PRESET_COLORS[0],
    description: ''
  })

  // Load all available tags
  useEffect(() => {
    fetchTags()
  }, [])

  // Load assigned tags for patient
  useEffect(() => {
    if (patientId) {
      fetchPatientTags()
    }
  }, [patientId])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags')
      if (!res.ok) throw new Error('Failed to fetch tags')
      const data = await res.json()
      setTags(data)
    } catch (error) {
      toast.error('Error loading tags')
    } finally {
      setLoading(false)
    }
  }

  const fetchPatientTags = async () => {
    if (!patientId) return
    try {
      const res = await fetch(`/api/patients/${patientId}/tags`)
      if (!res.ok) throw new Error('Failed to fetch patient tags')
      const data = await res.json()
      setAssignedTags(data)
    } catch (error) {
      toast.error('Error loading patient tags')
    }
  }

  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast.error('Tag name is required')
      return
    }

    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create tag')
      }

      const newTag = await res.json()
      setTags([...tags, newTag])
      setIsCreateDialogOpen(false)
      setFormData({ name: '', color: PRESET_COLORS[0], description: '' })
      toast.success('Tag created successfully')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag) return

    try {
      const res = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update tag')
      }

      const updatedTag = await res.json()
      setTags(tags.map(t => t.id === updatedTag.id ? updatedTag : t))
      setIsEditDialogOpen(false)
      setEditingTag(null)
      toast.success('Tag updated successfully')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure? This will remove the tag from all patients.')) {
      return
    }

    try {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete tag')

      setTags(tags.filter(t => t.id !== tagId))
      toast.success('Tag deleted successfully')
    } catch (error) {
      toast.error('Error deleting tag')
    }
  }

  const handleAssignTag = async (tagId: string) => {
    if (!patientId) return

    try {
      const res = await fetch(`/api/patients/${patientId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to assign tag')
      }

      const tag = await res.json()
      setAssignedTags([...assignedTags, tag])
      toast.success('Tag assigned')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!patientId) return

    try {
      const res = await fetch(`/api/patients/${patientId}/tags?tagId=${tagId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to remove tag')

      setAssignedTags(assignedTags.filter(t => t.id !== tagId))
      toast.success('Tag removed')
    } catch (error) {
      toast.error('Error removing tag')
    }
  }

  const openEditDialog = (tag: PatientTag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    })
    setIsEditDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Patient view - show assigned tags and allow adding/removing
  if (patientId) {
    const availableTags = tags.filter(
      t => !assignedTags.some(at => at.id === t.id)
    )

    return (
      <div className="space-y-4">
        {/* Assigned tags */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {assignedTags.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tags assigned</p>
            ) : (
              assignedTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  onRemove={() => handleRemoveTag(tag.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Available tags to add */}
        {availableTags.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Add Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleAssignTag(tag.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <TagBadge tag={tag} size="sm" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Admin view - full CRUD
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Tags</h3>
        <Button
          onClick={() => {
            setFormData({ name: '', color: PRESET_COLORS[0], description: '' })
            setIsCreateDialogOpen(true)
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map(tag => (
          <div
            key={tag.id}
            className="border rounded-lg p-4 flex items-start justify-between"
          >
            <div className="space-y-2 flex-1">
              <TagBadge tag={tag} />
              {tag.description && (
                <p className="text-sm text-gray-600">{tag.description}</p>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditDialog(tag)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTag(tag.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag to organize your patients
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., VIP, Moroso, Urgente"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color *</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? color : 'transparent',
                      opacity: formData.color === color ? 1 : 0.5
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag}>
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update tag details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color *</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor: formData.color === color ? color : 'transparent',
                      opacity: formData.color === color ? 1 : 0.5
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
