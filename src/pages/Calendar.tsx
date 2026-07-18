import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Conversion, Appointment, ConversionClient, ConversionVehicle } from '../services/api'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, User, Car, MapPin, FileText, Trash2, Loader2, Pencil } from 'lucide-react'

const APPOINTMENT_TYPES = ['Inspection', 'Conversion', 'Repair', 'Service', 'Meeting']

// Solid colors for appointment identification, assigned consistently by appointment title/type
const TYPE_COLORS: Record<string, string> = {
  Inspection: 'bg-purple-500',
  Conversion: 'bg-indigo-500',
  Repair: 'bg-red-500',
  Service: 'bg-teal-500',
  Meeting: 'bg-amber-500',
}
const DEFAULT_APPOINTMENT_COLOR = 'bg-gray-500'
const getAppointmentColor = (title: string) => TYPE_COLORS[title] ?? DEFAULT_APPOINTMENT_COLOR

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const dateKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const startOfWeek = (d: Date) => {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}
const getMonthGridDates = (month: number, year: number) => {
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const gridStart = startOfWeek(firstOfMonth)
  const gridEnd = addDays(startOfWeek(lastOfMonth), 6)
  const dates: Date[] = []
  for (let cur = gridStart; cur <= gridEnd; cur = addDays(cur, 1)) {
    dates.push(cur)
  }
  return dates
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
const pad2 = (n: number) => String(n).padStart(2, '0')
const toDateInput = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }
const toTimeInput = (iso: string) => { const d = new Date(iso); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}` }
const vehicleLabel = (v?: ConversionVehicle) => v ? `${v.year ?? ''} ${v.make ?? ''} ${v.model}`.replace(/\s+/g, ' ').trim() : ''
const apptLabel = (appt: Appointment) => {
  const time = formatTime(appt.appointment_date)
  if (appt.conversionClient) {
    const veh = appt.conversionVehicle ? ` - ${vehicleLabel(appt.conversionVehicle)}` : ''
    return `${time} ${appt.conversionClient.name.toUpperCase()}${veh}`
  }
  return `${time} ${appt.title}`
}

type ViewMode = 'day' | 'week' | 'month'

const Calendar: React.FC = () => {
  const navigate = useNavigate()
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [conversionsLoading, setConversionsLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [focusDate, setFocusDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addDefaultDate, setAddDefaultDate] = useState<string | null>(null)
  const [dayPanelDate, setDayPanelDate] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [editAppointment, setEditAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchConversions()
    fetchAppointments()
  }, [])

  const fetchConversions = async () => {
    try {
      setConversionsLoading(true)
      const data = await adminApiService.getConversions()
      setConversions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch conversions:', error)
      setConversions([])
    } finally {
      setConversionsLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const data = await adminApiService.getAppointments()
      setAppointments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      setAppointments([])
    }
  }

  const goToday = () => setFocusDate(new Date())
  const goPrev = () => setFocusDate(d => {
    if (viewMode === 'month') return new Date(d.getFullYear(), d.getMonth() - 1, 1)
    if (viewMode === 'week') return addDays(d, -7)
    return addDays(d, -1)
  })
  const goNext = () => setFocusDate(d => {
    if (viewMode === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1)
    if (viewMode === 'week') return addDays(d, 7)
    return addDays(d, 1)
  })

  // Group conversions by scheduled date
  const getConversionsByDate = () => {
    const conversionsByDate: { [key: string]: Conversion[] } = {}

    conversions.forEach(conversion => {
      if (conversion.scheduledDate) {
        try {
          const dateKey = dateKeyOf(new Date(conversion.scheduledDate))
          if (!conversionsByDate[dateKey]) {
            conversionsByDate[dateKey] = []
          }
          conversionsByDate[dateKey].push(conversion)
        } catch (error) {
          console.error('Error parsing scheduled date:', conversion.scheduledDate, error)
        }
      }
    })

    return conversionsByDate
  }

  const getAppointmentsByDate = () => {
    const byDate: { [key: string]: Appointment[] } = {}

    appointments.forEach(appt => {
      try {
        const dateKey = dateKeyOf(new Date(appt.appointment_date))
        if (!byDate[dateKey]) byDate[dateKey] = []
        byDate[dateKey].push(appt)
      } catch (error) {
        console.error('Error parsing appointment date:', appt.appointment_date, error)
      }
    })

    return byDate
  }

  const conversionsByDate = getConversionsByDate()
  const appointmentsByDate = getAppointmentsByDate()

  const headerLabel = (() => {
    if (viewMode === 'month') return `${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()}`
    if (viewMode === 'day') return focusDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const weekStart = startOfWeek(focusDate)
    const weekEnd = addDays(weekStart, 6)
    const startLabel = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const endLabel = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return `${startLabel} - ${endLabel}, ${weekEnd.getFullYear()}`
  })()

  const handleDayClick = (dateKey: string, dayAppointments: Appointment[], dayConversions: Conversion[]) => {
    if (dayAppointments.length > 0) {
      setDayPanelDate(dateKey)
    } else if (dayConversions.length > 0) {
      navigate(`/conversion?date=${dateKey}`)
    }
  }

  const renderCell = (date: Date, isCurrentPeriod: boolean, maxItems = 3) => {
    const dateKey = dateKeyOf(date)
    const dayConversions = conversionsByDate[dateKey] || []
    const dayAppointments = (appointmentsByDate[dateKey] || []).slice().sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
    const isToday = dateKey === dateKeyOf(new Date())
    const hasAnything = dayConversions.length > 0 || dayAppointments.length > 0

    return (
      <div
        key={dateKey}
        onClick={() => handleDayClick(dateKey, dayAppointments, dayConversions)}
        className={`
          group relative border-r border-b border-gray-100 p-2 flex flex-col gap-1 transition-colors
          ${isToday ? 'bg-blue-50/60' : !isCurrentPeriod ? 'bg-gray-50/50' : 'bg-white'}
          ${hasAnything ? 'hover:bg-gray-50 cursor-pointer' : ''}
        `}
      >
        <div className="flex items-start justify-between">
          <span className={`text-xs font-semibold ${!isCurrentPeriod ? 'text-gray-300' : isToday ? 'text-blue-600' : 'text-gray-600'}`}>
            {String(date.getDate()).padStart(2, '0')}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setAddDefaultDate(dateKey); setIsAddOpen(true) }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-green-600 transition-opacity"
            title="Add appointment"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-hidden">
          {dayConversions.length > 0 && (
            <div className="bg-blue-600 text-white text-[10px] font-semibold rounded px-1.5 py-1 truncate">
              {dayConversions.length} conversion{dayConversions.length === 1 ? '' : 's'}
            </div>
          )}
          {dayAppointments.slice(0, maxItems).map(appt => (
            <div
              key={appt.id}
              title={apptLabel(appt)}
              onClick={e => { e.stopPropagation(); setSelectedAppointment(appt) }}
              className={`${getAppointmentColor(appt.title)} text-white text-[10px] font-semibold rounded px-1.5 py-1 truncate flex items-center gap-1 cursor-pointer hover:brightness-110`}
            >
              <span className="opacity-70">•</span>
              <span className="truncate">{apptLabel(appt)}</span>
            </div>
          ))}
          {dayAppointments.length > maxItems && (
            <div className="text-[10px] text-gray-400 font-semibold px-1.5">
              +{dayAppointments.length - maxItems} more
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const gridDates = getMonthGridDates(focusDate.getMonth(), focusDate.getFullYear())
    const rows = gridDates.length / 7

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" style={{ gridTemplateRows: `repeat(${rows}, minmax(110px, 1fr))` }}>
          {gridDates.map(date => renderCell(date, date.getMonth() === focusDate.getMonth()))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(focusDate)
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" style={{ gridTemplateRows: 'minmax(480px, 1fr)' }}>
          {weekDates.map(date => renderCell(date, true, 12))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dateKey = dateKeyOf(focusDate)
    const dayConversions = conversionsByDate[dateKey] || []
    const dayAppointments = (appointmentsByDate[dateKey] || []).slice().sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[480px]">
        {dayConversions.length > 0 && (
          <button
            onClick={() => navigate(`/conversion?date=${dateKey}`)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors mb-4"
          >
            <span>{dayConversions.length} conversion{dayConversions.length === 1 ? '' : 's'} scheduled</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {dayAppointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">No appointments on this day.</p>
        ) : (
          <div className="space-y-2">
            {dayAppointments.map(appt => (
              <div
                key={appt.id}
                onClick={() => setSelectedAppointment(appt)}
                className="flex items-center gap-3 border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className={`${getAppointmentColor(appt.title)} h-2.5 w-2.5 rounded-full shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{appt.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {formatTime(appt.appointment_date)}
                    {appt.conversionClient && <> · {appt.conversionClient.name}</>}
                    {appt.conversionVehicle && <> · {vehicleLabel(appt.conversionVehicle)}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-[#eef2fb] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="px-4 py-2.5 bg-white border border-blue-200 text-blue-600 font-bold text-xs uppercase tracking-wide rounded-lg hover:bg-blue-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goPrev}
            className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4 text-blue-600" />
          </button>
          <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-blue-700 min-w-[180px] text-center">
            {headerLabel}
          </div>
          <button
            onClick={goNext}
            className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4 text-blue-600" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(['day', 'week', 'month'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold capitalize border transition-colors ${
                viewMode === mode
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
        {APPOINTMENT_TYPES.map(t => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className={`${TYPE_COLORS[t]} h-2.5 w-2.5 rounded-full`} />
            {t}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="bg-blue-600 h-2.5 w-2.5 rounded-full" />
          Conversions
        </div>
      </div>

      {conversionsLoading ? (
        <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}

      <button
        onClick={() => { setAddDefaultDate(null); setIsAddOpen(true) }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-full shadow-xl transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Appointment
      </button>

      {isAddOpen && (
        <AddAppointmentModal
          defaultDate={addDefaultDate}
          onClose={() => setIsAddOpen(false)}
          onSaved={async () => {
            await fetchAppointments()
            setIsAddOpen(false)
          }}
        />
      )}

      {dayPanelDate && (
        <DayAppointmentsPanel
          dateKey={dayPanelDate}
          appointments={appointmentsByDate[dayPanelDate] || []}
          conversionsCount={(conversionsByDate[dayPanelDate] || []).length}
          onClose={() => setDayPanelDate(null)}
          onViewConversions={() => { navigate(`/conversion?date=${dayPanelDate}`) }}
          onChanged={fetchAppointments}
          onSelectAppointment={setSelectedAppointment}
        />
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onChanged={fetchAppointments}
          onEdit={() => { setEditAppointment(selectedAppointment); setSelectedAppointment(null) }}
        />
      )}

      {editAppointment && (
        <AddAppointmentModal
          defaultDate={null}
          appointment={editAppointment}
          onClose={() => setEditAppointment(null)}
          onSaved={async () => {
            await fetchAppointments()
            setEditAppointment(null)
          }}
        />
      )}
    </div>
  )
}

export default Calendar

/* ── Add / edit appointment modal ── */
interface AddAppointmentModalProps {
  defaultDate: string | null
  appointment?: Appointment
  onClose: () => void
  onSaved: () => Promise<void>
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ defaultDate, appointment, onClose, onSaved }) => {
  const isEditing = !!appointment
  const [clients, setClients] = useState<ConversionClient[]>([])
  const [vehicles, setVehicles] = useState<ConversionVehicle[]>([])
  const [title, setTitle] = useState(appointment?.title || '')
  const [location, setLocation] = useState(appointment?.location || '')
  const [description, setDescription] = useState(appointment?.description || '')
  const [date, setDate] = useState(appointment ? toDateInput(appointment.appointment_date) : (defaultDate || new Date().toISOString().slice(0, 10)))
  const [startTime, setStartTime] = useState(appointment ? toTimeInput(appointment.appointment_date) : '09:00')
  const [endTime, setEndTime] = useState(appointment?.end_date ? toTimeInput(appointment.end_date) : '')
  const [clientId, setClientId] = useState(appointment?.conversion_client_id ? String(appointment.conversion_client_id) : '')
  const [vehicleId, setVehicleId] = useState(appointment?.conversion_vehicle_id ? String(appointment.conversion_vehicle_id) : '')
  const [saving, setSaving] = useState(false)
  const skipVehicleReset = useRef(true)

  useEffect(() => {
    adminApiService.getConversionClients().then(setClients).catch(() => setClients([]))
  }, [])

  useEffect(() => {
    if (!clientId) { setVehicles([]); if (!skipVehicleReset.current) setVehicleId(''); skipVehicleReset.current = false; return }
    adminApiService.getConversionVehiclesByClient(Number(clientId)).then(setVehicles).catch(() => setVehicles([]))
    if (!skipVehicleReset.current) setVehicleId('')
    skipVehicleReset.current = false
  }, [clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        title,
        description: description || undefined,
        location: location || undefined,
        appointment_date: new Date(`${date}T${startTime}`).toISOString(),
        end_date: endTime ? new Date(`${date}T${endTime}`).toISOString() : undefined,
        conversion_client_id: clientId ? Number(clientId) : undefined,
        conversion_vehicle_id: vehicleId ? Number(vehicleId) : undefined,
      }
      if (appointment) {
        await adminApiService.updateAppointment(appointment.id, payload)
      } else {
        await adminApiService.createAppointment(payload)
      }
      await onSaved()
    } catch (err) {
      alert(`Failed to save appointment: ${(err as any).message ?? 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow'
  const lbl = 'block text-xs font-semibold text-gray-700 mb-1.5'
  const section = 'text-xs font-bold text-gray-400 uppercase tracking-wider mb-3'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Appointment' : 'Add Appointment'}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{isEditing ? 'Update the details for this appointment' : 'Schedule a new appointment on the calendar'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          <div>
            <h3 className={section}>Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Title *</label>
                  <select className={inp} value={title} onChange={e => setTitle(e.target.value)} required>
                    <option value="" disabled>Select type…</option>
                    {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input className={inp + ' pl-10'} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Workshop bay 2" />
                  </div>
                </div>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea rows={3} className={inp + ' resize-none'} value={description}
                  onChange={e => setDescription(e.target.value)} placeholder="Notes about this appointment…" />
              </div>
            </div>
          </div>

          <div>
            <h3 className={section}>Date &amp; Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>Date *</label>
                <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <label className={lbl}>Start Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input type="time" className={inp + ' pl-10'} value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className={lbl}>End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input type="time" className={inp + ' pl-10'} value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className={section}>Link to Conversion</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Client</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select className={inp + ' pl-10'} value={clientId} onChange={e => setClientId(e.target.value)}>
                    <option value="">— None —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Vehicle</label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select className={inp + ' pl-10'} value={vehicleId} onChange={e => setVehicleId(e.target.value)} disabled={!clientId}>
                    <option value="">— None —</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} {v.registration_number ? `(${v.registration_number})` : ''}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Day appointments panel ── */
interface DayAppointmentsPanelProps {
  dateKey: string
  appointments: Appointment[]
  conversionsCount: number
  onClose: () => void
  onViewConversions: () => void
  onChanged: () => Promise<void>
  onSelectAppointment: (appt: Appointment) => void
}

const DayAppointmentsPanel: React.FC<DayAppointmentsPanelProps> = ({ dateKey, appointments, conversionsCount, onClose, onViewConversions, onChanged, onSelectAppointment }) => {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this appointment?')) return
    try {
      setDeletingId(id)
      await adminApiService.deleteAppointment(id)
      await onChanged()
    } catch {
      alert('Failed to delete appointment')
    } finally {
      setDeletingId(null)
    }
  }

  const displayDate = new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{displayDate}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2">
          {conversionsCount > 0 && (
            <button
              onClick={onViewConversions}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors mb-2"
            >
              <span>{conversionsCount} conversion{conversionsCount === 1 ? '' : 's'} scheduled</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          {appointments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No appointments on this day.</p>
          ) : (
            appointments
              .slice()
              .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
              .map(appt => (
                <div
                  key={appt.id}
                  onClick={() => onSelectAppointment(appt)}
                  className="border border-gray-100 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={`${getAppointmentColor(appt.title)} h-2.5 w-2.5 rounded-full shrink-0 mt-1`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900">{appt.title}</p>
                          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {new Date(appt.appointment_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            {appt.conversionClient && <> · {appt.conversionClient.name}</>}
                          </p>
                          {appt.description && (
                            <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap">{appt.description}</p>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(appt.id) }}
                          disabled={deletingId === appt.id}
                          className="p-1 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {deletingId === appt.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Appointment details modal ── */
interface AppointmentDetailsModalProps {
  appointment: Appointment
  onClose: () => void
  onChanged: () => Promise<void>
  onEdit: () => void
}

const STATUS_STYLES: Record<Appointment['status'], string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ appointment, onClose, onChanged, onEdit }) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this appointment?')) return
    try {
      setDeleting(true)
      await adminApiService.deleteAppointment(appointment.id)
      await onChanged()
      onClose()
    } catch {
      alert('Failed to delete appointment')
      setDeleting(false)
    }
  }

  const displayDate = new Date(appointment.appointment_date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeRange = appointment.end_date
    ? `${formatTime(appointment.appointment_date)} – ${formatTime(appointment.end_date)}`
    : formatTime(appointment.appointment_date)

  const row = (icon: React.ReactNode, content: React.ReactNode) => (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1 pt-1.5">{content}</div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`${getAppointmentColor(appointment.title)} h-3 w-3 rounded-full shrink-0`} />
            <h2 className="text-base font-semibold text-gray-900 truncate">{appointment.title}</h2>
            <span className={`${STATUS_STYLES[appointment.status]} text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-1 shrink-0`}>
              {appointment.status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {row(<CalendarIcon className="h-4 w-4" />, (
            <>
              <p className="text-sm font-medium text-gray-900">{displayDate}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                {timeRange}
              </p>
            </>
          ))}

          {appointment.location && row(<MapPin className="h-4 w-4" />, (
            <p className="text-sm text-gray-700">{appointment.location}</p>
          ))}

          {appointment.conversionClient && row(<User className="h-4 w-4" />, (
            <>
              <p className="text-sm font-medium text-gray-900">{appointment.conversionClient.name}</p>
              {appointment.conversionClient.contact && (
                <p className="text-xs text-gray-500 mt-0.5">{appointment.conversionClient.contact}</p>
              )}
            </>
          ))}

          {appointment.conversionVehicle && row(<Car className="h-4 w-4" />, (
            <>
              <p className="text-sm font-medium text-gray-900">{vehicleLabel(appointment.conversionVehicle)}</p>
              {appointment.conversionVehicle.registration_number && (
                <p className="text-xs text-gray-500 mt-0.5">{appointment.conversionVehicle.registration_number}</p>
              )}
            </>
          ))}

          {appointment.description && row(<FileText className="h-4 w-4" />, (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{appointment.description}</p>
          ))}
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
