'use client'

import { useEffect, useState } from 'react'
import { Plus, Folder, File, Trash2, Edit2, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react'
import { useNotebookStore } from '@/store/useNotebookStore'
import { getNotebooks, createNotebook, deleteNotebook, renameNotebook } from '@/actions/notebook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

import { TreeView } from '@/components/TreeView'

export function Sidebar() {
  const { notebooks, setNotebooks, selectedNotebook, setSelectedNotebook } = useNotebookStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [newNotebookType, setNewNotebookType] = useState<'general' | 'tree'>('general')

  useEffect(() => {
    fetchNotebooks()
  }, [])

  const fetchNotebooks = async () => {
    try {
      const data = await getNotebooks()
      setNotebooks(data)
      if (data.length > 0 && !selectedNotebook) {
        setSelectedNotebook(data[0])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return
    try {
      const result = await createNotebook(newNotebookName, newNotebookType)
      await fetchNotebooks()
      setSelectedNotebook(result.notebook)
      setIsCreating(false)
      setNewNotebookName('')
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notebook?')) return
    try {
      await deleteNotebook(id)
      if (selectedNotebook?.id === id) {
        setSelectedNotebook(null)
      }
      await fetchNotebooks()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <aside className="w-full md:w-64 bg-white border-r flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="w-full justify-between text-left font-semibold px-2">
                {selectedNotebook ? selectedNotebook.name : 'Select Notebook'}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            }
          />
          <DropdownMenuContent className="w-56">
            {notebooks.map((nb) => (
              <DropdownMenuItem
                key={nb.id}
                onClick={() => setSelectedNotebook(nb)}
                className="justify-between group"
              >
                <div className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  <span>{nb.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNotebook(nb.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" className="ml-1 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Notebook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Notebook Name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant={newNotebookType === 'general' ? 'default' : 'outline'}
                  onClick={() => setNewNotebookType('general')}
                  className="flex-1"
                >
                  General
                </Button>
                <Button
                  variant={newNotebookType === 'tree' ? 'default' : 'outline'}
                  onClick={() => setNewNotebookType('tree')}
                  className="flex-1"
                >
                  Tree
                </Button>
              </div>
              <Button onClick={handleCreateNotebook} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-2">
        {selectedNotebook ? (
          <TreeView />
        ) : (
          <div className="text-sm text-gray-400 p-4 text-center">
            No notebook selected
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}
