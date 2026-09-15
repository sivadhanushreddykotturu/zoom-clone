import re

with open('components/custom-control-bar.tsx', 'r') as f:
    content = f.read()

# Add Lock to imports
content = content.replace("import { Mic, MicOff, Video, VideoOff, Hand } from 'lucide-react'", "import { Mic, MicOff, Video, VideoOff, Hand, Lock } from 'lucide-react'")

old_ui = """      ) : (
        <button
          onClick={handleRequestUnmute}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-rose-400 transition"
          title="Request to Speak (Raise Hand)"
        >
          {requesting ? <Hand className="size-5 mb-1 animate-bounce text-amber-400" /> : <MicOff className="size-5 mb-1" />}
          <span className="text-[10px] font-medium">{requesting ? 'Requested' : 'Unmute'}</span>
        </button>
      )}"""

new_ui = """      ) : (
        <>
          <div className="flex flex-col items-center justify-center p-3 px-4 rounded-xl bg-zinc-800/50 text-zinc-500 cursor-not-allowed" title="Microphone is locked by the host">
            <div className="relative">
              <MicOff className="size-5 mb-1 opacity-50" />
              <Lock className="size-3 absolute -top-1 -right-2 text-rose-500" />
            </div>
            <span className="text-[10px] font-medium">Locked</span>
          </div>
          <button
            onClick={handleRequestUnmute}
            className={lex flex-col items-center justify-center p-3 px-5 rounded-xl transition border }
            title="Request to Speak (Raise Hand)"
          >
            {requesting ? (
              <Hand className="size-5 mb-1 animate-bounce" />
            ) : (
              <Hand className="size-5 mb-1" />
            )}
            <span className="text-[10px] font-medium">{requesting ? 'Requested' : 'Raise Hand'}</span>
          </button>
        </>
      )}"""

content = content.replace(old_ui, new_ui)

with open('components/custom-control-bar.tsx', 'w') as f:
    f.write(content)
print("Updated control bar ui")
