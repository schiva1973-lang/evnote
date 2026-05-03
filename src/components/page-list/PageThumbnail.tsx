import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { FileText } from 'lucide-react'
import { Page } from '@/types'

interface PageThumbnailProps {
  page: Page
}

const THUMB_WIDTH = 220
const THUMB_HEIGHT = 150

const PageThumbnail: React.FC<PageThumbnailProps> = ({ page }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasPreview, setHasPreview] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !page.canvas_data || Object.keys(page.canvas_data).length === 0) {
      setHasPreview(false)
      return
    }

    const canvas = new fabric.StaticCanvas(canvasRef.current, {
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      backgroundColor: '#ffffff',
      renderOnAddRemove: false,
    })

    let disposed = false
    canvas.loadFromJSON(page.canvas_data, () => {
      if (disposed) return

      const objects = canvas.getObjects()
      if (objects.length > 0) {
        const bounds = objects.reduce(
          (acc, object) => {
            const rect = object.getBoundingRect(true, true)
            return {
              left: Math.min(acc.left, rect.left),
              top: Math.min(acc.top, rect.top),
              right: Math.max(acc.right, rect.left + rect.width),
              bottom: Math.max(acc.bottom, rect.top + rect.height),
            }
          },
          { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
        )

        const contentWidth = Math.max(bounds.right - bounds.left, 1)
        const contentHeight = Math.max(bounds.bottom - bounds.top, 1)
        const scale = Math.min((THUMB_WIDTH - 24) / contentWidth, (THUMB_HEIGHT - 24) / contentHeight, 0.45)

        canvas.setViewportTransform([
          scale,
          0,
          0,
          scale,
          12 - bounds.left * scale,
          12 - bounds.top * scale,
        ])
      }

      canvas.renderAll()
      setHasPreview(true)
    })

    return () => {
      disposed = true
      canvas.dispose()
    }
  }, [page.canvas_data])

  return (
    <div className="relative h-[150px] w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-inner">
      <canvas
        ref={canvasRef}
        width={THUMB_WIDTH}
        height={THUMB_HEIGHT}
        className={hasPreview ? 'h-full w-full' : 'hidden'}
      />
      {!hasPreview && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[linear-gradient(to_bottom,transparent_31px,rgba(0,122,255,0.16)_32px)] bg-[length:100%_32px] text-muted-foreground">
          <FileText className="h-8 w-8" />
          <span className="max-w-[85%] truncate text-xs font-medium">{page.title}</span>
        </div>
      )}
    </div>
  )
}

export default PageThumbnail
