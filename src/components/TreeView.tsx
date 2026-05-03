'use client'

import { useEffect, useState } from 'react'
import { useNotebookStore, TreeNode, Page } from '@/store/useNotebookStore'
import { getNodes, createNode, updateNode, deleteNode } from '@/actions/node'
import { getPages, createPage, deletePage, updatePage } from '@/actions/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Folder, FileText, ChevronRight, ChevronDown, Trash2, Edit2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function TreeView() {
  const { selectedNotebook, nodes, setNodes, pages, setPages, selectedPage, setSelectedPage } = useNotebookStore()
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [isCreatingNode, setIsCreatingNode] = useState(false)
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    if (selectedNotebook) {
      fetchTreeData()
    } else {
      setNodes([])
      setPages([])
      setSelectedPage(null)
    }
  }, [selectedNotebook])

  const fetchTreeData = async () => {
    if (!selectedNotebook) return
    try {
      const fetchedNodes = await getNodes(selectedNotebook.id)
      setNodes(fetchedNodes)
      
      // Fetch pages for all nodes (in a real app, might want to fetch on expand or bulk fetch)
      // For now, we fetch pages one by one for each node, or we need a new action to get all pages for a notebook.
      // Since pages are linked to nodes, let's fetch pages for all nodes sequentially (for simplicity).
      const allPages: Page[] = []
      for (const node of fetchedNodes) {
        const nodePages = await getPages(node.id)
        allPages.push(...nodePages)
      }
      setPages(allPages)
    } catch (e) {
      console.error(e)
    }
  }

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const handleCreateNode = async () => {
    if (!newItemName.trim() || !selectedNotebook) return
    try {
      await createNode(selectedNotebook.id, targetNodeId, newItemName)
      await fetchTreeData()
      if (targetNodeId) toggleExpand(targetNodeId)
      setIsCreatingNode(false)
      setNewItemName('')
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreatePage = async () => {
    if (!newItemName.trim() || !targetNodeId) return
    try {
      await createPage(targetNodeId, newItemName)
      await fetchTreeData()
      toggleExpand(targetNodeId)
      setIsCreatingPage(false)
      setNewItemName('')
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Delete this node and all its contents?')) return
    try {
      await deleteNode(id)
      await fetchTreeData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm('Delete this page?')) return
    try {
      await deletePage(id)
      if (selectedPage?.id === id) setSelectedPage(null)
      await fetchTreeData()
    } catch (e) {
      console.error(e)
    }
  }

  const renderPages = (nodeId: string, depth: number) => {
    const nodePages = pages.filter(p => p.node_id === nodeId).sort((a, b) => a.sort_order - b.sort_order)
    return nodePages.map(page => (
      <div
        key={`page-${page.id}`}
        className={`flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-gray-100 group ${selectedPage?.id === page.id ? 'bg-blue-50' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 24}px` }}
        onClick={() => setSelectedPage(page)}
      >
        <div className="flex items-center text-sm text-gray-700">
          <FileText className="w-4 h-4 mr-2" />
          <span className="truncate">{page.title}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id) }} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ))
  }

  const renderNodes = (parentId: string | null, depth: number = 0) => {
    const childNodes = nodes.filter(n => n.parent_node_id === parentId).sort((a, b) => a.sort_order - b.sort_order)
    
    return childNodes.map(node => (
      <div key={`node-${node.id}`}>
        <div 
          className="flex items-center justify-between py-1 px-2 cursor-pointer hover:bg-gray-100 group"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <div className="flex items-center text-sm font-medium" onClick={() => toggleExpand(node.id)}>
            {expandedNodes[node.id] ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
            <span className="truncate">{node.name}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent>
              {depth < 4 && selectedNotebook?.type === 'tree' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTargetNodeId(node.id); setIsCreatingNode(true) }}>
                  <Folder className="w-4 h-4 mr-2" /> Add Sub-Node
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setTargetNodeId(node.id); setIsCreatingPage(true) }}>
                <FileText className="w-4 h-4 mr-2" /> Add Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id) }} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {expandedNodes[node.id] && (
          <div>
            {renderNodes(node.id, depth + 1)}
            {renderPages(node.id, depth + 1)}
          </div>
        )}
      </div>
    ))
  }

  if (!selectedNotebook) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2">
        <span className="text-xs font-bold text-gray-500 uppercase">Contents</span>
        {selectedNotebook.type === 'tree' && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTargetNodeId(null); setIsCreatingNode(true) }}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {renderNodes(null, 0)}
        {nodes.length === 0 && (
          <div className="p-4 text-center">
             <Button variant="outline" size="sm" onClick={() => { setTargetNodeId(null); setIsCreatingNode(true) }}>
               Create Root Node
             </Button>
          </div>
        )}
      </div>

      <Dialog open={isCreatingNode} onOpenChange={setIsCreatingNode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Node</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Node Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Button onClick={handleCreateNode} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingPage} onOpenChange={setIsCreatingPage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Page Title"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Button onClick={handleCreatePage} className="w-full">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
