import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Users,
  Car,
  Warehouse,
  Calculator,
  ClipboardList,
  CalendarClock,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react'

interface NavItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  route: string
}

const navItems: NavItem[] = [
  { name: 'Home', icon: Home, route: '/dashboard' },
  { name: 'Clients', icon: Users, route: '/clients' },
  { name: 'Vehicles', icon: Car, route: '/vehicles' },
  { name: 'Inventory', icon: Warehouse, route: '/inventory' },
  { name: 'Vendors', icon: Truck, route: '/vendors' },
  { name: 'Accounting', icon: Calculator, route: '/accounts' },
  { name: 'JobCards', icon: ClipboardList, route: '/job-cards' },
  { name: 'Appointments', icon: CalendarClock, route: '/calendar' },
]

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div
      className={`flex-shrink-0 bg-[#0b0f24] text-white h-screen sticky top-0 overflow-y-auto no-scrollbar transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-28'
      }`}
    >
      <div className="flex flex-col min-h-full">
        {/* Header / collapse toggle */}
        <div className="flex items-center justify-between px-3 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {!collapsed && <span>Shortcuts</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.route
            return (
              <Link
                key={item.name}
                to={item.route}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-colors ${
                  isActive ? 'bg-indigo-600/90 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title={item.name}
              >
                <Icon className="h-5 w-5" />
                {!collapsed && <span className="text-[10px] font-medium text-center leading-none">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer items */}
        <div className="px-2 pb-4 pt-2 space-y-1 border-t border-white/10">
          <Link
            to="/notices"
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 transition-colors ${
              location.pathname === '/notices' ? 'bg-indigo-600/90 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {!collapsed && <span className="text-[10px] font-medium text-center leading-none">Notices</span>}
          </Link>
          <button
            className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            title="Shortcuts settings"
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span className="text-[10px] font-medium text-center leading-none">Settings</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
