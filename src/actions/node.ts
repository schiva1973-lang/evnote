'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNodes(notebookId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('notebook_id', notebookId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createNode(notebookId: string, parentNodeId: string | null, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get max sort_order for the parent
  const { data: maxSortNode } = await supabase
    .from('nodes')
    .select('sort_order')
    .eq('notebook_id', notebookId)
    .is('parent_node_id', parentNodeId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = maxSortNode ? maxSortNode.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('nodes')
    .insert([{ notebook_id: notebookId, parent_node_id: parentNodeId, name, sort_order: sortOrder, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updateNode(id: string, updates: { name?: string; parent_node_id?: string | null; sort_order?: number }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('nodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deleteNode(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('nodes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function updateNodesOrder(nodesToUpdate: { id: string; parent_node_id: string | null; sort_order: number }[]) {
  const supabase = await createClient()
  
  // Updating multiple rows can be done via bulk upsert or multiple updates.
  // We'll use multiple updates for simplicity since it's a small array.
  for (const node of nodesToUpdate) {
    const { error } = await supabase
      .from('nodes')
      .update({ parent_node_id: node.parent_node_id, sort_order: node.sort_order })
      .eq('id', node.id)
    
    if (error) throw error
  }

  revalidatePath('/')
}
