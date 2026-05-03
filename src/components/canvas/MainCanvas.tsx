import React, { useEffect, useRef, useCallback } from 'react'
import { fabric } from 'fabric'
import { useCanvasStore } from '@/store/useCanvasStore'
import { useUIStore } from '@/store/useUIStore'
import { supabase } from '@/lib/supabase'
import debounce from 'lodash.debounce'

const MainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialLoad = useRef(true)
  
  // States/Refs for interactive tools
  const isMouseDownRef = useRef(false)
  const eraserRectRef = useRef<fabric.Rect | null>(null)
  const startPointRef = useRef<{ x: number, y: number } | null>(null)
  const lastTouchDistance = useRef<number | null>(null)
  const isPanning = useRef(false)
  
  const { 
    activeTool, 
    brushColor, 
    brushWidth, 
    zoom, 
    setZoom,
    setActiveTool,
    backgroundType
  } = useCanvasStore()
  const currentPageId = useUIStore((state) => state.currentPageId)

  // Function to set canvas background pattern
  const updateBackground = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const gridSize = 35 // Optimal size for note lines

    // Create a temporary canvas for the pattern
    const patternCanvas = document.createElement('canvas')
    const ctx = patternCanvas.getContext('2d')
    if (!ctx) return

    patternCanvas.width = gridSize
    patternCanvas.height = gridSize

    // Always fill background with white first
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, gridSize, gridSize)

    if (backgroundType === 'blank') {
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas))
      return
    }

    if (backgroundType === 'lined') {
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.15)' // Light blue line
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, gridSize)
      ctx.lineTo(gridSize, gridSize)
      ctx.stroke()
    } else if (backgroundType === 'grid') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)' // Very light gray grid
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, gridSize, gridSize)
    } else if (backgroundType === 'dot') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)' // Light dot
      ctx.beginPath()
      ctx.arc(gridSize / 2, gridSize / 2, 1, 0, Math.PI * 2)
      ctx.fill()
    }

    const pattern = new fabric.Pattern({
      source: patternCanvas as any,
      repeat: 'repeat'
    })

    canvas.setBackgroundColor(pattern, () => {
      canvas.renderAll()
    })
  }, [backgroundType])

  // 1. Initialize Canvas (Run Once)
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
      stopContextMenu: true,
    })

    fabricRef.current = canvas

    const handleResize = () => {
      if (containerRef.current) {
        canvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.dispose()
    }
  }, [])

  // 2. Mouse Events Management (Handles specific tools)
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleMouseDown = (opt: fabric.IEvent) => {
      const isPenMode = useCanvasStore.getState().isPenMode
      const pointerType = (opt.e as any).pointerType || 'mouse'
      
      // Multitouch check (Zoom/Pan)
      const touches = (opt.e as any).touches
      if (touches && touches.length === 2) {
        isPanning.current = true
        const dist = Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        )
        lastTouchDistance.current = dist
        return
      }

      if (isPenMode && pointerType === 'touch') return

      isMouseDownRef.current = true
      const pointer = canvas.getPointer(opt.e)

      if (activeTool === 'rectEraser') {
        const point = { x: pointer.x, y: pointer.y }
        startPointRef.current = point
        
        const rect = new fabric.Rect({
          left: point.x,
          top: point.y,
          width: 0,
          height: 0,
          fill: 'rgba(255, 0, 0, 0.2)',
          stroke: 'red',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          strokeDashArray: [5, 5]
        })
        canvas.add(rect)
        eraserRectRef.current = rect
      } else if (activeTool === 'text') {
        const text = new fabric.IText('텍스트를 입력하세요', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'sans-serif',
          fontSize: 20,
          fill: useCanvasStore.getState().brushColor
        })
        canvas.add(text)
        canvas.setActiveObject(text)
        useCanvasStore.getState().setActiveTool('select')
      } else if (activeTool === 'image') {
        fileInputRef.current?.click()
      }
    }

    const handleMouseMove = (opt: fabric.IEvent) => {
      const touches = (opt.e as any).touches
      
      // Handle Multitouch Zoom/Pan
      if (touches && touches.length === 2 && isPanning.current) {
        const dist = Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        )
        
        if (lastTouchDistance.current) {
          const delta = dist / lastTouchDistance.current
          let newZoom = canvas.getZoom() * delta
          
          if (newZoom > 20) newZoom = 20
          if (newZoom < 0.01) newZoom = 0.01
          
          const centerX = (touches[0].clientX + touches[1].clientX) / 2
          const centerY = (touches[0].clientY + touches[1].clientY) / 2
          
          const offset = containerRef.current?.getBoundingClientRect()
          if (offset) {
            canvas.zoomToPoint({ 
              x: centerX - offset.left, 
              y: centerY - offset.top 
            }, newZoom)
            setZoom(newZoom)
          }
        }
        
        lastTouchDistance.current = dist
        return
      }

      const isActuallyDown = isMouseDownRef.current || ((opt.e as any).buttons > 0)
      if (!isActuallyDown) return

      const pointer = canvas.getPointer(opt.e)

      if (activeTool === 'rectEraser') {
        if (eraserRectRef.current && startPointRef.current) {
          const left = Math.min(startPointRef.current.x, pointer.x)
          const top = Math.min(startPointRef.current.y, pointer.y)
          const width = Math.abs(startPointRef.current.x - pointer.x)
          const height = Math.abs(startPointRef.current.y - pointer.y)
          
          eraserRectRef.current.set({ left, top, width, height })
          eraserRectRef.current.setCoords()
          canvas.renderAll()
        }
      } else if (activeTool === 'eraser') {
        const objects = canvas.getObjects().slice()
        objects.forEach((obj: any) => {
          if (obj === eraserRectRef.current) return
          if (obj.containsPoint(pointer)) {
            canvas.remove(obj)
          }
        })
        canvas.renderAll()
      }
    }

    const handleMouseUp = () => {
      isPanning.current = false
      lastTouchDistance.current = null

      if (activeTool === 'rectEraser') {
        const rect = eraserRectRef.current
        if (rect) {
          rect.setCoords()
          const objects = canvas.getObjects().slice()
          const toRemove: fabric.Object[] = []
          
          objects.forEach((obj) => {
            if (obj === rect) return
            if (rect.intersectsWithObject(obj) || obj.isContainedWithinObject(rect)) {
              toRemove.push(obj)
            }
          })

          toRemove.forEach((obj) => canvas.remove(obj))
          canvas.remove(rect)
          eraserRectRef.current = null
          startPointRef.current = null
          canvas.renderAll()
        }
      }
      
      isMouseDownRef.current = false
    }

    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:move', handleMouseMove)
    canvas.on('mouse:up', handleMouseUp)

    return () => {
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:move', handleMouseMove)
      canvas.off('mouse:up', handleMouseUp)
    }
  }, [activeTool])

  // 3. Wheel event (Stable)
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleWheel = (opt: fabric.IEvent) => {
      const delta = (opt.e as any).deltaY
      let newZoom = canvas.getZoom()
      newZoom *= 0.999 ** delta
      if (newZoom > 20) newZoom = 20
      if (newZoom < 0.01) newZoom = 0.01
      canvas.zoomToPoint({ x: (opt.e as any).offsetX, y: (opt.e as any).offsetY }, newZoom)
      setZoom(newZoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    }

    canvas.on('mouse:wheel', handleWheel)
    return () => {
      canvas.off('mouse:wheel', handleWheel)
    }
  }, [setZoom])

  // 4. Load page data
  useEffect(() => {
    if (!fabricRef.current || !currentPageId) return

    const loadPageData = async () => {
      // Set white background immediately to avoid black flickering during load
      fabricRef.current?.setBackgroundColor('#ffffff', fabricRef.current?.renderAll.bind(fabricRef.current))
      
      const { data, error } = await supabase
        .from('pages')
        .select('canvas_data')
        .eq('id', currentPageId)
        .single()
      
      if (!error && data && data.canvas_data) {
        isInitialLoad.current = true
        fabricRef.current?.loadFromJSON(data.canvas_data, () => {
          updateBackground()
          fabricRef.current?.renderAll()
          isInitialLoad.current = false
        })
      } else {
        fabricRef.current?.clear()
        updateBackground()
        isInitialLoad.current = false
      }
    }

    loadPageData()
  }, [currentPageId, updateBackground])

  // 5. Auto-save logic
  const saveCanvasData = useCallback(
    debounce(async (json: any) => {
      const currentId = useUIStore.getState().currentPageId
      if (!currentId) return
      
      await supabase
        .from('pages')
        .update({ canvas_data: json, updated_at: new Date().toISOString() })
        .eq('id', currentId)
    }, 2000),
    []
  )

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    const handleChange = () => {
      if (isInitialLoad.current) return
      const json = canvas.toJSON()
      saveCanvasData(json)
    }

    canvas.on('object:added', handleChange)
    canvas.on('object:modified', handleChange)
    canvas.on('object:removed', handleChange)
    canvas.on('path:created', handleChange)

    return () => {
      canvas.off('object:added', handleChange)
      canvas.off('object:modified', handleChange)
      canvas.off('object:removed', handleChange)
      canvas.off('path:created', handleChange)
    }
  }, [saveCanvasData])

  // 6. Update tool settings
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    canvas.isDrawingMode = ['pen', 'highlighter'].includes(activeTool)
    canvas.selection = activeTool === 'select'
    canvas.skipTargetFind = ['eraser', 'rectEraser'].includes(activeTool)
    
    canvas.forEachObject((obj) => {
      obj.selectable = activeTool === 'select'
      obj.hoverCursor = activeTool === 'select' ? 'move' : 'default'
    })

    if (canvas.isDrawingMode) {
      if (activeTool === 'pen') {
        const brush = new fabric.PencilBrush(canvas)
        brush.color = brushColor
        brush.width = brushWidth
        brush.decimate = 1.5
        canvas.freeDrawingBrush = brush
      } else if (activeTool === 'highlighter') {
        const brush = new fabric.PencilBrush(canvas)
        const r = parseInt(brushColor.slice(1, 3), 16)
        const g = parseInt(brushColor.slice(3, 5), 16)
        const b = parseInt(brushColor.slice(5, 7), 16)
        brush.color = `rgba(${r}, ${g}, ${b}, 0.5)`
        brush.width = brushWidth * 4
        brush.decimate = 1.5
        canvas.freeDrawingBrush = brush
      }
    }
  }, [activeTool, brushColor, brushWidth])

  // 7. Update zoom from store
  useEffect(() => {
    if (fabricRef.current && fabricRef.current.getZoom() !== zoom) {
      fabricRef.current.setZoom(zoom)
    }
  }, [zoom])

  // 8. Update background when backgroundType changes
  useEffect(() => {
    updateBackground()
  }, [updateBackground])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fabricRef.current) return

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `images/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('canvas-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('canvas-assets')
        .getPublicUrl(filePath)

      // 3. Add to Fabric Canvas
      fabric.Image.fromURL(publicUrl, (img: any) => {
        img.scaleToWidth(300)
        fabricRef.current?.add(img)
        fabricRef.current?.centerObject(img)
        fabricRef.current?.setActiveObject(img)
        setActiveTool('select')
        
        // Trigger save
        const json = fabricRef.current?.toJSON()
        saveCanvasData(json)
      }, { crossOrigin: 'anonymous' })
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas ref={canvasRef} />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
      
      {!currentPageId && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
          <p className="text-muted-foreground">페이지를 선택하여 시작하세요.</p>
        </div>
      )}
    </div>
  )
}

export default MainCanvas
