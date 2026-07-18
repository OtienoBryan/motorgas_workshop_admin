import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInactivity } from '../hooks/useInactivity'
import Screensaver from './Screensaver'
import Sidebar from './Sidebar'
import {
  LogOut,
  Settings,
  LayoutDashboard
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [screensaverActive, setScreensaverActive] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  
  const isDashboard = location.pathname === '/dashboard'

  // Track inactivity - show screensaver after 20 minutes
  useInactivity({
    timeout: 20 * 60 * 1000, // 20 minutes
    onInactive: () => {
      console.log('Screensaver activated - user inactive')
      setScreensaverActive(true)
    },
    onActive: () => {
      console.log('Screensaver deactivated - user active')
      setScreensaverActive(false)
    }
  })

  const handleDismissScreensaver = () => {
    setScreensaverActive(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-10 flex-shrink-0 bg-white shadow">
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center gap-4">
              <h1 className="text-xl font-bold text-green-800">MotorGas Africa</h1>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isDashboard
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Link>
            </div>
            <div className="ml-3 flex items-center md:ml-4">
              <div className="relative ml-2">
                <div className="flex items-center space-x-3">
                  <div className="text-xs text-gray-600">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <button className="text-gray-400 hover:text-gray-500">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={logout}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-4">
            <div className="mx-auto w-full px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Screensaver */}
      <Screensaver isActive={screensaverActive} onDismiss={handleDismissScreensaver} />
    </div>
  )
}

export default Layout
