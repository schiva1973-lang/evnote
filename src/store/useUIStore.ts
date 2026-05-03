import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  currentNotebookId: string | null
  currentNodeId: string | null
  currentPageId: string | null
  toggleSidebar: () => void
  setCurrentNotebookId: (id: string | null) => void
  setCurrentNodeId: (id: string | null) => void
  setCurrentPageId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  currentNotebookId: null,
  currentNodeId: null,
  currentPageId: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setCurrentNotebookId: (id) => set({ currentNotebookId: id }),
  setCurrentNodeId: (id) => set({ currentNodeId: id }),
  setCurrentPageId: (id) => set({ currentPageId: id }),
}))
