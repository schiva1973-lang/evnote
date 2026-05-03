'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { NotebookType } from '@/store/useNotebookStore'

export async function getNotebooks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createNotebook(name: string, type: NotebookType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notebooks')
    .insert([{ name, type, user_id: user.id }])
    .select()
    .single()

  if (error) throw error

  // If it's a general notebook or even a tree notebook, we might want a root node.
  // Actually, let's create a default root node for every notebook.
  const { data: node, error: nodeError } = await supabase
    .from('nodes')
    .insert([{ 
      notebook_id: data.id, 
      user_id: user.id,
      name: 'Root',
      parent_node_id: null,
      sort_order: 0
    }])
    .select()
    .single()

  if (nodeError) throw nodeError

  revalidatePath('/')
  return { notebook: data, rootNode: node }
}

export async function deleteNotebook(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notebooks').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/')
}

export async function renameNotebook(id: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('notebooks').update({ name }).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/')
  return data
}
