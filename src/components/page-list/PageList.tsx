import React, { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowUpToLine, Folder, GripVertical, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Node, Page } from '@/types'
import { useUIStore } from '@/store/useUIStore'
import PageThumbnail from './PageThumbnail'

type PagesByNode = Record<string, Page[]>

interface PageCardProps {
  page: Page
  onOpen: (page: Page) => void
}

const PageCard: React.FC<PageCardProps> = ({ page, onOpen }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `page-list-page:${page.id}`,
    data: {
      type: 'page-list-page',
      pageId: page.id,
      nodeId: page.node_id,
    },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className="group rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
      onClick={() => onOpen(page)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">{page.title}</span>
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground opacity-60 touch-none select-none hover:bg-accent hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <PageThumbnail page={page} />
    </div>
  )
}

interface PageDropSectionProps {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  pages: Page[]
  emptyText: string
  onOpenPage: (page: Page) => void
}

const PageDropSection: React.FC<PageDropSectionProps> = ({
  id,
  title,
  description,
  icon,
  pages,
  emptyText,
  onOpenPage,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `page-list-drop-node:${id}`,
    data: {
      type: 'page-list-drop-node',
      nodeId: id,
    },
  })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'rounded-lg border bg-background p-4 transition-colors',
        isOver && 'border-primary bg-primary/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <SortableContext
        items={pages.map((page) => `page-list-page:${page.id}`)}
        strategy={rectSortingStrategy}
      >
        {pages.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
            {pages.map((page) => (
              <PageCard key={page.id} page={page} onOpen={onOpenPage} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[96px] items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground">
            {emptyText}
          </div>
        )}
      </SortableContext>
    </section>
  )
}

