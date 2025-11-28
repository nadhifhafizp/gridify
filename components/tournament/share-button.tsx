'use client'

import { useState } from 'react'
import { Share2, Check, Copy, Globe, QrCode, X } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code' // <--- Import QR

export default function ShareButton({ tournamentId }: { tournamentId: string }) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showQR, setShowQR] = useState(false) // State untuk mode QR

  // Pastikan kode ini berjalan di client untuk akses window
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const publicPath = `/t/${tournamentId}`
  const fullUrl = `${origin}${publicPath}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all"
      >
        <Share2 size={18} />
        <span>Bagikan</span>
      </button>

      {/* Dropdown / Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          
          <div className="absolute top-full right-0 mt-2 w-80 p-5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Popover */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe size={16} className="text-indigo-400"/> Bagikan Turnamen
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Peserta dapat melihat jadwal & klasemen via link ini.
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Opsi Tab: Link vs QR */}
            <div className="flex bg-slate-950 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setShowQR(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!showQR ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Copy Link
              </button>
              <button 
                onClick={() => setShowQR(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${showQR ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                QR Code
              </button>
            </div>

            {/* KONTEN: LINK COPY */}
            {!showQR && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-slate-800">
                  <code className="text-xs text-slate-300 truncate flex-1 font-mono select-all">
                    {fullUrl}
                  </code>
                  <button 
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors shrink-0"
                    title="Salin Link"
                  >
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                  </button>
                </div>
                <Link 
                  href={publicPath} 
                  target="_blank"
                  className="block w-full py-2 text-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                >
                  Buka Halaman Publik ↗
                </Link>
              </div>
            )}

            {/* KONTEN: QR CODE */}
            {showQR && (
              <div className="flex flex-col items-center justify-center py-2 space-y-3 bg-white p-4 rounded-xl">
                <div className="p-2 bg-white rounded-lg">
                  <QRCode
                    size={128}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={fullUrl}
                    viewBox={`0 0 256 256`}
                  />
                </div>
                <p className="text-[10px] text-slate-900 font-medium text-center">
                  Scan untuk buka di HP
                </p>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}