import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BasicInfoForm from '@/features/auth/components/basic-info-form'
import SecurityForm from '@/features/auth/components/security-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Inisial Avatar (Misal: Nadhif Hafiz -> NH)
  const fullName = user.user_metadata?.full_name || 'User'
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Profile Card */}
      <div className="flex items-center gap-6 p-6 rounded-2xl bg-linear-to-r from-indigo-900/50 to-purple-900/50 border border-white/10">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white border-2 border-white/20 shadow-xl">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{fullName}</h1>
          <p className="text-indigo-200 text-sm flex items-center gap-2">
            {user.email}
            {/* Badge Verified */}
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30 uppercase">
              Verified
            </span>
          </p>
          <p className="text-slate-400 text-xs mt-2">Member sejak {new Date(user.created_at).getFullYear()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kiri: Info Dasar (Lebar) */}
        <div className="lg:col-span-2 space-y-8">
          <BasicInfoForm user={user} />
        </div>

        {/* Kanan: Security (Sempit) */}
        <div className="space-y-8">
          <SecurityForm user={user} />
        </div>
      </div>
    </div>
  )
}