import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, JobCard } from '../services/api'
import { STATUS_STYLES as JOB_STATUS_STYLES, STATUS_LABELS as JOB_STATUS_LABELS } from './JobCardForm'
import {
  Users,
  Warehouse,
  Briefcase,
  BarChart3,
  Calculator,
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
  Bell,
  Activity,
  Star,
  PieChart,
  Megaphone,
  ArrowRight,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react'

function jobCardTotals(jc: JobCard) {
  const items = jc.items || []
  const subtotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const taxable = items.filter(i => i.taxable !== 0).reduce((sum, i) => sum + Number(i.amount || 0), 0)
  const vat = jc.vat_enabled ? taxable * (Number(jc.vat_rate) / 100) : 0
  const discount = Number(jc.discount || 0)
  const total = subtotal + vat - discount + Number(jc.other_charges || 0)
  const paid = Number(jc.amount_paid || 0)
  const due = total - paid
  return { total, paid, due }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${dd}-${mm}-${yy} ${time}`
}

interface ModuleTile {
  name: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  color: string
  bgColor: string
  badge?: string
  disabled?: boolean
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeJobCards, setActiveJobCards] = useState<JobCard[]>([])
  const [loadingJobCards, setLoadingJobCards] = useState(true)

  const fetchActiveJobCards = () => {
    setLoadingJobCards(true)
    adminApiService.getJobCards()
      .then(data => {
        const active = (Array.isArray(data) ? data : [])
          .filter(jc => !['paid', 'written_off', 'voided'].includes(jc.status))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        setActiveJobCards(active)
      })
      .catch(() => setActiveJobCards([]))
      .finally(() => setLoadingJobCards(false))
  }

  useEffect(() => { fetchActiveJobCards() }, [])

  const modules: ModuleTile[] = [
    { name: 'Clients', icon: Users, route: '/clients', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
    { name: 'Vehicles', icon: Car, route: '/vehicles', color: 'text-indigo-700', bgColor: 'bg-indigo-500', badge: undefined },
    { name: 'Parts', icon: Package, route: '/parts', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
    { name: 'Stores', icon: Store, route: '/stores', color: 'text-emerald-700', bgColor: 'bg-emerald-500', badge: undefined },
    { name: 'Inventory', icon: Warehouse, route: '/inventory', color: 'text-green-700', bgColor: 'bg-green-500', badge: undefined },
    { name: 'Employees', icon: UserCheck, route: '/employees', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Sales Report', icon: BarChart3, route: '/sales/report', color: 'text-pink-700', bgColor: 'bg-pink-500', badge: undefined },
    { name: 'Conversion', icon: Wrench, route: '/conversion', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Accounting', icon: Calculator, route: '/accounts', color: 'text-indigo-700', bgColor: 'bg-indigo-500', badge: undefined },
    { name: 'Payments', icon: CreditCard, route: '/sales/report', color: 'text-amber-700', bgColor: 'bg-amber-500', badge: undefined },
    { name: 'Inspection Checklist', icon: CheckCircle2, route: '/checklist-templates', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'Calendar', icon: CalendarIcon, route: '/calendar', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Notice Board', icon: Bell, route: '/notices', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
    { name: 'OBD Scanner', icon: Activity, route: '/dashboard', color: 'text-orange-700', bgColor: 'bg-orange-500', badge: undefined, disabled: true },
    { name: 'Labor Guides', icon: FileText, route: '/notices', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined },
    { name: 'HR', icon: Clock, route: '/staff', color: 'text-red-700', bgColor: 'bg-red-500', badge: undefined },
    { name: 'Financing', icon: PieChart, route: '/sales/report', color: 'text-purple-700', bgColor: 'bg-purple-500', badge: undefined, disabled: true },
    { name: 'Marketing', icon: Megaphone, route: '/dashboard', color: 'text-teal-700', bgColor: 'bg-teal-500', badge: undefined },
    { name: 'Reviews', icon: Star, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: 'NEW' },
    { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', color: 'text-blue-700', bgColor: 'bg-blue-500', badge: undefined },
  ]

  const handleModuleClick = (module: ModuleTile) => {
    if (module.disabled) return
    navigate(module.route)
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
                onClick={() => handleModuleClick(module)}
                title={module.disabled ? 'Coming soon' : undefined}
                className={`relative bg-white rounded-lg shadow transition-all duration-300 group overflow-hidden border-2 transform ${
                  module.disabled
                    ? 'opacity-50 grayscale cursor-not-allowed border-gray-200'
                    : `hover:shadow-xl cursor-pointer hover:-translate-y-1 border-${colorName}-200 hover:border-${colorName}-300`
                }`}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 ${module.bgColor} opacity-15 ${module.disabled ? '' : 'group-hover:opacity-25'} transition-opacity duration-300`}></div>

                {/* Content */}
                <div className="relative p-2 flex flex-col items-center justify-center min-h-[84px]">
                  {/* Badge */}
                  {module.disabled ? (
                    <div className="absolute top-1 right-1 bg-gray-400 text-white text-[6px] font-bold px-1 py-0.5 rounded-full shadow z-10">
                      SOON
                    </div>
                  ) : module.badge && (
                    <div className="absolute top-1 right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-10 animate-pulse">
                      {module.badge}
        </div>
                  )}

                  {/* Icon */}
                  <div className={`${module.bgColor} p-2 rounded-lg mb-1 ${module.disabled ? '' : 'group-hover:scale-110'} transition-transform duration-300 shadow-lg`}>
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

        {/* Active Job Cards */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                {activeJobCards.length > 0 && <span>[{activeJobCards.length}]</span>} Active Job Cards
              </h2>
              <button
                onClick={fetchActiveJobCards}
                disabled={loadingJobCards}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Refresh
                <RefreshCw className={`h-3 w-3 ${loadingJobCards ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/job-cards/new')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Plus className="h-3 w-3" />
                New Job Card
              </button>
              <button
                onClick={() => navigate('/job-cards')}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {loadingJobCards ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : activeJobCards.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No active job cards right now.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              {activeJobCards.slice(0, 8).map(jc => {
                const { total, paid, due } = jobCardTotals(jc)
                const isCreated = total === 0
                const progressPct = total > 0 ? Math.round((paid / total) * 100) : 0
                const vehicleText = jc.conversionVehicle
                  ? `${jc.conversionVehicle.year ?? ''} ${jc.conversionVehicle.make ?? ''} ${jc.conversionVehicle.model}`.replace(/\s+/g, ' ').trim()
                  : 'No vehicle'
                const money = (n: number) => `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`

                return (
                  <div
                    key={jc.id}
                    onClick={() => navigate(`/job-cards/${jc.id}`)}
                    className="relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                  >
                    {!isCreated && (
                      <span className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${JOB_STATUS_STYLES[jc.status] || 'bg-gray-100 text-gray-500'}`}>
                        {JOB_STATUS_LABELS[jc.status] || jc.status}
                      </span>
                    )}

                    <div className="flex items-start gap-3 pr-16">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isCreated ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                          {isCreated ? <Download className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        <span className={`text-[9px] font-bold ${isCreated ? 'text-blue-600' : 'text-amber-600'}`}>
                          {isCreated ? 'CREATED' : 'WIP'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {jc.conversionClient?.name || 'Unknown client'}
                        </h3>
                        <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1">
                          Invoice #{jc.id}
                        </span>
                        <div className="mt-1.5 space-y-0.5">
                          <p className="text-[11px] text-gray-400">{formatDateTime(jc.created_at)}</p>
                          {!isCreated && <p className="text-[11px] text-gray-400">{formatDateTime(jc.updated_at)}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                      <div className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                        <Car className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 truncate flex-1">
                        {vehicleText} <span className="text-blue-600 font-medium">| {jc.conversionVehicle?.registration_number ?? '—'}</span>
                      </p>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    </div>

                    <div className="flex items-center justify-between mt-3 text-[11px]">
                      <span className="text-gray-500">Total <span className="font-semibold text-gray-900">{money(total)}</span></span>
                      <span className="text-gray-500">Paid: <span className="font-semibold text-green-600">{money(paid)}</span></span>
                      <span className="text-gray-500">Due <span className="font-semibold text-red-600">{money(due)}</span></span>
                    </div>

                    {!isCreated && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] font-semibold text-gray-400 shrink-0">WIP</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">({progressPct}%)</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard


