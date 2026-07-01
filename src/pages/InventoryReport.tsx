import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApiService, InventoryLedger, Station, Region, Staff } from '../services/api'
import { 
  ArrowLeft,
  Search,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCw
} from 'lucide-react'

const InventoryReport: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const stationIdParam = searchParams.get('stationId')
  
  const [ledger, setLedger] = useState<InventoryLedger[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    stationIdParam ? Number(stationIdParam) : null
  )

  useEffect(() => {
    fetchLedger()
    fetchStations()
    fetchRegions()
    fetchStaff()
  }, [selectedStationId])

  const fetchLedger = async () => {
    try {
      console.log('📦 [InventoryReport] Fetching inventory ledger...')
      setLoading(true)
      const data = selectedStationId
        ? await adminApiService.getInventoryLedger(selectedStationId)
        : await adminApiService.getInventoryReport()
      console.log('✅ [InventoryReport] Ledger fetched:', data)
      console.log('✅ [InventoryReport] First entry sample:', data && data.length > 0 ? {
        id: data[0].id,
        quantityIn: data[0].quantityIn,
        quantityOut: data[0].quantityOut,
        balance: data[0].balance,
        transactionType: data[0].transactionType,
        quantity: data[0].quantity,
        newQuantity: data[0].newQuantity
      } : 'No data')
      setLedger(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [InventoryReport] Error fetching ledger:', error)
      setLedger([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const data = await adminApiService.getStations()
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [InventoryReport] Error fetching stations:', error)
      setStations([])
    }
  }

  const fetchRegions = async () => {
    try {
      const data = await adminApiService.getRegions()
      setRegions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [InventoryReport] Error fetching regions:', error)
      setRegions([])
    }
  }

  const fetchStaff = async () => {
    try {
      const data = await adminApiService.getStaff()
      setStaff(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [InventoryReport] Error fetching staff:', error)
      setStaff([])
    }
  }

  const getStationName = (stationId: number) => {
    const station = stations.find(s => s.id === stationId)
    return station?.name || 'Unknown Station'
  }

  const getRegionName = (regionId: number) => {
    const region = regions.find(r => r.id === regionId)
    return region?.name || 'Unknown'
  }

  const getStaffName = (staffId: number | null) => {
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
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }


  const exportToCSV = () => {
    if (filteredLedger.length === 0) {
      alert('No data to export')
      return
    }

    // CSV Headers - matching table column order exactly
    const headers = [
      'Date',
      'Time',
      'Station',
      'Quantity IN',
      'Quantity OUT',
      'Balance',
      'Reference',
      'Staff',
      'Notes'
    ]

    // CSV Rows - matching table column order exactly
    const rows = filteredLedger.map(entry => {
      const station = stations.find(s => s.id === entry.stationId)
      const regionName = station ? getRegionName(station.regionId) : 'Unknown'
      const stationName = getStationName(entry.stationId)
      // Combine station name and region like in the table display
      const stationDisplay = entry.station 
        ? `${stationName} (${regionName})`
        : stationName
      
      return [
        formatDateForCSV(entry.created_at),
        escapeCSV(stationDisplay),
        getQuantityIn(entry).toFixed(2),
        getQuantityOut(entry).toFixed(2),
        getBalance(entry).toFixed(2),
        escapeCSV(entry.referenceNumber || ''),
        escapeCSV(getStaffName(entry.createdBy)),
        escapeCSV(entry.notes || '')
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Generate filename with date and station filter
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const stationName = selectedStationId 
      ? `-${getStationName(selectedStationId).replace(/\s+/g, '-')}` 
      : ''
    const filename = `inventory-ledger-report${stationName}-${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
  }

  // Helper functions for backward compatibility (if transactionType exists)
  const getTransactionTypeColor = (type?: string) => {
    if (!type) return 'text-gray-600 bg-gray-50'
    switch (type) {
      case 'IN':
        return 'text-green-600 bg-green-50'
      case 'OUT':
        return 'text-red-600 bg-red-50'
      case 'ADJUSTMENT':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTransactionTypeIcon = (type?: string) => {
    if (!type) return null
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-3 w-3" />
      case 'OUT':
        return <TrendingDown className="h-3 w-3" />
      case 'ADJUSTMENT':
        return <RotateCw className="h-3 w-3" />
      default:
        return null
    }
  }

  // Helper function to get quantityIn with fallback
  const getQuantityIn = (entry: InventoryLedger): number => {
    // Check if new structure exists (even if 0, it's a valid value)
    if (entry.quantityIn !== undefined && entry.quantityIn !== null) {
      return Number(entry.quantityIn)
    }
    // Fallback to old structure
    if (entry.transactionType === 'IN' && entry.quantity !== undefined && entry.quantity !== null) {
      return Number(entry.quantity)
    }
    return 0
  }

  // Helper function to get quantityOut with fallback
  const getQuantityOut = (entry: InventoryLedger): number => {
    // Check if new structure exists (even if 0, it's a valid value)
    if (entry.quantityOut !== undefined && entry.quantityOut !== null) {
      return Number(entry.quantityOut)
    }
    // Fallback to old structure
    if (entry.transactionType === 'OUT' && entry.quantity !== undefined && entry.quantity !== null) {
      return Number(entry.quantity)
    }
    return 0
  }

  // Helper function to get balance with fallback
  const getBalance = (entry: InventoryLedger): number => {
    // Check if new structure exists (even if 0, it's a valid value)
    if (entry.balance !== undefined && entry.balance !== null) {
      return Number(entry.balance)
    }
    // Fallback to old structure
    if (entry.newQuantity !== undefined && entry.newQuantity !== null) {
      return Number(entry.newQuantity)
    }
    // If no balance found, try to calculate from previous + in - out
    const prev = Number(entry.previousQuantity || 0)
    const inQty = getQuantityIn(entry)
    const outQty = getQuantityOut(entry)
    return prev + inQty - outQty
  }

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = 
      getStationName(entry.stationId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Calculate summary statistics
  const totalIn = filteredLedger
    .reduce((sum, e) => sum + getQuantityIn(e), 0)
  
  const totalOut = filteredLedger
    .reduce((sum, e) => sum + getQuantityOut(e), 0)
  
  // Get current balance (from last entry or station quantity)
  const currentBalance = filteredLedger.length > 0 
    ? getBalance(filteredLedger[0])
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/inventory')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Inventory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">Inventory Ledger Report</h1>
        </div>

        {/* Filters and Summary */}
        <div className="mb-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Filter by Station
              </label>
              <select
                value={selectedStationId || ''}
                onChange={(e) => setSelectedStationId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Stations</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <input
                  type="text"
                  placeholder="Search by station, reference, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                disabled={filteredLedger.length === 0}
                className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={filteredLedger.length === 0 ? 'No data to export' : 'Export to CSV'}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total IN</div>
              <div className="text-[11px] font-bold text-green-600">{totalIn.toFixed(2)} L</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total OUT</div>
              <div className="text-[11px] font-bold text-red-600">{totalOut.toFixed(2)} L</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Current Balance</div>
              <div className={`text-[11px] font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {currentBalance.toFixed(2)} L
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded border overflow-hidden">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-gray-500">
              No ledger entries found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Date</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Station</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Quantity IN</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Quantity OUT</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Balance</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Reference</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Staff</th>
                  <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-2 py-1 text-[10px]">{formatDate(entry.created_at)}</td>
                    <td className="px-2 py-1 text-[10px]">
                      <div>
                        <div className="font-medium">{getStationName(entry.stationId)}</div>
                        {entry.station && (
                          <div className="text-[9px] text-gray-500">
                            {getRegionName(entry.station.regionId)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-[10px] font-medium text-green-600">
                      {getQuantityIn(entry).toFixed(2)} L
                    </td>
                    <td className="px-2 py-1 text-[10px] font-medium text-red-600">
                      {getQuantityOut(entry).toFixed(2)} L
                    </td>
                    <td className="px-2 py-1 text-[10px] font-semibold text-blue-600">
                      {getBalance(entry).toFixed(2)} L
                    </td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">
                      {entry.referenceNumber || '-'}
                    </td>
                    <td className="px-2 py-1 text-[10px] text-gray-600">
                      {getStaffName(entry.createdBy)}
                    </td>
                    <td className="px-2 py-1 text-[10px] text-gray-600 max-w-xs truncate">
                      {entry.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryReport

