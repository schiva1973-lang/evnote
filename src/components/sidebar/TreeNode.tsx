import React, { useState, useEffect, useRef } from 'react'
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
  MoreVertical,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TreeNodeProps {
  node: Node
  allNodes: Node[]
  depth: number
  refreshKey: number
  onUpdate: () => void
}

// Separate PageItem component for sortability
const PageItem: React.FC<{
  page: Page;
  depth: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (page: Page) => void;
  onCreatePage: () => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  editedTitle: string;
  onTitleChange: (val: string) => void;
  onUpdateTitle: (id: string) => void;
  onCancelEdit: () => void;
}> = ({ 
  page, depth, isSelected, onSelect, onEdit, onDelete, 
  onCreatePage, isEditing, editedTitle, onTitleChange, onUpdateTitle, onCancelEdit 
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `page:${page.id}`,
    data: {
      type: 'page',
      pageId: page.id,
      nodeId: page.node_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  useEffect(() => {
    if (!isEditing) return

    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [isEditing])

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/page flex items-center gap-2 px-2 py-0.5 my-0.5 rounded-sm cursor-pointer hover:bg-accent/50 text-sm transition-all relative",
        isSelected 
          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary rounded-l-none" 
          : "text-muted-foreground"
      )}
      style={{ ...style, paddingLeft: `${(depth + 1) * 12 + 8}px` }}
      onClick={() => onSelect(page.id)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 touch-none select-none opacity-0 group-hover/page:opacity-50 hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </div>

      <FileText className={cn(
        "h-3.5 w-3.5 shrink-0 transition-colors",
        isSelected ? "text-primary" : "text-muted-foreground"
      )} />
      
      {isEditing ? (
        <Input
          ref={inputRef}
          className="flex-1 h-6 px-1 bg-transparent border-none outline-none text-sm focus-visible:ring-1"
          value={editedTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => onUpdateTitle(page.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onUpdateTitle(page.id)
            if (e.key === 'Escape') onCancelEdit()
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
        <DropdownMenuContent
          align="end"
          className="w-32"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            onEdit(page)
          }}>
            <Edit2 className="mr-2 h-3 w-3" />
            <span>이름 변경</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            onCreatePage()
          }}>
            <Plus className="mr-2 h-3 w-3" />
            <span>페이지 추가</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(page.id)
            }}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            <span>삭제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, allNodes, depth, refreshKey, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [pages, setPages] = useState<Page[]>([])
  const [isEditingNode, setIsEditingNode] = useState(false)
  const [editedNodeName, setEditedNodeName] = useState(node.name)
  const nodeInputRef = useRef<HTMLInputElement>(null)
  
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editedPageTitle, setEditedPageTitle] = useState('')

  const { currentNodeId, setCurrentNodeId, currentPageId, setCurrentPageId } = useUIStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `node:${node.id}`,
    data: {
      type: 'node',
      nodeId: node.id,
      parentNodeId: node.parent_node_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  const isAncestorOfCurrentNode = () => {
    if (!currentNodeId || currentNodeId === node.id) return currentNodeId === node.id

    let parentNodeId = allNodes.find((candidate) => candidate.id === currentNodeId)?.parent_node_id
    while (parentNodeId) {
      if (parentNodeId === node.id) return true
      parentNodeId = allNodes.find((candidate) => candidate.id === parentNodeId)?.parent_node_id
    }

    return false
  }

  useEffect(() => {
    if (isExpanded) {
      fetchPages()
    }
  }, [isExpanded, refreshKey])

  useEffect(() => {
    if (isAncestorOfCurrentNode()) {
      setIsExpanded(true)
    }
  }, [currentNodeId, allNodes, node.id])

  useEffect(() => {
    if (!isEditingNode) return

    requestAnimationFrame(() => {
      nodeInputRef.current?.focus()
      nodeInputRef.current?.select()
    })
  }, [isEditingNode])

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
      .insert([{ node_id: node.id, title: '제목 없는 페이지', user_id: (await supabase.auth.getUser()).data.user?.id, sort_order: pages.length }])
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
    <div ref={setNodeRef} style={style} className="select-none">
      <div 
        className={cn(
          "group flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:bg-accent/50",
          currentNodeId === node.id && "bg-accent"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          setIsExpanded(!isExpanded)
          setCurrentNodeId(node.id)
          setCurrentPageId(null)
        }}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 touch-none select-none opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        <div className="w-4 flex items-center justify-center">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : null}
        </div>
        
        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        
        {isEditingNode ? (
          <Input
            ref={nodeInputRef}
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
          <DropdownMenuContent
            align="end"
            className="w-32"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              setEditedNodeName(node.name)
              setTimeout(() => setIsEditingNode(true), 0)
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
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    sort_order: childNodes.length
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
          <SortableContext 
            items={childNodes.map(n => `node:${n.id}`)} 
            strategy={verticalListSortingStrategy}
          >
            {childNodes.map(child => (
              <TreeNode 
                key={child.id} 
                node={child} 
                allNodes={allNodes} 
                depth={depth + 1} 
                refreshKey={refreshKey}
                onUpdate={onUpdate}
              />
            ))}
          </SortableContext>
          
          <SortableContext
            items={pages.map(p => `page:${p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {pages.map(page => (
              <PageItem
                key={page.id}
                page={page}
                depth={depth}
                isSelected={currentPageId === page.id}
                onSelect={(pageId) => {
                  setCurrentNodeId(page.node_id)
                  setCurrentPageId(pageId)
                }}
                onEdit={(p) => {
                  setEditedPageTitle(p.title)
                  setTimeout(() => setEditingPageId(p.id), 0)
                }}
                onCreatePage={() => handleCreatePage()}
                onDelete={handleDeletePage}
                isEditing={editingPageId === page.id}
                editedTitle={editedPageTitle}
                onTitleChange={setEditedPageTitle}
                onUpdateTitle={handleUpdatePage}
                onCancelEdit={() => setEditingPageId(null)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  )
}

export default TreeNode
