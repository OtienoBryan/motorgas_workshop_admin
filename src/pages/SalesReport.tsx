import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApiService, Sale, Station, KeyAccount, ConversionClient, Vehicle, Staff } from '../services/api'
import {
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

  const [datePreset, setDatePreset] = useState<'this_month' | 'last_month' | 'last_30' | 'last_90' | 'all' | 'custom'>('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const dateRange = useMemo(() => {
    if (datePreset === 'all') return null
    const now = new Date()
    let start: Date
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (datePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    } else if (datePreset === 'last_30') {
      start = new Date(now)
      start.setDate(start.getDate() - 29)
    } else if (datePreset === 'last_90') {
      start = new Date(now)
      start.setDate(start.getDate() - 89)
    } else {
      start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)
      end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end
    }
    return { start, end }
  }, [datePreset, customStart, customEnd])

  useEffect(() => {
    fetchSales()
    fetchStations()
    fetchKeyAccounts()
    fetchConversionClients()
    fetchStaff()
  }, [selectedStationId, selectedClientFilter])

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

  const fetchSales = async () => {
    try {
      console.log('💰 [SalesReport] Fetching sales...')
      setLoading(true)
      const data = await adminApiService.getSales(
        selectedStationId || undefined,
        selectedKeyAccountId || undefined,
        selectedConversionClientId || undefined
      )
      console.log('✅ [SalesReport] Sales fetched:', data)
      setSales(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [SalesReport] Error fetching sales:', error)
      setSales([])
    } finally {
      setLoading(false)
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

  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      alert('No data to export')
      return
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

    const rows = filteredSales.map(sale => [
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

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      getStationName(sale.stationId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getOwnerName(sale).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleName(sale).toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientType.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDateRange = !dateRange || (() => {
      const d = new Date(sale.saleDate)
      return d >= dateRange.start && d <= dateRange.end
    })()

    return matchesSearch && matchesDateRange
  })

  const hasActiveFilters = datePreset !== 'this_month' || selectedStationId !== null || selectedClientFilter !== '' || searchTerm !== ''

  const clearFilters = () => {
    setDatePreset('this_month')
    setCustomStart('')
    setCustomEnd('')
    setSelectedStationId(null)
    setSelectedClientFilter('')
    setSearchTerm('')
  }

  // Calculate summary statistics
  const totalSales = filteredSales.length
  const totalQuantity = filteredSales.reduce((sum, s) => sum + Number(s.quantity), 0)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const avv = totalSales > 0 ? totalQuantity / totalSales : 0
  // vehicleId and conversionVehicleId are independent id spaces, so a plain
  // numeric Set would collide a regular vehicle #8 with a conversion vehicle #8
  const uniqueVehicleCount = new Set(
    filteredSales
      .map(s => s.vehicleId ? `v-${s.vehicleId}` : s.conversionVehicleId ? `cv-${s.conversionVehicleId}` : null)
      .filter((key): key is string => key !== null)
  ).size

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
            onClick={() => navigate('/sales/report/summary')}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-[11px] bg-indigo-600 text-white rounded hover:bg-indigo-700"
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
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_30">Last 30 Days</option>
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
                disabled={filteredSales.length === 0}
                className="flex items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={filteredSales.length === 0 ? 'No data to export' : 'Export to CSV'}
              >
                <Download className="h-3 w-3" />
                Export CSV
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
                <div className="text-sm font-bold text-gray-900 truncate">{totalRevenue.toFixed(2)}</div>
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

        {/* Sales Table */}
        <div className="bg-white rounded border overflow-hidden">
          {filteredSales.length === 0 ? (
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
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[11px]">
                        {sale.imagePath ? (
                          <button
                            type="button"
                            onClick={() => setExpandedImage(sale.imagePath!)}
                            className="w-8 h-8 rounded bg-gray-100 overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity"
                            title="Click to expand"
                          >
                            <img src={sale.imagePath} alt="Sale" className="w-full h-full object-cover" />
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
                      <td className="px-2 py-1 text-[11px] text-right font-bold text-purple-600">{Number(sale.totalAmount).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.paymentMethod || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{sale.referenceNumber || '-'}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600">{getStaffName(sale.createdBy)}</td>
                      <td className="px-2 py-1 text-[11px] text-gray-600 max-w-xs truncate">{sale.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

