import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApiService, Sale, Station, KeyAccount, ConversionClient, Vehicle, Staff, SalesPageParams } from '../services/api'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Search,
  Download,
  DollarSign,
  Fuel,
  Image as ImageIcon,
  Receipt,
  TrendingUp,
  Truck,
  SlidersHorizontal,
  Calendar,
  MapPin,
  Users,
  X
} from 'lucide-react'

const formatCurrency = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const SalesReport: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const stationIdParam = searchParams.get('stationId')
  const keyAccountIdParam = searchParams.get('keyAccountId')
  
  const [sales, setSales] = useState<Sale[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [keyAccounts, setKeyAccounts] = useState<KeyAccount[]>([])
  const [conversionClients, setConversionClients] = useState<ConversionClient[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    stationIdParam ? Number(stationIdParam) : null
  )
  // Encodes which client list the selection came from, e.g. "ka-5" or "cc-12" —
  // most sales are linked via conversion_client_id, not key_account_id, and the
  // two id spaces are independent, so the selected value must carry its type.
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(
    keyAccountIdParam ? `ka-${keyAccountIdParam}` : ''
  )
  const selectedKeyAccountId = selectedClientFilter.startsWith('ka-')
    ? Number(selectedClientFilter.slice(3))
    : null
  const selectedConversionClientId = selectedClientFilter.startsWith('cc-')
    ? Number(selectedClientFilter.slice(3))
    : null

  // Default view: the current business day and the shift running right now.
  // Shift 1 = 07:00–18:59, Shift 2 = 19:00–06:59; before 7am, shift 2 still belongs to yesterday's business day.
  const [defaults] = useState(() => {
    const now = new Date()
    const h = now.getHours()
    const shift: 'shift1' | 'shift2' = h >= 7 && h < 19 ? 'shift1' : 'shift2'
    if (h >= 7) return { preset: 'today' as const, shift, day: '' }
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    const day = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
    return { preset: 'custom' as const, shift, day }
  })
  const [datePreset, setDatePreset] = useState<'today' | 'this_month' | 'last_month' | 'last_90' | 'all' | 'custom'>(defaults.preset)
  const [shift, setShift] = useState<'all' | 'shift1' | 'shift2'>(defaults.shift)
  const [customStart, setCustomStart] = useState(defaults.day)
  const [customEnd, setCustomEnd] = useState(defaults.day)

  const [page, setPage] = useState(1)
  // 0 = "All" — one page holding up to ALL_PAGE_SIZE rows (the server's maximum)
  const ALL_PAGE_SIZE = 5000
  const [pageSize, setPageSize] = useState(10)
  const effectivePageSize = pageSize === 0 ? ALL_PAGE_SIZE : pageSize
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ totalSales: 0, totalQuantity: 0, totalRevenue: 0, uniqueVehicles: 0 })
  const [fetching, setFetching] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Business-day range sent to the server as YYYY-MM-DD (the server maps a day to 07:00 → 07:00).
  const dateRange = useMemo<{ startDate?: string; endDate?: string }>(() => {
    if (datePreset === 'all') return {}
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const now = new Date()
    let start: Date
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (datePreset === 'today') {
      start = end
    } else if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (datePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (datePreset === 'last_90') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)
    } else {
      return {
        startDate: customStart || fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: customEnd || fmt(end),
      }
    }
    return { startDate: fmt(start), endDate: fmt(end) }
  }, [datePreset, customStart, customEnd])

  // Debounce typing so each keystroke doesn't hit the server
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Reference data is loaded once, not on every filter change
  useEffect(() => {
    fetchStations()
    fetchKeyAccounts()
    fetchConversionClients()
    fetchStaff()
  }, [])

  // Any filter change goes back to the first page
  useEffect(() => {
    setPage(1)
  }, [selectedStationId, selectedClientFilter, dateRange, shift, debouncedSearch, pageSize])

  useEffect(() => {
    fetchSales()
  }, [selectedStationId, selectedClientFilter, dateRange, shift, debouncedSearch, page, pageSize])

  useEffect(() => {
    if (selectedKeyAccountId) {
      fetchVehicles(selectedKeyAccountId)
    }
  }, [selectedKeyAccountId])

  // Fetch vehicles when sales are loaded (as fallback if relations aren't included)
  useEffect(() => {
    if (!selectedKeyAccountId && sales.length > 0) {
      // Check if any sales have vehicleId but no vehicle data (relation not loaded)
      const needsVehicleFetch = sales.some(sale => sale.vehicleId && !sale.vehicle)
      if (needsVehicleFetch) {
        fetchVehiclesForSales()
      }
    }
  }, [sales.length, selectedKeyAccountId])

  const buildSalesParams = (overrides: Partial<SalesPageParams> = {}): SalesPageParams => ({
    page,
    pageSize: effectivePageSize,
    stationId: selectedStationId || undefined,
    keyAccountId: selectedKeyAccountId || undefined,
    conversionClientId: selectedConversionClientId || undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    shift: shift === 'all' ? undefined : shift,
    search: debouncedSearch || undefined,
    ...overrides,
  })

  // Only the current page is fetched; the server also returns totals for every matching row.
  // A request counter drops responses from superseded requests (fast filter/page changes).
  const latestRequest = useRef(0)
  const fetchSales = async () => {
    const requestId = ++latestRequest.current
    try {
      setFetching(true)
      const result = await adminApiService.getSalesPage(buildSalesParams())
      if (requestId !== latestRequest.current) return
      setSales(result.data)
      setTotal(result.total)
      setSummary(result.summary)
    } catch (error) {
      if (requestId !== latestRequest.current) return
      console.error('❌ [SalesReport] Error fetching sales:', error)
      setSales([])
      setTotal(0)
      setSummary({ totalSales: 0, totalQuantity: 0, totalRevenue: 0, uniqueVehicles: 0 })
    } finally {
      if (requestId === latestRequest.current) {
        setFetching(false)
        setLoading(false)
      }
    }
  }

  const fetchVehiclesForSales = async () => {
    // Get unique key account IDs from sales that have vehicles
    const keyAccountIds = [...new Set(
      sales
        .filter(sale => sale.keyAccountId && sale.vehicleId)
        .map(sale => sale.keyAccountId!)
    )]

    // Fetch vehicles for each key account
    const allVehicles: Vehicle[] = []
    for (const keyAccountId of keyAccountIds) {
      try {
        const vehicles = await adminApiService.getVehiclesByKeyAccount(keyAccountId)
        allVehicles.push(...vehicles)
      } catch (error) {
        console.error(`❌ [SalesReport] Error fetching vehicles for key account ${keyAccountId}:`, error)
      }
    }
    setVehicles(allVehicles)
  }

  const fetchStations = async () => {
    try {
      const data = await adminApiService.getStations()
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching stations:', error)
      setStations([])
    }
  }

  const fetchKeyAccounts = async () => {
    try {
      const data = await adminApiService.getKeyAccounts()
      setKeyAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching key accounts:', error)
      setKeyAccounts([])
    }
  }

  const fetchConversionClients = async () => {
    try {
      const data = await adminApiService.getConversionClients()
      setConversionClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching conversion clients:', error)
      setConversionClients([])
    }
  }

  const fetchVehicles = async (keyAccountId: number) => {
    try {
      const data = await adminApiService.getVehiclesByKeyAccount(keyAccountId)
      setVehicles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching vehicles:', error)
      setVehicles([])
    }
  }

  const fetchStaff = async () => {
    try {
      const data = await adminApiService.getStaff()
      setStaff(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching staff:', error)
      setStaff([])
    }
  }

  const getStationName = (stationId: number) => {
    const station = stations.find(s => s.id === stationId)
    return station?.name || 'Unknown Station'
  }

  const getKeyAccountName = (keyAccountId?: number) => {
    if (!keyAccountId) return '-'
    const account = keyAccounts.find(ka => ka.id === keyAccountId)
    return account?.name || 'Unknown Account'
  }

  // Owner can come from either the regular key-account flow or a
  // conversion-client sale (conversion_client_id / conversion_vehicle_id) —
  // most current sales are conversion-linked, so fall back to that.
  const getOwnerName = (sale: Sale) => {
    if (sale.keyAccountId) return getKeyAccountName(sale.keyAccountId)
    if (sale.conversionClient) return sale.conversionClient.name
    if (sale.conversionClientId) return 'Unknown Client'
    return '-'
  }

  const getVehicleName = (sale: Sale) => {
    // First check if vehicle data is already in the sale object (from API relations)
    if (sale.vehicle) {
      return `${sale.vehicle.registration_number} - ${sale.vehicle.model}`
    }
    if (sale.conversionVehicle) {
      return `${sale.conversionVehicle.registration_number} - ${sale.conversionVehicle.model}`
    }

    // Fallback to looking up by ID
    if (!sale.vehicleId) return '-'
    const vehicle = vehicles.find(v => v.id === sale.vehicleId)
    return vehicle ? `${vehicle.registration_number} - ${vehicle.model}` : 'Unknown Vehicle'
  }

  const getStaffName = (staffId?: number) => {
    if (!staffId) return '-'
    const staffMember = staff.find(s => s.id === staffId)
    return staffMember?.name || 'Unknown'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateForCSV = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const exportToCSV = async () => {
    if (total === 0) {
      alert('No data to export')
      return
    }

    // The table only holds one page, so pull every matching row in chunks for the export
    let exportSales: Sale[] = []
    try {
      setExporting(true)
      const chunk = 1000
      for (let p = 1; exportSales.length < total; p++) {
        const res = await adminApiService.getSalesPage(buildSalesParams({ page: p, pageSize: chunk }))
        if (res.data.length === 0) break
        exportSales = exportSales.concat(res.data)
      }
    } catch (error) {
      alert(`Export failed: ${(error as any)?.message || 'Unknown error'}`)
      return
    } finally {
      setExporting(false)
    }

    const headers = [
      'Sale Date',
      'Station',
      'Client',
      'Vehicle',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Payment Method',
      'Reference Number',
      'Staff',
      'Notes',
      'Created At'
    ]

    const rows = exportSales.map(sale => [
      formatDateForCSV(sale.saleDate),
      escapeCSV(getStationName(sale.stationId)),
      escapeCSV(getOwnerName(sale)),
      escapeCSV(getVehicleName(sale)),
      Number(sale.quantity).toFixed(2),
      Number(sale.unitPrice).toFixed(2),
      Number(sale.totalAmount).toFixed(2),
      escapeCSV(sale.paymentMethod || ''),
      escapeCSV(sale.referenceNumber || ''),
      escapeCSV(getStaffName(sale.createdBy)),
      escapeCSV(sale.notes || ''),
      formatDateForCSV(sale.createdAt)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const stationName = selectedStationId 
      ? `-${getStationName(selectedStationId).replace(/\s+/g, '-')}` 
      : ''
    const selectedClientName = selectedKeyAccountId
      ? getKeyAccountName(selectedKeyAccountId)
      : selectedConversionClientId
        ? conversionClients.find(c => c.id === selectedConversionClientId)?.name
        : null
    const accountName = selectedClientName
      ? `-${selectedClientName.replace(/\s+/g, '-')}`
      : ''
    const filename = `sales-report${stationName}${accountName}-${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = datePreset !== defaults.preset || shift !== defaults.shift || customStart !== defaults.day || customEnd !== defaults.day || selectedStationId !== null || selectedClientFilter !== '' || searchTerm !== ''

  const clearFilters = () => {
    setDatePreset(defaults.preset)
    setShift(defaults.shift)
    setCustomStart(defaults.day)
    setCustomEnd(defaults.day)
    setSelectedStationId(null)
    setSelectedClientFilter('')
    setSearchTerm('')
  }

  // Summary statistics come from the server and cover every matching sale, not just this page
  const { totalSales, totalQuantity, totalRevenue, uniqueVehicles: uniqueVehicleCount } = summary
  const avv = totalSales > 0 ? totalQuantity / totalSales : 0

  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize))
  const rangeStart = total === 0 ? 0 : (page - 1) * effectivePageSize + 1
  const rangeEnd = Math.min(page * effectivePageSize, total)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/accounts')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Accounts"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">Sales Report</h1>
          <button
            onClick={() => {
              // Carry the report's current filters over to the graph page
              const qs = new URLSearchParams()
              Object.entries(buildSalesParams()).forEach(([k, v]) => {
                if (k !== 'page' && k !== 'pageSize' && v !== undefined && v !== '') qs.append(k, String(v))
              })
              navigate(`/sales/report/daily?${qs.toString()}`)
            }}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-[11px] bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <BarChart3 className="h-3 w-3" />
            Daily Graph
          </button>
          <button
            onClick={() => navigate('/sales/report/summary')}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <Receipt className="h-3 w-3" />
            Sales Summary
          </button>
          <button
            onClick={() => navigate('/sales/report/weekly')}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <TrendingUp className="h-3 w-3" />
            Performance Report
          </button>
          <button
            onClick={() => navigate('/sales/report/fuel')}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            <Fuel className="h-3 w-3" />
            Fuel Report
          </button>
        </div>

        {/* Filters and Summary */}
        <div className="mb-2 space-y-2">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-700">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="w-36">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Date Range</label>
                <div className="relative">
                  <Calendar className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="today">Today</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_90">Last 90 Days</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {datePreset === 'custom' && (
                <>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">From</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-medium text-gray-500 mb-0.5">To</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="w-px self-stretch bg-gray-100 hidden sm:block" />

              <div className="min-w-[140px] flex-1">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Station</label>
                <div className="relative">
                  <MapPin className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedStationId || ''}
                    onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">All Stations</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="min-w-[140px] flex-1">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Client</label>
                <div className="relative">
                  <Users className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedClientFilter}
                    onChange={(e) => setSelectedClientFilter(e.target.value)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">All Clients</option>
                    {conversionClients.map((client) => (
                      <option key={`cc-${client.id}`} value={`cc-${client.id}`}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="min-w-[200px] flex-[2]">
                <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Search</label>
                <div className="relative">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 h-3 w-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Station, account, vehicle, reference…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-5 pr-1.5 py-1 text-[11px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={exportToCSV}
                disabled={total === 0 || exporting}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={total === 0 ? 'No data to export' : 'Export all matching sales to CSV'}
              >
                <Download className="h-3 w-3" />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total sales</div>
                <div className="text-sm font-bold text-gray-900 truncate">{totalSales}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <Fuel className="h-4 w-4 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total quantity</div>
                <div className="text-sm font-bold text-gray-900 truncate">{totalQuantity.toFixed(2)} L</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Total revenue</div>
                <div className="text-sm font-bold text-gray-900 truncate">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">AVV</div>
                <div className="text-sm font-bold text-gray-900 truncate">{avv.toFixed(2)}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-2.5 flex items-center gap-2.5">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Truck className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 font-medium truncate">Unique vehicles</div>
                <div className="text-sm font-bold text-gray-900 truncate">{uniqueVehicleCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Shift tabs */}
        <div className="flex gap-1 p-1 bg-gray-200 rounded-lg mb-2 w-fit">
          {([
            ['all', 'All Day (7am – 7am)'],
            ['shift1', 'Shift 1 (7am – 7pm)'],
            ['shift2', 'Shift 2 (7pm – 7am)'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setShift(key)}
              className={`px-4 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                shift === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sales Table */}
        <div className={`bg-white rounded border overflow-hidden transition-opacity ${fetching ? 'opacity-60' : ''}`}>
          {sales.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No sales found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Image</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Sale Date</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Station</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Client</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Vehicle</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Quantity</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Unit Price</th>
                    <th className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">Total Amount</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Payment Method</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Reference</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Staff</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.map((sale) => {
                    // Vehicle photo from conversion_vehicles.photo_url (via conversion_vehicle_id); fall back to the sale's own image.
                    const imageSrc = sale.conversionVehicle?.photo_url || sale.imagePath
                    return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[11px]">
                        {imageSrc ? (
                          <button
                            type="button"
                            onClick={() => setExpandedImage(imageSrc)}
                            className="w-8 h-8 rounded bg-gray-100 overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity"
                            title="Click to expand"
                          >
                            <img src={imageSrc} alt="Vehicle" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-3.5 w-3.5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 text-[11px]">{formatDate(sale.saleDate)}</td>
                      <td className="px-2 py-1 text-[11px] font-medium">{getStationName(sale.stationId)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getOwnerName(sale)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getVehicleName(sale)}</td>
                      <td className="px-2 py-1 text-[11px] text-right font-medium">{Number(sale.quantity).toFixed(2)} L</td>
                      <td className="px-2 py-1 text-[11px] text-right">{Number(sale.unitPrice).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[11px] text-right font-bold text-purple-600">{formatCurrency(Number(sale.totalAmount))}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.paymentMethod || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.referenceNumber || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getStaffName(sale.createdBy)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600 max-w-xs truncate">{sale.notes || '-'}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 border-t bg-gray-50 text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <span>Showing {rangeStart}–{rangeEnd} of {total}</span>
                <label className="flex items-center gap-1">
                  Rows
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-1 py-0.5 border border-gray-300 rounded bg-white"
                  >
                    {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                    <option value={0}>All</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || fetching}
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || fetching}
                  className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <img
            src={expandedImage}
            alt="Sale"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default SalesReport

