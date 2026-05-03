import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Node } from '@/types'
import TreeNode from './TreeNode'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NotebookTree: React.FC<{ notebookId: string }> = ({ notebookId }) => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNodes()
  }, [notebookId])

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
        rootNodes.map(node => (
          <TreeNode 
            key={node.id} 
            node={node} 
            allNodes={nodes} 
            depth={0} 
            onUpdate={fetchNodes}
          />
        ))
      )}
    </div>
  )
}

export default NotebookTree
