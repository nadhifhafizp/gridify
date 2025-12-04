import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BasicInfoForm from '@/features/auth/components/basic-info-form'
import SecurityForm from '@/features/auth/components/security-form'
import { BadgeCheck, Mail } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const fullName = user.user_metadata?.full_name || 'User Gridify'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- HEADER CARD --- */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1a1b26] border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
        {/* Background Decoration (Updated for Tailwind v4) */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-600"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Avatar (Updated for Tailwind v4) */}
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-linear-to-br from-slate-800 to-slate-900 border-4 border-slate-800 flex items-center justify-center shrink-0 shadow-lg relative z-10">
          <span className="text-2xl md:text-3xl font-bold text-white tracking-widest">{initials}</span>
        </div>

        {/* User Info */}
        <div className="text-center md:text-left relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{fullName}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">
              <Mail size={14} />
              <span>{user.email}</span>
            </div>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 uppercase tracking-wide">
              <BadgeCheck size={12} /> Verified Member
            </span>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-2">
          <BasicInfoForm user={user} />
        </div>
        <div className="lg:col-span-1">
          <SecurityForm user={user} />
        </div>
      </div>
    </div>
  )
}