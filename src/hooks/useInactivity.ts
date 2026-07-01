import { useEffect, useRef } from 'react'

interface UseInactivityOptions {
  timeout: number // in milliseconds
  onInactive?: () => void
  onActive?: () => void
}

export const useInactivity = ({ timeout, onInactive, onActive }: UseInactivityOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isInactiveRef = useRef(false)
  const onInactiveRef = useRef(onInactive)
  const onActiveRef = useRef(onActive)

  // Update refs when callbacks change
  useEffect(() => {
    onInactiveRef.current = onInactive
    onActiveRef.current = onActive
  }, [onInactive, onActive])

  useEffect(() => {
    const resetTimer = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // If currently inactive, mark as active and call callback
      if (isInactiveRef.current) {
        isInactiveRef.current = false
        onActiveRef.current?.()
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        isInactiveRef.current = true
        onInactiveRef.current?.()
      }, timeout)
    }

    // Events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
      'wheel'
    ]

    // Set initial timer
    resetTimer()

    // Add event listeners with passive option for better performance
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true, capture: true })
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, { capture: true } as EventListenerOptions)
      })
    }
  }, [timeout])
}

