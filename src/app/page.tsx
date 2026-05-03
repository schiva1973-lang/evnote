import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/login/actions'
import { Sidebar } from '@/components/Sidebar'
import { CanvasEditor } from '@/components/CanvasEditor'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="w-full p-4 bg-white border-b flex justify-between items-center shrink-0">
        <h1 className="text-xl font-bold">EveryNote</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <form action={signOut}>
            <button className="text-sm text-red-500 hover:underline">Sign out</button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <Sidebar />

        <section className="flex-1 bg-white shadow m-4 rounded-md flex items-center justify-center overflow-hidden">
          <CanvasEditor />
        </section>
      </main>
    </div>
  )
}
