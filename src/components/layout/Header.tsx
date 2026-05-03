import React, { useEffect, useState } from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useCanvasStore, ToolType, BackgroundType } from '@/store/useCanvasStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Menu, 
  Pencil, 
  Highlighter, 
  Eraser, 
  Type, 
  Image as ImageIcon, 
  Square, 
  MousePointer2,
  Layers
} from 'lucide-react'

const Header: React.FC = () => {
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false)
  const [pagePosition, setPagePosition] = useState<{ current: number; total: number } | null>(null)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const currentPageId = useUIStore((state) => state.currentPageId)
  const { 
    activeTool, 
    setActiveTool, 
    brushColor,
    setBrushColor,
    brushWidth,
    setBrushWidth,
    backgroundType,
    setBackgroundType
  } = useCanvasStore()

  const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
    { type: 'select', icon: <MousePointer2 className="h-4 w-4" />, label: 'Select' },
    { type: 'pen', icon: <Pencil className="h-4 w-4" />, label: 'Pen' },
    { type: 'highlighter', icon: <Highlighter className="h-4 w-4" />, label: 'Highlighter' },
    { type: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
    { type: 'rectEraser', icon: <Square className="h-4 w-4" />, label: 'Rect Eraser' },
    { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
    { type: 'image', icon: <ImageIcon className="h-4 w-4" />, label: 'Image' },
  ]

  const backgroundOptions: { type: BackgroundType; label: string; preview: string }[] = [
    { type: 'lined', label: '줄 노트', preview: 'bg-white bg-[linear-gradient(to_bottom,transparent_31px,rgba(0,122,255,0.45)_32px)] bg-[length:100%_32px]' },
    { type: 'grid', label: '격자', preview: 'bg-white bg-[linear-gradient(rgba(0,0,0,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.18)_1px,transparent_1px)] bg-[length:18px_18px]' },
    { type: 'dot', label: '점선', preview: 'bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.38)_1px,transparent_1px)] bg-[length:18px_18px]' },
    { type: 'blank', label: '빈 페이지', preview: 'bg-white' },
  ]

  useEffect(() => {
    let isMounted = true

    const loadPagePosition = async () => {
      if (!currentPageId) {
        setPagePosition(null)
        return
      }

      const { data: currentPage, error: currentPageError } = await supabase
        .from('pages')
        .select('id, node_id')
        .eq('id', currentPageId)
        .single()

      if (currentPageError || !currentPage) {
        if (isMounted) setPagePosition(null)
        return
      }

      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('id')
        .eq('node_id', currentPage.node_id)
        .order('sort_order', { ascending: true })

      if (pagesError || !pages) {
        if (isMounted) setPagePosition(null)
        return
      }

      const pageIndex = pages.findIndex((page) => page.id === currentPageId)
      if (isMounted) {
        setPagePosition(pageIndex >= 0 ? { current: pageIndex + 1, total: pages.length } : null)
      }
    }

    loadPagePosition()

    return () => {
      isMounted = false
    }
  }, [currentPageId])

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="h-6 w-[1px] bg-border mx-2" />
        
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md">
          {tools.map((tool) => (
            <Button
              key={tool.type}
              variant={activeTool === tool.type ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 transition-all duration-200",
                activeTool === tool.type && "ring-2 ring-primary ring-offset-1 shadow-sm bg-background"
              )}
              onClick={() => setActiveTool(tool.type)}
              title={tool.label}
            >
              {tool.icon}
            </Button>
          ))}
        </div>

        {['pen', 'highlighter'].includes(activeTool) && (
          <div className="flex items-center gap-2 ml-4">
            <input 
              type="color" 
              value={brushColor} 
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-6 h-6 border-none cursor-pointer"
            />
            <Select value={brushWidth.toString()} onValueChange={(v: string) => setBrushWidth(parseInt(v))}>
              <SelectTrigger className="w-16 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1px</SelectItem>
                <SelectItem value="2">2px</SelectItem>
                <SelectItem value="4">4px</SelectItem>
                <SelectItem value="8">8px</SelectItem>
                <SelectItem value="12">12px</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pagePosition && (
          <span className="min-w-14 text-right text-sm font-medium text-muted-foreground">
            ({pagePosition.current}/{pagePosition.total})
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsBackgroundDialogOpen(true)}
          title="배경 선택"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isBackgroundDialogOpen} onOpenChange={setIsBackgroundDialogOpen}>
        <DialogContent className="max-w-md border bg-white text-foreground shadow-2xl">
          <DialogHeader>
            <DialogTitle>배경 선택</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {backgroundOptions.map((option) => (
              <Button
                key={option.type}
                type="button"
                variant="outline"
                className={cn(
                  "h-auto flex-col items-stretch gap-3 p-3",
                  backgroundType === option.type && "border-primary ring-2 ring-primary/30"
                )}
                onClick={() => {
                  setBackgroundType(option.type)
                  setIsBackgroundDialogOpen(false)
                }}
              >
                <span className={cn("h-20 rounded-md border border-slate-300 shadow-inner", option.preview)} />
                <span className="text-sm font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

export default Header
