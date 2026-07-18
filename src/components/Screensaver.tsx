import { useEffect, useState } from 'react'

interface ScreensaverProps {
  isActive: boolean
  onDismiss: () => void
}

const Screensaver: React.FC<ScreensaverProps> = ({ isActive, onDismiss }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const time = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const seconds = currentTime.toLocaleTimeString([], { second: '2-digit' }).padStart(2, '0')
  const date = currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      onClick={onDismiss}
      onKeyDown={() => onDismiss()}
      tabIndex={0}
      style={{ backgroundColor: '#0b0f24' }}
    >
      <style>{`
        @keyframes ss-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ss-rise {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ss-drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.15); }
        }
        @keyframes ss-drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, 30px) scale(1.1); }
        }
        @keyframes ss-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes ss-hint {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
      `}</style>

      {/* Soft brand-green glow orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: '55vw', height: '55vw',
          top: '-20vw', right: '-15vw',
          background: 'radial-gradient(circle, rgba(37,190,3,0.14) 0%, transparent 65%)',
          animation: 'ss-drift1 26s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '45vw', height: '45vw',
          bottom: '-18vw', left: '-12vw',
          background: 'radial-gradient(circle, rgba(42,170,138,0.12) 0%, transparent 65%)',
          animation: 'ss-drift2 32s ease-in-out infinite',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-white px-6" style={{ animation: 'ss-fadeIn 0.9s ease-out both' }}>

        {/* Logo */}
        <div className="mb-8" style={{ animation: 'ss-rise 0.9s ease-out 0.1s both' }}>
          <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl" style={{ boxShadow: '0 0 80px rgba(37,190,3,0.25), 0 25px 50px rgba(0,0,0,0.5)' }}>
            <img src="/motor.jpeg" alt="MotorGas Africa" className="h-20 w-auto object-contain" />
          </div>
        </div>

        {/* Company name */}
        <h1 className="text-3xl font-bold tracking-[0.3em] uppercase mb-1" style={{ animation: 'ss-rise 0.9s ease-out 0.2s both' }}>
          MotorGas <span className="text-green-400">Africa</span>
        </h1>
        <p className="text-sm text-white/40 tracking-[0.2em] uppercase mb-10" style={{ animation: 'ss-rise 0.9s ease-out 0.3s both' }}>
          Transforming Mobility in Africa
        </p>

        {/* Clock */}
        <div className="flex items-baseline gap-3 mb-2" style={{ animation: 'ss-rise 0.9s ease-out 0.4s both' }}>
          <span className="text-[7rem] leading-none font-extralight tabular-nums tracking-tight">
            {time}
          </span>
          <span className="text-3xl font-light text-green-400 tabular-nums" style={{ animation: 'ss-blink 2s ease-in-out infinite' }}>
            {seconds}
          </span>
        </div>

        {/* Date */}
        <p className="text-lg font-light text-white/60 mb-14" style={{ animation: 'ss-rise 0.9s ease-out 0.5s both' }}>
          {date}
        </p>

        {/* Dismiss hint */}
        <div
          className="flex items-center gap-2 text-xs text-white/50 tracking-widest uppercase border border-white/15 rounded-full px-5 py-2.5"
          style={{ animation: 'ss-hint 2.6s ease-in-out infinite, ss-rise 0.9s ease-out 0.6s both' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
          Click anywhere to continue
        </div>
      </div>
    </div>
  )
}

export default Screensaver
