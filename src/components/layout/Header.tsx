import React from 'react'
import { useUIStore } from '@/store/useUIStore'
import { useCanvasStore, ToolType, BackgroundType } from '@/store/useCanvasStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
  ZoomIn,
  ZoomOut,
  Smartphone,
  Layers
} from 'lucide-react'

const Header: React.FC = () => {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const { 
    activeTool, 
    setActiveTool, 
    zoom, 
    setZoom, 
    isPenMode, 
    setIsPenMode,
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
        <div className="flex items-center gap-2 mr-4 border-r pr-4">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <Select value={backgroundType} onValueChange={(v: BackgroundType) => setBackgroundType(v)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue placeholder="Background" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lined">Lined Paper</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="dot">Dot</SelectItem>
              <SelectItem value="blank">Blank</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 mr-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(5, zoom + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "gap-2 transition-all duration-200",
            isPenMode ? "border-green-500 border-2 text-green-600 shadow-sm bg-green-50/50" : "border-border text-muted-foreground"
          )}
          onClick={() => setIsPenMode(!isPenMode)}
        >
          <Smartphone className={cn("h-4 w-4", isPenMode && "text-green-600")} />
          <span className="font-bold">PEN MODE</span>
        </Button>
      </div>
    </header>
  )
}

export default Header
