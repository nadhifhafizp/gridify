'use client'

import { useState } from 'react'
import { createTournamentAction } from '@/actions/tournament-actions'
import { Gamepad2, Trophy, Swords, Info, Users, Target, Crown, Repeat, Settings2 } from 'lucide-react'

type Game = {
  id: string
  name: string
  platform: string
  genre: 'MOBA' | 'FPS' | 'SPORTS' | 'BATTLE_ROYALE'
}

// Helper untuk mendapatkan Label yang sesuai Genre
const getFormatLabel = (formatId: string, genre?: string) => {
  if (formatId === 'HYBRID_UCL') {
    if (genre === 'MOBA') return 'Hybrid (Group + Playoff MPL)'
    if (genre === 'FPS') return 'Hybrid (Group + Playoff Major)'
    return 'Hybrid (Group + Knockout UCL)'
  }
  if (formatId === 'DOUBLE_ELIMINATION') return 'Double Elimination'
  if (formatId === 'SINGLE_ELIMINATION') return 'Single Elimination (Knockout)'
  if (formatId === 'ROUND_ROBIN') return 'Round Robin (League)'
  if (formatId === 'BATTLE_ROYALE') return 'Battle Royale System'
  return formatId
}

const getFormatDesc = (formatId: string, genre?: string) => {
  if (formatId === 'HYBRID_UCL') {
    if (genre === 'MOBA') return 'Fase Grup lalu lanjut ke Upper/Lower Bracket (Standar M-Series/MPL).'
    return 'Fase Grup lalu lanjut ke Fase Gugur (Standar Piala Dunia/UCL).'
  }
  return null
}

// FORMAT OPTIONS DASAR
const FORMAT_OPTIONS = [
  {
    id: 'SINGLE_ELIMINATION',
    icon: Swords,
    validFor: ['MOBA', 'FPS', 'SPORTS'],
    recommendedFor: ['FPS', 'SPORTS']
  },
  {
    id: 'DOUBLE_ELIMINATION',
    icon: Repeat,
    validFor: ['MOBA', 'FPS'],
    recommendedFor: ['MOBA']
  },
  {
    id: 'ROUND_ROBIN',
    icon: Users,
    validFor: ['MOBA', 'FPS', 'SPORTS'],
    recommendedFor: ['SPORTS']
  },
  {
    id: 'HYBRID_UCL',
    icon: Trophy,
    validFor: ['MOBA', 'FPS', 'SPORTS'],
    recommendedFor: ['SPORTS', 'MOBA']
  },
  {
    id: 'BATTLE_ROYALE',
    icon: Target,
    validFor: ['BATTLE_ROYALE'],
    recommendedFor: ['BATTLE_ROYALE']
  }
]

export default function CreateTournamentForm({ games }: { games: Game[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedFormat, setSelectedFormat] = useState('')
  
  const [matchConfig, setMatchConfig] = useState({
    bestOf: '1', 
    homeAway: false,
    pointsPerWin: 3,
  })

  const availableFormats = selectedGame 
    ? FORMAT_OPTIONS.filter(f => f.validFor.includes(selectedGame.genre))
    : []

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    formData.append('settings', JSON.stringify(matchConfig))
    const result = await createTournamentAction(formData)
    if (result?.error) {
      alert('Error: ' + result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. PILIH GAME */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Info size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">Info Dasar</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Nama Turnamen</label>
            <input 
              name="title" 
              type="text" 
              placeholder="e.g. Sunday Cup Season 1" 
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Pilih Game</label>
            <div className="relative">
              <select 
                name="gameId" 
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                onChange={(e) => {
                  const game = games.find(g => g.id === e.target.value)
                  setSelectedGame(game || null)
                  setSelectedFormat('')
                  setMatchConfig({ bestOf: '1', homeAway: false, pointsPerWin: 3 })
                }}
              >
                <option value="">-- Select Game --</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.platform})</option>
                ))}
              </select>
              <Gamepad2 className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PILIH FORMAT (Label Dinamis) */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            <Trophy size={20} />
          </div>
          <h3 className="text-lg font-semibold text-white">Format Kompetisi</h3>
        </div>

        {!selectedGame ? (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
            <p>Pilih game dulu untuk melihat format yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableFormats.map((format) => {
              const isRecommended = format.recommendedFor?.includes(selectedGame.genre)
              // Label Dinamis
              const label = getFormatLabel(format.id, selectedGame.genre)
              const desc = getFormatDesc(format.id, selectedGame.genre) || 'Format standar kompetisi.'
              
              return (
                <label 
                  key={format.id}
                  className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all group ${
                    selectedFormat === format.id 
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' 
                      : 'border-slate-700 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="formatType" 
                    value={format.id} 
                    className="absolute opacity-0"
                    checked={selectedFormat === format.id}
                    onChange={() => setSelectedFormat(format.id)}
                    required
                  />
                  
                  {isRecommended && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      RECOMMENDED
                    </span>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${selectedFormat === format.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                      <format.icon size={24} />
                    </div>
                    <div>
                      <span className={`block font-bold text-lg ${selectedFormat === format.id ? 'text-white' : 'text-slate-200'}`}>
                        {label}
                      </span>
                      <span className="text-sm text-slate-400 mt-1 block leading-relaxed">
                        {desc}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. PENGATURAN MATCH (GAME SETTINGS) */}
      {selectedGame && selectedFormat && selectedFormat !== 'BATTLE_ROYALE' && (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
              <Settings2 size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Pengaturan Match ({selectedGame.genre === 'SPORTS' ? 'Football Config' : 'Esport Config'})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* OPSI SPORTS */}
            {selectedGame.genre === 'SPORTS' && (
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-900/50 cursor-pointer hover:border-slate-600 transition-all">
                  <div>
                    <span className="block font-bold text-white">Mode Home & Away</span>
                    <span className="text-xs text-slate-400">2 Leg (Kandang/Tandang). Agregat skor.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-6 h-6 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                    checked={matchConfig.homeAway}
                    onChange={(e) => setMatchConfig({...matchConfig, homeAway: e.target.checked})}
                  />
                </label>
              </div>
            )}

            {/* OPSI MOBA/FPS */}
            {(selectedGame.genre === 'MOBA' || selectedGame.genre === 'FPS') && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Match Series</label>
                <div className="grid grid-cols-3 gap-3">
                  {['1', '3', '5'].map((bo) => (
                    <button
                      key={bo}
                      type="button"
                      onClick={() => setMatchConfig({...matchConfig, bestOf: bo})}
                      className={`py-3 px-4 rounded-xl border font-bold transition-all ${
                        matchConfig.bestOf === bo 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                          : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      BO{bo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT */}
      <div className="flex justify-end pt-4">
        <button 
          type="submit" 
          disabled={loading || !selectedFormat}
          className="px-8 py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Create Tournament'}
        </button>
      </div>
    </form>
  )
}