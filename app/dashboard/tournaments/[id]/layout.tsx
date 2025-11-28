'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, LayoutGrid, Users, Trophy, Settings, Swords } from 'lucide-react'
import { use } from 'react'

export default function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  // Unwrapping params (Next.js 15+ standard)
  const { id } = use(params)
  const pathname = usePathname()
  const router = useRouter()

  const baseUrl = `/dashboard/tournaments/${id}`

  const menuItems = [
    { name: 'Overview', href: `${baseUrl}`, icon: LayoutGrid, exact: true },
    { name: 'Participants', href: `${baseUrl}/participants`, icon: Users },
    { name: 'Bracket & Match', href: `${baseUrl}/bracket`, icon: Swords },
    { name: 'Standings', href: `${baseUrl}/standings`, icon: Trophy },
    { name: 'Settings', href: `${baseUrl}/settings`, icon: Settings },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Top Navigation Bar khusus Turnamen */}
      <div className="flex items-center gap-4 pb-6 border-b border-white/5 mb-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Tournament Control</h2>
          <p className="text-xs text-slate-400 font-mono">ID: {id.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon size={16} />
              {item.name}
            </Link>
          )
        })}
      </div>

      {/* Konten Halaman (Overview/Bracket/dll) */}
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {children}
      </div>
    </div>
  )
}