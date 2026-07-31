export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-xs text-zinc-500 flex flex-wrap items-center justify-center gap-2 select-none">
      <span>Made by <span className="text-zinc-300 font-medium">Siva Dhanush</span></span>
      <span className="text-zinc-700 font-mono">•</span>
      <a
        href="https://www.linkedin.com/in/kotturu-siva-dhanush-646b51322"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        title="LinkedIn Profile"
      >
        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94Z"/>
        </svg>
        <span>LinkedIn</span>
      </a>
      <span className="text-zinc-700 font-mono">•</span>
      <a
        href="https://github.com/sivadhanushreddykotturu"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
        title="GitHub Profile"
      >
        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>
        </svg>
        <span>GitHub</span>
      </a>
    </footer>
  )
}
