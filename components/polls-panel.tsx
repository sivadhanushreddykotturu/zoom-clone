'use client'

import { useState } from 'react'
import { Plus, X, BarChart3, Users, Award, CheckCircle2, Lock, ArrowRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface IVote {
  voterEmail: string
  optionIndex: number
}

export interface IPoll {
  pollId: string
  question: string
  options: string[]
  votes: IVote[]
  status: 'active' | 'ended'
  createdAt: Date
}

interface PollsPanelProps {
  meetingId: string
  isModerator: boolean
  currentUserEmail: string
  polls: IPoll[]
  onVoteSubmitted: (pollId: string, optionIndex: number) => void
  onPollCreated: (poll: IPoll) => void
  onPollClosed: (pollId: string) => void
  onClose: () => void
}

export function PollsPanel({
  meetingId,
  isModerator,
  currentUserEmail,
  polls,
  onVoteSubmitted,
  onPollCreated,
  onPollClosed,
  onClose,
}: PollsPanelProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track selected choices locally before submitting
  const [localSelections, setLocalSelections] = useState<{ [pollId: string]: number }>({})
  const [editingVotes, setEditingVotes] = useState<{ [pollId: string]: boolean }>({})

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options]
    next[index] = val
    setOptions(next)
  }

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanQuestion = question.trim()
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean)

    if (!cleanQuestion) {
      setError('Poll question is required.')
      return
    }
    if (cleanOptions.length < 2) {
      setError('At least 2 options are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/meetings/${meetingId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: cleanQuestion, options: cleanOptions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to launch poll')

      onPollCreated(data.poll)
      setQuestion('')
      setOptions(['', ''])
      setShowCreateForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (pollId: string) => {
    const optionIndex = localSelections[pollId]
    if (optionIndex === undefined) return

    try {
      const res = await fetch(`/api/meetings/${meetingId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onVoteSubmitted(pollId, optionIndex)
      setEditingVotes((prev) => ({ ...prev, [pollId]: false }))
    } catch (err) {
      console.error('Error submitting vote:', err)
    }
  }

  const handleClosePoll = async (pollId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, closePoll: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      onPollClosed(pollId)
    } catch (err) {
      console.error('Error closing poll:', err)
    }
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-indigo-400" />
          <h3 className="font-bold text-white text-sm">Live Polls</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isModerator && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-indigo-600/10"
          >
            <Plus className="size-4" />
            <span>Create New Poll</span>
          </button>
        )}

        {showCreateForm ? (
          <form onSubmit={handleCreatePoll} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">New Poll</span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Question</label>
              <textarea
                rows={2}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is your favorite framework?"
                className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">Options</label>
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="size-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 py-2.5 text-xs font-bold text-black transition"
            >
              <span>{loading ? 'Launching...' : 'Launch Poll'}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
        ) : null}

        {/* Polls List */}
        <div className="space-y-4">
          {polls.length === 0 ? (
            <div className="text-center py-8 text-zinc-650">
              <BarChart3 className="mx-auto size-7 mb-2 text-zinc-700" />
              <p className="text-xs font-medium">No polls launched yet.</p>
            </div>
          ) : (
            polls.map((poll) => {
              const userVote = poll.votes.find((v) => v.voterEmail.toLowerCase() === currentUserEmail.toLowerCase())
              const hasVoted = !!userVote
              const showResults = hasVoted || poll.status === 'ended'
              const isEditing = editingVotes[poll.pollId]

              // Calculate vote breakdown
              const totalVotes = poll.votes.length
              const votesPerOption = poll.options.map((_, optIdx) => 
                poll.votes.filter((v) => v.optionIndex === optIdx).length
              )

              return (
                <div
                  key={poll.pollId}
                  className={cn(
                    "rounded-xl border p-4 space-y-3.5 bg-zinc-900/25",
                    poll.status === 'active' ? "border-zinc-800" : "border-zinc-900 opacity-80"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                      poll.status === 'active'
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-zinc-850 border-zinc-750 text-zinc-400"
                    )}>
                      {poll.status === 'active' ? 'Active' : 'Ended'}
                    </span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                      <Users className="size-3" />
                      <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white leading-relaxed">{poll.question}</h4>

                  {showResults && !isEditing ? (
                    /* Show voting stats / progress bars */
                    <div className="space-y-2.5">
                      {poll.options.map((opt, optIdx) => {
                        const optVotes = votesPerOption[optIdx]
                        const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0
                        const isUserChoice = userVote?.optionIndex === optIdx

                        return (
                          <div key={optIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className={cn(
                                "truncate flex items-center gap-1.5",
                                isUserChoice ? "text-indigo-400 font-bold" : "text-zinc-300"
                              )}>
                                {opt}
                                {isUserChoice && <Award className="size-3 text-indigo-400 shrink-0" />}
                              </span>
                              <span className="text-zinc-400">{percent}% ({optVotes})</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/40">
                              <div
                                style={{ width: `${percent}%` }}
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  isUserChoice ? "bg-indigo-600" : "bg-zinc-700"
                                )}
                              />
                            </div>
                          </div>
                        )
                      })}

                      {poll.status === 'active' && (
                        <button
                          onClick={() => {
                            setLocalSelections((prev) => ({ ...prev, [poll.pollId]: userVote?.optionIndex ?? 0 }))
                            setEditingVotes((prev) => ({ ...prev, [poll.pollId]: true }))
                          }}
                          className="w-full text-center text-[10px] font-bold text-zinc-400 hover:text-white pt-2.5 hover:underline"
                        >
                          Change Vote
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Show voting options (Radio interface) */
                    <div className="space-y-2">
                      {poll.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          onClick={() => setLocalSelections((prev) => ({ ...prev, [poll.pollId]: optIdx }))}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-xs text-left transition",
                            localSelections[poll.pollId] === optIdx
                              ? "border-indigo-500/60 bg-indigo-600/10 text-indigo-300"
                              : "border-zinc-850 bg-black text-zinc-400 hover:border-zinc-750 hover:text-white"
                          )}
                        >
                          <span className={cn(
                            "size-3.5 rounded-full border flex items-center justify-center shrink-0",
                            localSelections[poll.pollId] === optIdx
                              ? "border-indigo-500 text-indigo-400"
                              : "border-zinc-700"
                          )}>
                            {localSelections[poll.pollId] === optIdx && (
                              <span className="size-1.5 rounded-full bg-indigo-400" />
                            )}
                          </span>
                          <span className="truncate">{opt}</span>
                        </button>
                      ))}

                      <div className="flex gap-2 pt-2">
                        {isEditing && (
                          <button
                            onClick={() => setEditingVotes((prev) => ({ ...prev, [poll.pollId]: false }))}
                            className="flex-1 text-center py-2 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleVote(poll.pollId)}
                          disabled={localSelections[poll.pollId] === undefined}
                          className="flex-1 text-center py-2 text-xs font-bold rounded-lg bg-white text-black hover:bg-zinc-200 disabled:opacity-50 transition"
                        >
                          Submit Vote
                        </button>
                      </div>
                    </div>
                  )}

                  {isModerator && poll.status === 'active' && (
                    <button
                      onClick={() => handleClosePoll(poll.pollId)}
                      className="w-full flex items-center justify-center gap-1 border border-red-950 bg-red-950/20 hover:bg-red-950/40 rounded-lg py-1.5 text-[10px] font-bold text-red-400 transition mt-2"
                    >
                      <Lock className="size-3" />
                      <span>End Poll</span>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
