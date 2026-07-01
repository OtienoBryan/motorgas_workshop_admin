import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Conversion } from '../services/api'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const Calendar: React.FC = () => {
  const navigate = useNavigate()
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [conversionsLoading, setConversionsLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchConversions()
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

  // Calendar functions
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  // Group conversions by scheduled date
  const getConversionsByDate = () => {
    const conversionsByDate: { [key: string]: Conversion[] } = {}
    
    conversions.forEach(conversion => {
      if (conversion.scheduledDate) {
        try {
          const date = new Date(conversion.scheduledDate)
          // Use local date to avoid timezone issues
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()
          const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          
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

  const conversionsByDate = getConversionsByDate()

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
    const days: (number | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return (
      <div className="w-full">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[80px]"></div>
            }
            
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayConversions = conversionsByDate[dateKey] || []
            const isToday = 
              day === new Date().getDate() && 
              currentMonth === new Date().getMonth() && 
              currentYear === new Date().getFullYear()
            
            const handleDayClick = () => {
              if (dayConversions.length > 0) {
                // Navigate to conversion page with date filter
                navigate(`/conversion?date=${dateKey}`)
              }
            }
            
            return (
              <div
                key={day}
                onClick={handleDayClick}
                className={`
                  border-2 rounded-lg p-2 min-h-[80px] flex flex-col
                  ${isToday ? 'bg-blue-50 border-blue-400 shadow-md' : 'bg-white border-gray-200'}
                  ${dayConversions.length > 0 ? 'hover:bg-gray-50 cursor-pointer hover:shadow-md transition-all' : ''}
                `}
                title={dayConversions.length > 0 ? `${dayConversions.length} conversion(s) scheduled - Click to view` : ''}
              >
                <span className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                  {day}
                </span>
                {dayConversions.length > 0 && (
                  <div className="mt-auto">
                    <div className="bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {dayConversions.length}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-600 mt-1">View scheduled conversions and appointments</p>
        </div>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-6 w-6 text-blue-500" />
        </div>
      </div>

      <div className="admin-card rounded-xl shadow-lg p-6">
        {conversionsLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>
    </div>
  )
}

export default Calendar

