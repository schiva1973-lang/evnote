'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { fabric } from 'fabric'
import { useNotebookStore } from '@/store/useNotebookStore'
import { updatePage } from '@/actions/page'
import { Button } from '@/components/ui/button'
import { Type, PenTool, Eraser, MousePointer2, Save } from 'lucide-react'

export function CanvasEditor() {
  const { selectedPage, setPages, pages } = useNotebookStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [mode, setMode] = useState<'select' | 'draw' | 'text' | 'erase'>('select')
  const [isSaving, setIsSaving] = useState(false)

  // Initialization and data loading
  useEffect(() => {
    if (!canvasRef.current || !selectedPage) return

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: window.innerWidth - 256 - 32, // approx main area width
      height: window.innerHeight - 150,
      backgroundColor: '#ffffff',
    })
    fabricRef.current = canvas

    // Load data if available
    if (selectedPage.canvas_data && Object.keys(selectedPage.canvas_data).length > 0) {
      canvas.loadFromJSON(selectedPage.canvas_data, () => {
        canvas.renderAll()
      })
    }

    // Auto-resize
    const resizeCanvas = () => {
      if (canvasRef.current?.parentElement) {
        canvas.setWidth(canvasRef.current.parentElement.clientWidth)
        canvas.setHeight(canvasRef.current.parentElement.clientHeight)
        canvas.renderAll()
      }
    }
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [selectedPage?.id]) // Re-init when selected page changes

  // Auto-save logic
  const saveCanvas = useCallback(async () => {
    if (!fabricRef.current || !selectedPage) return
    setIsSaving(true)
    try {
      const json = fabricRef.current.toJSON()
      const updated = await updatePage(selectedPage.id, { canvas_data: json })
      
      // Update local store
      const newPages = pages.map(p => p.id === updated.id ? updated : p)
      setPages(newPages)
    } catch (e) {
      console.error('Failed to save canvas', e)
    } finally {
      setIsSaving(false)
    }
  }, [selectedPage, pages, setPages])

  // Save on modification after 2s debounce
  useEffect(() => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current
    let timeout: NodeJS.Timeout

    const onModify = () => {
      clearTimeout(timeout)
      timeout = setTimeout(saveCanvas, 2000)
    }

    canvas.on('object:modified', onModify)
    canvas.on('object:added', onModify)
    canvas.on('object:removed', onModify)
    canvas.on('path:created', onModify)

    return () => {
      canvas.off('object:modified', onModify)
      canvas.off('object:added', onModify)
      canvas.off('object:removed', onModify)
      canvas.off('path:created', onModify)
      clearTimeout(timeout)
    }
  }, [saveCanvas])

  // Mode switching logic
  useEffect(() => {
    if (!fabricRef.current) return
    const canvas = fabricRef.current

    canvas.isDrawingMode = mode === 'draw'

    if (mode === 'draw') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingBrush.color = '#000000'
      canvas.freeDrawingBrush.width = 3
    }

    // Handle Text mode click
    const handleMouseDown = (opt: fabric.IEvent) => {
      if (mode === 'text' && !opt.target) {
        const pointer = canvas.getPointer(opt.e)
        const text = new fabric.IText('Double click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fontFamily: 'sans-serif',
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        setMode('select') // Revert to select after adding text
      } else if (mode === 'erase' && opt.target) {
        canvas.remove(opt.target)
      }
    }

    canvas.on('mouse:down', handleMouseDown)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
    }
  }, [mode])

  // Delete selected objects with Backspace/Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (!fabricRef.current) return
        const activeObjects = fabricRef.current.getActiveObjects()
        if (activeObjects.length) {
          // If editing text, don't delete the object
          if ((fabricRef.current.getActiveObject() as fabric.IText)?.isEditing) return
          activeObjects.forEach(obj => fabricRef.current?.remove(obj))
          fabricRef.current.discardActiveObject()
          saveCanvas()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveCanvas])


  if (!selectedPage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
        <p>Select a notebook and page to start editing.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 z-10 border">
        <Button 
          variant={mode === 'select' ? 'default' : 'ghost'} 
          size="icon" 
          onClick={() => setMode('select')}
          title="Select"
        >
          <MousePointer2 className="w-4 h-4" />
        </Button>
        <Button 
          variant={mode === 'draw' ? 'default' : 'ghost'} 
          size="icon" 
          onClick={() => setMode('draw')}
          title="Draw"
        >
          <PenTool className="w-4 h-4" />
        </Button>
        <Button 
          variant={mode === 'text' ? 'default' : 'ghost'} 
          size="icon" 
          onClick={() => setMode('text')}
          title="Text"
        >
          <Type className="w-4 h-4" />
        </Button>
        <Button 
          variant={mode === 'erase' ? 'default' : 'ghost'} 
          size="icon" 
          onClick={() => setMode('erase')}
          title="Eraser"
        >
          <Eraser className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-gray-200 mx-2" />
        
        <Button variant="ghost" size="icon" onClick={saveCanvas} disabled={isSaving} title="Force Save">
          <Save className={`w-4 h-4 ${isSaving ? 'opacity-50' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 w-full h-full overflow-hidden bg-gray-50 flex items-center justify-center">
        <canvas ref={canvasRef} className="border shadow-sm" />
      </div>
    </div>
  )
}
