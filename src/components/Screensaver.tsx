import { useEffect, useState } from 'react'

interface ScreensaverProps {
  isActive: boolean
  onDismiss: () => void
}

const Screensaver: React.FC<ScreensaverProps> = ({ isActive, onDismiss }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    console.log('Screensaver isActive changed:', isActive)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return

    console.log('Screensaver activated, starting clock')
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      console.log('Screensaver deactivated, stopping clock')
      clearInterval(interval)
    }
  }, [isActive])

  if (!isActive) {
    console.log('Screensaver not active, returning null')
    return null
  }

  console.log('Rendering screensaver')

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          onDismiss()
        }
      }}
      tabIndex={0}
      style={{
        background: 'linear-gradient(135deg, #2AAA8A 0%,rgb(19, 87, 4) 50%, #2AAA8A 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 8s ease infinite'
      }}
    >
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-10px) translateX(5px) rotate(1deg); }
          50% { transform: translateY(-15px) translateX(0px) rotate(0deg); }
          75% { transform: translateY(-10px) translateX(-5px) rotate(-1deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-3px) translateX(2px); }
          50% { transform: translateY(-5px) translateX(0px); }
          75% { transform: translateY(-3px) translateX(-2px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(255, 255, 255, 0.3); }
          50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(255, 255, 255, 0.5); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        .animate-slideInUp {
          animation: slideInUp 1s ease-out 0.3s both;
        }
        .animate-slideInDown {
          animation: slideInDown 1s ease-out 0.5s both;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatSlow ${Math.random() * 60 + 120}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="text-center text-white relative z-10 animate-fadeIn">
        {/* Logo with enhanced animation */}
        <div className="mb-8 animate-float">
          <div className="relative inline-block">
            <div
              className="absolute inset-0 rounded-lg blur-xl opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                animation: 'pulse 3s ease-in-out infinite'
              }}
            />
            <img
              src="/motor.jpeg"
              alt="MotorGas Logo"
              className="h-32 w-auto mx-auto rounded-lg shadow-2xl relative z-10 p-4 bg-white"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
                animation: 'float 4s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* Company Name with glow effect */}
        <h1 
          className="text-5xl font-bold mb-4 animate-glow" 
          style={{ 
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 50%, #ffffff 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'shimmer 3s linear infinite, glow 2s ease-in-out infinite'
          }}
        >
          MotorGas Technologies
        </h1>

        {/* Time with slide in animation */}
        <div 
          className="text-5xl font-light mb-2 animate-slideInUp" 
          style={{ 
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            fontFamily: 'monospace',
            letterSpacing: '0.1em'
          }}
        >
          {formatTime(currentTime)}
        </div>

        {/* Date with slide in animation */}
        <div 
          className="text-2xl font-light mb-8 animate-slideInDown" 
          style={{ 
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            opacity: 0.9
          }}
        >
          {formatDate(currentTime)}
        </div>

        {/* Instruction with pulse animation */}
        <div 
          className="text-4xl font-light animate-pulse-slow opacity-80" 
          style={{ 
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            animation: 'pulse 2s ease-in-out infinite, slideInUp 1s ease-out 0.7s both'
          }}
        >
          Transforming Mobility in Africa
        </div>
      </div>
    </div>
  )
}

export default Screensaver

