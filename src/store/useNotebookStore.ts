import { create } from 'zustand'

export type NotebookType = 'general' | 'tree'

export interface Notebook {
  id: string
  user_id: string
  name: string
  type: NotebookType
  created_at: string
  updated_at: string
}

export interface TreeNode {
  id: string
  notebook_id: string
  user_id: string
  parent_node_id: string | null
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  node_id: string
  user_id: string
  title: string
  canvas_data: any
  sort_order: number
  created_at: string
  updated_at: string
}

interface NotebookStore {
  notebooks: Notebook[]
  setNotebooks: (notebooks: Notebook[]) => void
  selectedNotebook: Notebook | null
  setSelectedNotebook: (notebook: Notebook | null) => void

  nodes: TreeNode[]
  setNodes: (nodes: TreeNode[]) => void
  
  pages: Page[]
  setPages: (pages: Page[]) => void
  selectedPage: Page | null
  setSelectedPage: (page: Page | null) => void
}

export const useNotebookStore = create<NotebookStore>((set) => ({
  notebooks: [],
  setNotebooks: (notebooks) => set({ notebooks }),
  selectedNotebook: null,
  setSelectedNotebook: (notebook) => set({ selectedNotebook: notebook }),

  nodes: [],
  setNodes: (nodes) => set({ nodes }),

  pages: [],
  setPages: (pages) => set({ pages }),
  selectedPage: null,
  setSelectedPage: (page) => set({ selectedPage: page }),
}))
