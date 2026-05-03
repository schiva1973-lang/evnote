import { create } from 'zustand'

export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rectEraser' | 'text' | 'image' | 'select'
export type BackgroundType = 'lined' | 'grid' | 'dot' | 'blank'

interface ToolSettings {
  color: string
  width: number
}

interface CanvasState {
  activeTool: ToolType
  brushColor: string
  brushWidth: number
  toolSettings: {
    pen: ToolSettings
    highlighter: ToolSettings
  }
  zoom: number
  isPenMode: boolean
  backgroundType: BackgroundType
  setActiveTool: (tool: ToolType) => void
  setBrushColor: (color: string) => void
  setBrushWidth: (width: number) => void
  setZoom: (zoom: number) => void
  setIsPenMode: (isPenMode: boolean) => void
  setBackgroundType: (type: BackgroundType) => void
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  activeTool: 'pen',
  brushColor: '#000000',
  brushWidth: 2,
  toolSettings: {
    pen: { color: '#000000', width: 2 },
    highlighter: { color: '#ffff00', width: 12 },
  },
  zoom: 1,
  isPenMode: true,
  backgroundType: 'lined',
  setActiveTool: (tool) => {
    const { toolSettings } = get()
    if (tool === 'pen' || tool === 'highlighter') {
      const settings = toolSettings[tool]
      set({ 
        activeTool: tool,
        brushColor: settings.color,
        brushWidth: settings.width
      })
    } else {
      set({ activeTool: tool })
    }
  },
  setBrushColor: (color) => {
    const { activeTool, toolSettings } = get()
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      set({
        brushColor: color,
        toolSettings: {
          ...toolSettings,
          [activeTool]: { ...toolSettings[activeTool], color }
        }
      })
    } else {
      set({ brushColor: color })
    }
  },
  setBrushWidth: (width) => {
    const { activeTool, toolSettings } = get()
    if (activeTool === 'pen' || activeTool === 'highlighter') {
      set({
        brushWidth: width,
        toolSettings: {
          ...toolSettings,
          [activeTool]: { ...toolSettings[activeTool], width }
        }
      })
    } else {
      set({ brushWidth: width })
    }
  },
  setZoom: (zoom) => set({ zoom: zoom }),
  setIsPenMode: (isPenMode) => set({ isPenMode }),
  setBackgroundType: (type) => set({ backgroundType: type }),
}))
