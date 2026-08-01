'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Copy, Check, Share2, X, Smartphone, Link as LinkIcon } from 'lucide-react'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  meetingId: string
  title?: string
}

export function QRCodeModal({ isOpen, onClose, meetingId, title }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false)
  const [meetingUrl, setMeetingUrl] = useState('')
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/room/${meetingId}`
      setMeetingUrl(url)
      setCanShare(!!navigator.share)
    }
  }, [meetingId])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title ? `Join meeting: ${title}` : 'Join Live Meeting',
          text: `Join meeting ${meetingId} on Zoom Clone`,
          url: meetingUrl,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <QrCode className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quick Join QR Code</h3>
            <p className="text-xs text-zinc-400">Scan with your phone camera to join</p>
          </div>
        </div>

        {/* Meeting Details */}
        {title && (
          <div className="mt-4 rounded-lg bg-zinc-900/60 p-2.5 border border-zinc-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Meeting</span>
            <p className="text-sm font-semibold text-zinc-100 truncate">{title}</p>
          </div>
        )}

        {/* QR Code Container */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-inner">
          {meetingUrl ? (
            <QRCodeSVG
              value={meetingUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#09090b"
              level="H"
              includeMargin={false}
            />
          ) : (
            <div className="flex size-48 items-center justify-center text-zinc-400">
              Generating QR Code...
            </div>
          )}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
            <Smartphone className="size-4 text-indigo-600" />
            <span>Point camera to join instantly</span>
          </div>
        </div>

        {/* Meeting ID & Copy Section */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <LinkIcon className="size-4 text-zinc-400 shrink-0" />
              <span className="text-xs text-zinc-300 font-mono truncate">{meetingUrl}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {canShare && (
            <button
              onClick={handleNativeShare}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-200 transition border border-zinc-700"
            >
              <Share2 className="size-4" />
              <span>Share via Apps...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
