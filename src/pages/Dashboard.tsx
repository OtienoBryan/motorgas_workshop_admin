import { useNavigate } from 'react-router-dom'
import {
  Users,
  Warehouse,
  Briefcase,
  BarChart3,
  Wrench,
  FileText,
  DollarSign,
  Calendar as CalendarIcon,
  MessageCircle,
  LayoutDashboard,
  Car,
  Package,
  Store,
  UserCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  Bell,
  Activity,
  Star,
  PieChart,
  Megaphone
} from 'lucide-react'

interface ModuleTile {
  name: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  color: string
  bgColor: string
  badge?: string
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const modules: ModuleTile[] = [
    { name: 'Clients', icon: Users, route: '/clients', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
    { name: 'Vehicles', icon: Car, route: '/vehicles', color: 'text-indigo-700', bgColor: 'bg-indigo-500', badge: undefined },
    { name: 'Parts', icon: Package, route: '/parts', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
    { name: 'Stores', icon: Store, route: '/stores', color: 'text-emerald-700', bgColor: 'bg-emerald-500', badge: undefined },
    { name: 'Inventory', icon: Warehouse, route: '/inventory', color: 'text-green-700', bgColor: 'bg-green-500', badge: undefined },
    { name: 'Employees', icon: UserCheck, route: '/employees', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Sales Report', icon: BarChart3, route: '/sales/report', color: 'text-pink-700', bgColor: 'bg-pink-500', badge: undefined },
    { name: 'Conversion', icon: Wrench, route: '/conversion', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Post Sale', icon: Receipt, route: '/sales/post', color: 'text-orange-700', bgColor: 'bg-orange-500', badge: undefined },
    { name: 'Payments', icon: CreditCard, route: '/sales/report', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
    { name: 'Inspections', icon: CheckCircle2, route: '/conversion', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Calendar', icon: CalendarIcon, route: '/calendar', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Notice Board', icon: Bell, route: '/notices', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
    { name: 'OBD Scanner', icon: Activity, route: '/dashboard', color: 'text-orange-700', bgColor: 'bg-orange-500', badge: undefined },
    { name: 'Diagnose', icon: Wrench, route: '/conversion', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Labor Guides', icon: FileText, route: '/notices', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Time Tracking', icon: Clock, route: '/dashboard', color: 'text-red-700', bgColor: 'bg-red-500', badge: undefined },
    { name: 'Financing', icon: PieChart, route: '/sales/report', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Marketing', icon: Megaphone, route: '/dashboard', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Reviews', icon: Star, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: 'NEW' },
    { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
    { name: 'Reports', icon: BarChart3, route: '/sales/report', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
  ]

  const handleModuleClick = (route: string) => {
    navigate(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 -m-4 p-6">
      <div className="space-y-6 w-full">
         
        {/* Navigation Pills */}
        <div className="flex items-center gap-2 flex-wrap bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm">
          <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
            All
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm">
            Work
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm">
            Track
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm">
            Report
          </button>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm">
            Custom
          </button>
          <div className="flex-1"></div>
          <button className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </button>
          <button 
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-white text-gray-700 rounded-full text-xs font-medium hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 shadow-sm flex items-center gap-1.5"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Portal Chats
          </button>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {modules.map((module, index) => {
            const Icon = module.icon
            // Extract color name from bgColor (e.g., 'bg-blue-500' -> 'blue')
            const colorName = module.bgColor.split('-')[1]
            return (
              <div
                key={index}
                onClick={() => handleModuleClick(module.route)}
                className={`relative bg-white rounded-lg shadow hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-2 border-${colorName}-200 hover:border-${colorName}-300 transform hover:-translate-y-1`}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 ${module.bgColor} opacity-15 group-hover:opacity-25 transition-opacity duration-300`}></div>

                {/* Content */}
                <div className="relative p-2 flex flex-col items-center justify-center min-h-[84px]">
                  {/* Badge */}
                  {module.badge && (
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                      {module.badge}
        </div>
                  )}

                  {/* Icon */}
                  <div className={`${module.bgColor} p-2 rounded-lg mb-1 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
          </div>

                  {/* Name */}
                  <h3 className="text-[9px] font-bold text-gray-900 text-center group-hover:text-gray-900 leading-tight">
                    {module.name}
                  </h3>
            </div>
          </div>
            )
          })}
      </div>
      </div>
    </div>
  )
}

export default Dashboard