const PageList: React.FC = () => {
  const currentNodeId = useUIStore((state) => state.currentNodeId)
  const setCurrentNodeId = useUIStore((state) => state.setCurrentNodeId)
  const setCurrentPageId = useUIStore((state) => state.setCurrentPageId)

  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [parentNode, setParentNode] = useState<Node | null>(null)
  const [childNodes, setChildNodes] = useState<Node[]>([])
  const [pagesByNode, setPagesByNode] = useState<PagesByNode>({})
  const [isLoading, setIsLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadNodeData = async () => {
    if (!currentNodeId) return

    setIsLoading(true)
    const { data: nodeData } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', currentNodeId)
      .single()

    if (!nodeData) {
      setSelectedNode(null)
      setParentNode(null)
      setChildNodes([])
      setPagesByNode({})
      setIsLoading(false)
      return
    }

    const [{ data: parentData }, { data: childrenData }] = await Promise.all([
      nodeData.parent_node_id
        ? supabase.from('nodes').select('*').eq('id', nodeData.parent_node_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from('nodes')
        .select('*')
        .eq('parent_node_id', currentNodeId)
        .order('sort_order', { ascending: true }),
    ])

    const children = childrenData ?? []
    const nodeIds = [currentNodeId, ...children.map((node) => node.id)]
    const { data: pagesData } = await supabase
      .from('pages')
      .select('*')
      .in('node_id', nodeIds)
      .order('sort_order', { ascending: true })

    const groupedPages = (pagesData ?? []).reduce<PagesByNode>((acc, page) => {
      acc[page.node_id] = [...(acc[page.node_id] ?? []), page]
      return acc
    }, {})

    setSelectedNode(nodeData)
    setParentNode(parentData)
    setChildNodes(children)
    setPagesByNode(groupedPages)
    setIsLoading(false)
  }

  useEffect(() => {
    loadNodeData()
  }, [currentNodeId])

  const nodeSections = useMemo(() => {
    if (!selectedNode) return []

    return [
      {
        id: selectedNode.id,
        title: '이 노드의 페이지',
        description: selectedNode.name,
        icon: <Folder className="h-4 w-4" />,
        pages: pagesByNode[selectedNode.id] ?? [],
        emptyText: '이 노드에 페이지가 없습니다.',
      },
      ...childNodes.map((node) => ({
        id: node.id,
        title: node.name,
        description: '하위 노드',
        icon: <Folder className="h-4 w-4" />,
        pages: pagesByNode[node.id] ?? [],
        emptyText: '이 하위 노드에 페이지가 없습니다.',
      })),
    ]
  }, [childNodes, pagesByNode, selectedNode])

  const openPage = (page: Page) => {
    setCurrentNodeId(page.node_id)
    setCurrentPageId(page.id)
  }

  const updatePageOrders = async (pages: Page[]) => {
    for (const [index, page] of pages.entries()) {
      await supabase
        .from('pages')
        .update({ sort_order: index })
        .eq('id', page.id)
    }
  }

  const reorderWithinNode = async (nodeId: string, pageId: string, overPageId: string) => {
    const pages = pagesByNode[nodeId] ?? []
    const oldIndex = pages.findIndex((page) => page.id === pageId)
    const newIndex = pages.findIndex((page) => page.id === overPageId)
    if (oldIndex < 0 || newIndex < 0) return

    const reorderedPages = arrayMove(pages, oldIndex, newIndex)
    setPagesByNode((prev) => ({ ...prev, [nodeId]: reorderedPages }))
    await updatePageOrders(reorderedPages)
  }

  const movePageToNode = async (pageId: string, sourceNodeId: string, targetNodeId: string) => {
    const sourcePages = pagesByNode[sourceNodeId] ?? []
    const movingPage = sourcePages.find((page) => page.id === pageId)
    if (!movingPage) return

    const { data: persistedTargetPages, error: targetPagesError } = await supabase
      .from('pages')
      .select('id')
      .eq('node_id', targetNodeId)
      .order('sort_order', { ascending: true })

    if (targetPagesError) return

    const targetPages = pagesByNode[targetNodeId] ?? []
    const nextSourcePages = sourcePages.filter((page) => page.id !== pageId)
    const nextTargetPages = [...targetPages, { ...movingPage, node_id: targetNodeId }]
    const targetSortOrder = persistedTargetPages?.length ?? targetPages.length

    setPagesByNode((prev) => ({
      ...prev,
      [sourceNodeId]: nextSourcePages,
      [targetNodeId]: nextTargetPages,
    }))

    const { error } = await supabase
      .from('pages')
      .update({
        node_id: targetNodeId,
        sort_order: targetSortOrder,
      })
      .eq('id', pageId)

    if (error) {
      await loadNodeData()
      return
    }

    await updatePageOrders(nextSourcePages)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as { type?: string; pageId?: string; nodeId?: string }
    const overData = over.data.current as { type?: string; pageId?: string; nodeId?: string }

    if (activeData?.type !== 'page-list-page' || !activeData.pageId || !activeData.nodeId) return

    if (overData?.type === 'page-list-page' && overData.nodeId && overData.pageId) {
      if (overData.nodeId === activeData.nodeId) {
        await reorderWithinNode(activeData.nodeId, activeData.pageId, overData.pageId)
      } else {
        await movePageToNode(activeData.pageId, activeData.nodeId, overData.nodeId)
      }
      return
    }

    if (overData?.type === 'page-list-drop-node' && overData.nodeId) {
      if (overData.nodeId === activeData.nodeId) return
      await movePageToNode(activeData.pageId, activeData.nodeId, overData.nodeId)
    }
  }

  if (!currentNodeId) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        노드를 선택하면 페이지 목록이 표시됩니다.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        선택한 노드를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-muted/20 p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{selectedNode.name}</h1>
            <p className="text-sm text-muted-foreground">PAGE LIST</p>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          {parentNode && (
            <PageDropSection
              id={parentNode.id}
              title="상위 노드로 이동"
              description={parentNode.name}
              icon={<ArrowUpToLine className="h-4 w-4" />}
              pages={[]}
              emptyText="페이지를 여기에 놓으면 상위 노드로 이동합니다."
              onOpenPage={openPage}
            />
          )}

          {nodeSections.map((section) => (
            <PageDropSection
              key={section.id}
              id={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              pages={section.pages}
              emptyText={section.emptyText}
              onOpenPage={openPage}
            />
          ))}
        </DndContext>
      </div>
    </div>
  )
}

export default PageList
