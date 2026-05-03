import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/useUIStore'
import { Node, Page } from '@/types'
import { cn } from '@/lib/utils'
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  Plus, 
  Edit2,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'

interface TreeNodeProps {
  node: Node
  allNodes: Node[]
  depth: number
  onUpdate: () => void
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, allNodes, depth, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [pages, setPages] = useState<Page[]>([])
  const [isEditingNode, setIsEditingNode] = useState(false)
  const [editedNodeName, setEditedNodeName] = useState(node.name)
  
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editedPageTitle, setEditedPageTitle] = useState('')

  const { currentNodeId, setCurrentNodeId, currentPageId, setCurrentPageId } = useUIStore()

  useEffect(() => {
    if (isExpanded) {
      fetchPages()
    }
  }, [isExpanded])

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('node_id', node.id)
      .order('sort_order', { ascending: true })
    
    if (!error && data) {
      setPages(data)
    }
  }

  const handleCreatePage = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const { data, error } = await supabase
      .from('pages')
      .insert([{ node_id: node.id, title: '제목 없는 페이지', user_id: (await supabase.auth.getUser()).data.user?.id }])
      .select()
      .single()
    
    if (!error && data) {
      setPages([...pages, data])
      setIsExpanded(true)
      setCurrentPageId(data.id)
      setCurrentNodeId(node.id)
    }
  }

  const handleUpdateNode = async () => {
    if (!editedNodeName.trim() || editedNodeName === node.name) {
      setIsEditingNode(false)
      return
    }

    const { error } = await supabase
      .from('nodes')
      .update({ name: editedNodeName })
      .eq('id', node.id)
    
    if (!error) {
      onUpdate()
    }
    setIsEditingNode(false)
  }

  const handleUpdatePage = async (pageId: string) => {
    if (!editedPageTitle.trim()) {
      setEditingPageId(null)
      return
    }

    const { error } = await supabase
      .from('pages')
      .update({ title: editedPageTitle })
      .eq('id', pageId)
    
    if (!error) {
      setPages(pages.map(p => p.id === pageId ? { ...p, title: editedPageTitle } : p))
    }
    setEditingPageId(null)
  }

  const handleDeleteNode = async () => {
    if (!confirm('이 노드와 하위 모든 내용을 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('nodes')
      .delete()
      .eq('id', node.id)
    
    if (!error) {
      onUpdate()
      if (currentNodeId === node.id) setCurrentNodeId(null)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('이 페이지를 삭제하시겠습니까?')) return

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
    
    if (!error) {
      setPages(pages.filter(p => p.id !== pageId))
      if (currentPageId === pageId) setCurrentPageId(null)
    }
  }

  const childNodes = allNodes.filter(n => n.parent_node_id === node.id)
  const hasChildren = childNodes.length > 0 || pages.length > 0

  return (
    <div className="select-none">
      <div 
        className={cn(
          "group flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-accent/50",
          currentNodeId === node.id && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          setIsExpanded(!isExpanded)
          setCurrentNodeId(node.id)
        }}
      >
        <div className="w-4 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </div>
        
        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        
        {isEditingNode ? (
          <Input
            className="flex-1 h-6 px-1 bg-transparent border-none outline-none text-sm focus-visible:ring-1"
            value={editedNodeName}
            onChange={(e) => setEditedNodeName(e.target.value)}
            onBlur={handleUpdateNode}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateNode()
              if (e.key === 'Escape') setIsEditingNode(false)
            }}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{node.name}</span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              setIsEditingNode(true)
              setEditedNodeName(node.name)
            }}>
              <Edit2 className="mr-2 h-3 w-3" />
              <span>이름 변경</span>
            </DropdownMenuItem>
            {depth < 5 && (
              <DropdownMenuItem onClick={async (e) => {
                e.stopPropagation()
                const { data, error } = await supabase
                  .from('nodes')
                  .insert([{ 
                    notebook_id: node.notebook_id, 
                    parent_node_id: node.id, 
                    name: '새 하위 노드', 
                    user_id: (await supabase.auth.getUser()).data.user?.id 
                  }])
                  .select()
                  .single()
                
                if (!error && data) {
                  onUpdate()
                  setIsExpanded(true)
                }
              }}>
                <Folder className="mr-2 h-3 w-3" />
                <span>하위 노드 추가</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              handleCreatePage()
            }}>
              <Plus className="mr-2 h-3 w-3" />
              <span>페이지 추가</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteNode()
              }}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              <span>삭제</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {childNodes.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              allNodes={allNodes} 
              depth={depth + 1} 
              onUpdate={onUpdate}
            />
          ))}
          
          {pages.map(page => (
            <div
              key={page.id}
              className={cn(
                "group/page flex items-center gap-2 px-2 py-0.5 my-0.5 rounded-sm cursor-pointer hover:bg-accent/50 text-sm transition-all relative",
                currentPageId === page.id 
                  ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-l-none" 
                  : "text-muted-foreground"
              )}
              style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
              onClick={() => setCurrentPageId(page.id)}
            >
              <FileText className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                currentPageId === page.id ? "text-primary" : "text-muted-foreground"
              )} />
              
              {editingPageId === page.id ? (
                <Input
                  className="flex-1 h-6 px-1 bg-transparent border-none outline-none text-sm focus-visible:ring-1"
                  value={editedPageTitle}
                  onChange={(e) => setEditedPageTitle(e.target.value)}
                  onBlur={() => handleUpdatePage(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdatePage(page.id)
                    if (e.key === 'Escape') setEditingPageId(null)
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate">{page.title}</span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover/page:opacity-100 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setEditingPageId(page.id)
                    setEditedPageTitle(page.title)
                  }}>
                    <Edit2 className="mr-2 h-3 w-3" />
                    <span>이름 변경</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePage(page.id)
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    <span>삭제</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TreeNode
