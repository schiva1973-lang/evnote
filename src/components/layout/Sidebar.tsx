import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Plus, Book, Loader2, Trash2, LogOut, MoreVertical, Edit2 } from 'lucide-react'
import { Notebook } from '@/types'
import NotebookTree from '@/components/sidebar/NotebookTree'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const Sidebar: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'general' | 'tree'>('general')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const { currentNotebookId, setCurrentNotebookId } = useUIStore()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (user) {
      fetchNotebooks()
    }
  }, [user])

  const fetchNotebooks = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setNotebooks(data)
    }
    setIsLoading(false)
  }

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return

    setIsCreating(true)
    const { data, error } = await supabase
      .from('notebooks')
      .insert([
        { name: newName, type: newType, user_id: user.id }
      ])
      .select()
      .single()

    if (!error && data) {
      setNotebooks([data, ...notebooks])
      setNewName('')
      setIsModalOpen(false)
      setCurrentNotebookId(data.id)
    }
    setIsCreating(false)
  }

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm('노트북을 삭제하시겠습니까? 하위 노드와 페이지가 모두 삭제됩니다.')) return

    const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setNotebooks(notebooks.filter(nb => nb.id !== id))
      if (currentNotebookId === id) setCurrentNotebookId(null)
    }
  }

  const handleRenameNotebook = async (id: string) => {
    if (!editValue.trim()) {
      setEditingId(null)
      return
    }

    const { error } = await supabase
      .from('notebooks')
      .update({ name: editValue })
      .eq('id', id)

    if (!error) {
      setNotebooks(notebooks.map(nb => nb.id === id ? { ...nb, name: editValue } : nb))
    }
    setEditingId(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full w-64 border-r bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg tracking-tight">EveryNote</h2>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 노트북 생성</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateNotebook} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">노트북 이름</Label>
                <Input 
                  id="name" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 프로젝트 기록"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">유형</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반 노트 (단일 계층)</SelectItem>
                    <SelectItem value="tree">트리 노트 (계층형)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  생성하기
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notebooks
          </div>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : notebooks.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              노트북이 없습니다.
            </div>
          ) : (
            notebooks.map((nb) => (
              <div key={nb.id}>
                <div className={cn(
                  "flex items-center group rounded-md transition-colors",
                  currentNotebookId === nb.id ? "bg-secondary" : "hover:bg-ghost"
                )}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "flex-1 justify-start gap-2 h-9 px-3 hover:bg-transparent",
                      currentNotebookId === nb.id && "font-medium"
                    )}
                    onClick={() => setCurrentNotebookId(nb.id === currentNotebookId ? null : nb.id)}
                  >
                    <Book className="h-4 w-4 shrink-0" />
                    {editingId === nb.id ? (
                      <Input
                        className="h-7 px-1 text-sm focus-visible:ring-1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleRenameNotebook(nb.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameNotebook(nb.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate flex-1 text-left">{nb.name}</span>
                    )}
                    {nb.type === 'tree' && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Tree</span>
                    )}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(nb.id)
                        setEditValue(nb.name)
                      }}>
                        <Edit2 className="mr-2 h-3 w-3" />
                        <span>이름 변경</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNotebook(nb.id)
                        }}
                      >
                        <Trash2 className="mr-2 h-3 w-3" />
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {currentNotebookId === nb.id && (
                  <NotebookTree notebookId={nb.id} />
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Profile & Logout Area */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground px-1 mb-1 uppercase tracking-tight">Account</span>
            <div className="flex items-center gap-2 px-1">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium truncate max-w-[150px]" title={user?.email || ''}>
                {user?.email}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 h-8 px-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-xs font-semibold">Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
