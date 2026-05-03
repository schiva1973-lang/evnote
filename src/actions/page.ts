'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPages(nodeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('node_id', nodeId)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createPage(nodeId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get max sort_order for the node
  const { data: maxSortPage } = await supabase
    .from('pages')
    .select('sort_order')
    .eq('node_id', nodeId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = maxSortPage ? maxSortPage.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('pages')
    .insert([{ node_id: nodeId, title, sort_order: sortOrder, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function updatePage(id: string, updates: { title?: string; node_id?: string; sort_order?: number; canvas_data?: any }) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/')
  return data
}

export async function deletePage(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('pages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function updatePagesOrder(pagesToUpdate: { id: string; node_id: string; sort_order: number }[]) {
  const supabase = await createClient()
  
  for (const page of pagesToUpdate) {
    const { error } = await supabase
      .from('pages')
      .update({ node_id: page.node_id, sort_order: page.sort_order })
      .eq('id', page.id)
    
    if (error) throw error
  }

  revalidatePath('/')
}
