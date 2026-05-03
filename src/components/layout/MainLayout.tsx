import React from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useUIStore } from '@/store/useUIStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen)

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full border-r bg-muted/30 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 overflow-hidden border-none"
        )}
      >
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header />
        <main className="flex-1 relative overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
