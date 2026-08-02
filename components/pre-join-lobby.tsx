'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, VideoOff, Settings, Sparkles, Volume2, ArrowRight } from 'lucide-react'

interface PreJoinLobbyProps {
  meetingTitle: string
  userName: string
  onJoin: (settings: { isMuted: boolean; audioDeviceId: string }) => void
}

export function PreJoinLobby({ meetingTitle, userName, onJoin }: PreJoinLobbyProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState<string>('')
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Enumerate available microphones
  useEffect(() => {
    async function getDevices() {
      try {
        // Request temporary mic permission to enumerate labels properly
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        tempStream.getTracks().forEach(t => t.stop())

        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const mics = allDevices.filter(d => d.kind === 'audioinput')
        setDevices(mics)
        if (mics.length > 0) {
          setSelectedMic(mics[0].deviceId)
        }
      } catch (err: any) {
        console.error('Error listing devices:', err)
        setPermissionError('Microphone access is required to join this meeting room.')
      }
    }
    getDevices()
  }, [])

  // Manage Web Audio API analysis for volume meter
  useEffect(() => {
    if (isMuted || !selectedMic || permissionError) {
      setVolume(0)
      stopAudioAnalysis()
      return
    }

    async function startAudioAnalysis() {
      try {
        stopAudioAnalysis()

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedMic } }
        })
        streamRef.current = stream

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioContextClass()
        audioContextRef.current = audioCtx

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser

        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        function drawVolume() {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const average = sum / bufferLength
          // Normalize volume levels from average values (approx. 0-100 scale)
          setVolume(Math.min(100, Math.round(average * 2.5)))
          animationFrameRef.current = requestAnimationFrame(drawVolume)
        }

        drawVolume()
      } catch (err) {
        console.error('Volume analysis error:', err)
      }
    }

    startAudioAnalysis()

    return () => {
      stopAudioAnalysis()
    }
  }, [selectedMic, isMuted, permissionError])

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }

  const handleJoinClick = () => {
    stopAudioAnalysis()
    onJoin({
      isMuted,
      audioDeviceId: selectedMic
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-4 py-8 text-zinc-100">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
            <Sparkles className="size-3.5" />
            <span>Pre-Join Lobby</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {meetingTitle || 'Secure Meeting Room'}
          </h2>
          <p className="text-xs text-zinc-400">
            Configure your audio settings before entering as <span className="text-zinc-200 font-bold">{userName}</span>
          </p>
        </div>

        {/* Video Placeholder & Coming Soon Badge */}
        <div className="relative aspect-video rounded-xl border border-zinc-800 bg-black flex flex-col items-center justify-center p-6 text-center space-y-3 overflow-hidden shadow-inner">
          <div className="flex size-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
            <VideoOff className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Audio-Only Call</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Camera feeds are disabled for this session. Video support will be enabled in a future release!
            </p>
          </div>
        </div>

        {/* Microphone Setup Control Box */}
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
          {permissionError ? (
            <p className="text-xs text-amber-400 font-medium text-center">{permissionError}</p>
          ) : (
            <div className="space-y-4">
              {/* Mic Input Dropdown Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Settings className="size-3.5" />
                  <span>Choose Microphone</span>
                </label>
                <select
                  value={selectedMic}
                  onChange={(e) => setSelectedMic(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-black px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  {devices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Volume Level Meter & Mic Toggle Button */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex size-12 items-center justify-center rounded-xl border transition ${
                    isMuted
                      ? 'border-red-500 bg-red-950/30 text-red-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-850'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-zinc-550">
                    <span className="flex items-center gap-1">
                      <Volume2 className="size-3" />
                      <span>Mic Input Level</span>
                    </span>
                    <span>{isMuted ? 'Muted' : volume > 0 ? 'Active' : 'Silent'}</span>
                  </div>
                  {/* Dynamic Level Indicator Bar */}
                  <div className="h-2 w-full rounded-full bg-black overflow-hidden border border-zinc-850 relative">
                    <div
                      style={{ width: `${isMuted ? 0 : volume}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-75"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Join button */}
        <button
          onClick={handleJoinClick}
          disabled={!!permissionError && !isMuted}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 py-3.5 font-bold text-black shadow-lg shadow-white/5 transition disabled:opacity-50"
        >
          <span>Join Meeting Room</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
