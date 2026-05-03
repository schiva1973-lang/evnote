import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import MainLayout from '@/components/layout/MainLayout'
import AuthPage from '@/components/auth/AuthPage'
import MainCanvas from '@/components/canvas/MainCanvas'
import { Loader2 } from 'lucide-react'

function App() {
  const { user, isLoading, setUser, setIsLoading } = useAuthStore()

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setIsLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return (
    <MainLayout>
      <MainCanvas />
    </MainLayout>
  )
}

export default App
