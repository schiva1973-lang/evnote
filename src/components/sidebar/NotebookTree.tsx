import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Node } from '@/types'
import { useUIStore } from '@/store/useUIStore'
import TreeNode from './TreeNode'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

const NotebookTree: React.FC<{ notebookId: string }> = ({ notebookId }) => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageRefreshKey, setPageRefreshKey] = useState(0)
  const { currentPageId, setCurrentNodeId } = useUIStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchNodes()
  }, [notebookId])

  useEffect(() => {
    const syncCurrentPageNode = async () => {
      if (!currentPageId) return

      const { data, error } = await supabase
        .from('pages')
        .select('node_id')
        .eq('id', currentPageId)
        .single()

      if (!error && data?.node_id) {
        setCurrentNodeId(data.node_id)
      }
    }

    syncCurrentPageNode()
  }, [currentPageId, setCurrentNodeId])

  const fetchNodes = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('sort_order', { ascending: true })
    
    if (!error && data) {
      setNodes(data)
    }
    setIsLoading(false)
  }

  const handleCreateRootNode = async () => {
    const { data, error } = await supabase
      .from('nodes')
      .insert([{ notebook_id: notebookId, name: '새 노드', user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single()
    
    if (!error && data) {
      setNodes([...nodes, data])
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as any
    const overData = over.data.current as any

    if (activeData?.type === 'page') {
      await handlePageDragEnd(activeData, overData)
      return
    }

    if (activeData?.type !== 'node' || overData?.type !== 'node') return

    const activeNode = nodes.find(n => n.id === activeData.nodeId)
    const overNode = nodes.find(n => n.id === overData.nodeId)
    
    if (!activeNode || !overNode) return

    // Only allow sorting within the same parent
    if (activeNode.parent_node_id !== overNode.parent_node_id) return

    const oldIndex = nodes.findIndex((n) => n.id === activeData.nodeId)
    const newIndex = nodes.findIndex((n) => n.id === overData.nodeId)

    const newNodes = arrayMove(nodes, oldIndex, newIndex)
    setNodes(newNodes)

    // Update sort_order in database
    const updates = newNodes
      .filter(n => n.parent_node_id === activeNode.parent_node_id)
      .map((node, index) => ({
        id: node.id,
        sort_order: index,
      }))

    for (const update of updates) {
      await supabase
        .from('nodes')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  const handlePageDragEnd = async (
    activeData: { pageId?: string; nodeId?: string },
    overData: { type?: string; pageId?: string; nodeId?: string } | undefined
  ) => {
    if (!activeData.pageId || !activeData.nodeId || !overData) return

    if (overData.type === 'page' && overData.nodeId === activeData.nodeId && overData.pageId) {
      await reorderPagesWithinNode(activeData.nodeId, activeData.pageId, overData.pageId)
      return
    }

    if (overData.type === 'node' && overData.nodeId && overData.nodeId !== activeData.nodeId) {
      await movePageToNode(activeData.pageId, activeData.nodeId, overData.nodeId)
    }
  }

  const reorderPagesWithinNode = async (nodeId: string, pageId: string, overPageId: string) => {
    const { data, error } = await supabase
      .from('pages')
      .select('id')
      .eq('node_id', nodeId)
      .order('sort_order', { ascending: true })

    if (error || !data) return

    const oldIndex = data.findIndex((page) => page.id === pageId)
    const newIndex = data.findIndex((page) => page.id === overPageId)
    if (oldIndex < 0 || newIndex < 0) return

    const reorderedPages = arrayMove(data, oldIndex, newIndex)
    for (const [index, page] of reorderedPages.entries()) {
      await supabase
        .from('pages')
        .update({ sort_order: index })
        .eq('id', page.id)
    }

    setPageRefreshKey((key) => key + 1)
  }

  const movePageToNode = async (pageId: string, sourceNodeId: string, targetNodeId: string) => {
    const { data: targetPages, error: targetPagesError } = await supabase
      .from('pages')
      .select('id')
      .eq('node_id', targetNodeId)
      .order('sort_order', { ascending: true })

    if (targetPagesError) return

    const { error: moveError } = await supabase
      .from('pages')
      .update({
        node_id: targetNodeId,
        sort_order: targetPages?.length ?? 0,
      })
      .eq('id', pageId)

    if (moveError) return

    const { data: sourcePages } = await supabase
      .from('pages')
      .select('id')
      .eq('node_id', sourceNodeId)
      .order('sort_order', { ascending: true })

    for (const [index, page] of (sourcePages ?? []).entries()) {
      await supabase
        .from('pages')
        .update({ sort_order: index })
        .eq('id', page.id)
    }

    if (currentPageId === pageId) {
      setCurrentNodeId(targetNodeId)
    }
    setPageRefreshKey((key) => key + 1)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Filter root nodes
  const rootNodes = nodes.filter(node => !node.parent_node_id)

  return (
    <div className="space-y-1 mt-4 border-t pt-4 px-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Structure</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCreateRootNode}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      {rootNodes.length === 0 ? (
        <div className="text-[11px] text-muted-foreground text-center py-2">
          노드가 없습니다.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={rootNodes.map(n => `node:${n.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {rootNodes.map(node => (
              <TreeNode 
                key={node.id} 
                node={node} 
                allNodes={nodes} 
                depth={0} 
                refreshKey={pageRefreshKey}
                onUpdate={fetchNodes}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

export default NotebookTree
