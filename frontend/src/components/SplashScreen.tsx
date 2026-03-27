import { useEffect, useState } from 'react'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1500)
    const doneTimer = setTimeout(() => onComplete(), 2050)
    return () => {
      clearTimeout(exitTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center select-none"
      style={exiting ? { animation: 'splashExit 0.5s ease-in forwards' } : undefined}
    >
      {/* Logo — scales up and fades in */}
      <img
        src="/Kampeni_Logo_transparent.png"
        alt="Kampeni"
        className="h-16 w-auto"
        draggable={false}
        style={{ animation: 'splashLogo 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      />

      {/* Scan line — draws left-to-right */}
      <div className="mt-8 w-44 h-px bg-gray-100 overflow-hidden">
        <div
          className="h-full w-full bg-[#2e6417]"
          style={{
            transformOrigin: 'left',
            animation: 'splashScan 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both',
          }}
        />
      </div>

      {/* Tagline */}
      <p
        className="mt-4 text-[10px] tracking-[0.38em] text-gray-400 uppercase"
        style={{ animation: 'splashTagline 0.4s ease-out 0.95s both' }}
      >
        Akili ya Siasa
      </p>
    </div>
  )
}
