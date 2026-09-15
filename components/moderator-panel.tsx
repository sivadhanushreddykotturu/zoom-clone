'use client'

import { useState } from 'react'
import { useLocalParticipant } from '@livekit/components-react'
import { Shield, VolumeX, Mic, MicOff, UserPlus, UserX, Check, AlertCircle, X, Sparkles } from 'lucide-react'

interface ModeratorPanelProps {
  meetingId: string
  isHost: boolean
  isModerator: boolean
  participants: any[]
  onClose: () => void
}

export function ModeratorPanel({
  meetingId,
  isHost,
  isModerator,
  participants,
  onClose
}: ModeratorPanelProps) {
  const { localParticipant } = useLocalParticipant()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [newModEmail, setNewModEmail] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [removedIdentities, setRemovedIdentities] = useState<string[]>([])

  const handleMuteAll = async () => {
    setLoadingAction('mute-all')
    setStatusMsg(null)
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'mute-all' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to mute participants')
      setStatusMsg({ type: 'success', text: 'All participants have been muted.' })
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleKick = async (identity: string) => {
    setLoadingAction(`kick-${identity}`)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'kick-user', targetIdentity: identity })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove participant')
      setStatusMsg({ type: 'success', text: `Removed ${identity} from meeting.` })
      setRemovedIdentities(prev => [...prev, identity])
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleAction = async (actionName: string, identity: string) => {
    setLoadingAction(`${actionName}-${identity}`)
    setStatusMsg(null)
    try {
      const res = await fetch('/api/livekit/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: actionName, targetIdentity: identity })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to perform ${actionName}`)
      setStatusMsg({ type: 'success', text: data.message || `Action ${actionName} successful.` })
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModEmail.trim()) return
    setLoadingAction('add-mod')
    setStatusMsg(null)
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newModeratorEmail: newModEmail.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign moderator')
      setStatusMsg({ type: 'success', text: `${newModEmail} is now a moderator!` })
      setNewModEmail('')
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message })
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-indigo-400">
            <Shield className="size-5" />
            <h3 className="font-bold text-white">Admin & Moderator Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? <Check className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Global Admin Actions */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quick Room Actions</h4>
          <button
            onClick={handleMuteAll}
            disabled={loadingAction === 'mute-all'}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600/20 border border-rose-500/30 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-600/30 transition disabled:opacity-50"
          >
            <VolumeX className="size-4" />
            <span>{loadingAction === 'mute-all' ? 'Muting Everyone...' : 'Mute All Participants'}</span>
          </button>
        </div>

        {/* Add Moderator (Host Only) */}
        {isHost && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Assign New Moderator</h4>
            <form onSubmit={handleAddModerator} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="user@domain.com"
                value={newModEmail}
                onChange={(e) => setNewModEmail(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loadingAction === 'add-mod'}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <UserPlus className="size-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        )}

        {/* Participants & Selective Unmute List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Active Participants ({participants.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {participants.filter(p => !removedIdentities.includes(p.identity)).map((p) => (
              <div
                key={p.identity || p.sid}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="flex size-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 font-bold relative">
                    {(p.name || p.identity || '?')[0].toUpperCase()}
                    {p.raisedHand && (
                      <span className="absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full bg-amber-500 animate-bounce">
                      </span>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-white truncate flex items-center gap-1">
                      {p.name || p.identity}
                      {p.raisedHand && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">Hand Raised</span>}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{p.identity}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.isAudioEnabled ? (
                    <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400 border border-emerald-500/20">
                      <Mic className="size-3" /> Unmuted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                      <MicOff className="size-3" /> Muted
                    </span>
                  )}

                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleAction('restrict-unmute', p.identity)}
                      disabled={loadingAction === `restrict-unmute-${p.identity}`}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                      title="Lock Mic (Prevent Unmuting)"
                    >
                      <VolumeX className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleAction('allow-unmute', p.identity)}
                      disabled={loadingAction === `allow-unmute-${p.identity}`}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition"
                      title="Unlock Mic (Allow Unmuting)"
                    >
                      <Mic className="size-3.5" />
                    </button>

                    {isHost && p.identity !== localParticipant.identity && (
                      <button
                        onClick={() => handleAction('transfer-host', p.identity)}
                        disabled={loadingAction === `transfer-host-${p.identity}`}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition"
                        title="Make Host"
                      >
                        <Shield className="size-3.5" />
                      </button>
                    )}

                    {(isHost || isModerator) && p.identity !== localParticipant.identity && (
                      <button
                        onClick={() => handleKick(p.identity)}
                        disabled={loadingAction === `kick-${p.identity}`}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                        title="Kick participant"
                      >
                        <UserX className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 text-center">
        <p className="text-[11px] text-zinc-500">
          Admin controls powered by LiveKit Server API & MongoDB Access Rules
        </p>
      </div>
    </div>
  )
}
