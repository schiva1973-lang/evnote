export interface Notebook {
  id: string
  user_id: string
  name: string
  type: 'general' | 'tree'
  created_at: string
  updated_at: string
}

export interface Node {
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
