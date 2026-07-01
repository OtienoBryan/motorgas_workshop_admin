import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApiService, Sale, Station, KeyAccount, Vehicle, Staff } from '../services/api'
import { 
  ArrowLeft,
  Search,
  Download,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react'

const SalesReport: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const stationIdParam = searchParams.get('stationId')
  const keyAccountIdParam = searchParams.get('keyAccountId')
  
  const [sales, setSales] = useState<Sale[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [keyAccounts, setKeyAccounts] = useState<KeyAccount[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStationId, setSelectedStationId] = useState<number | null>(
    stationIdParam ? Number(stationIdParam) : null
  )
  const [selectedKeyAccountId, setSelectedKeyAccountId] = useState<number | null>(
    keyAccountIdParam ? Number(keyAccountIdParam) : null
  )

  useEffect(() => {
    fetchSales()
    fetchStations()
    fetchKeyAccounts()
    fetchStaff()
  }, [selectedStationId, selectedKeyAccountId])

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
      const data = await adminApiService.getSales(selectedStationId || undefined, selectedKeyAccountId || undefined)
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

  const getVehicleName = (sale: Sale) => {
    // First check if vehicle data is already in the sale object (from API relations)
    if (sale.vehicle) {
      return `${sale.vehicle.registration_number} - ${sale.vehicle.model}`
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
      'Client Type',
      'Key Account',
      'Vehicle',
      'Quantity',
      'Unit Price',
      'Total Amount',
      'Reference Number',
      'Staff',
      'Notes',
      'Created At'
    ]

    const rows = filteredSales.map(sale => [
      formatDateForCSV(sale.saleDate),
      escapeCSV(getStationName(sale.stationId)),
      escapeCSV(sale.clientType),
      escapeCSV(getKeyAccountName(sale.keyAccountId)),
      escapeCSV(getVehicleName(sale)),
      Number(sale.quantity).toFixed(2),
      Number(sale.unitPrice).toFixed(2),
      Number(sale.totalAmount).toFixed(2),
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
    const accountName = selectedKeyAccountId 
      ? `-${getKeyAccountName(selectedKeyAccountId)?.replace(/\s+/g, '-')}` 
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
      getKeyAccountName(sale.keyAccountId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleName(sale).toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientType.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Calculate summary statistics
  const totalSales = filteredSales.length
  const totalQuantity = filteredSales.reduce((sum, s) => sum + Number(s.quantity), 0)
  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const averagePrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0

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
            onClick={() => navigate('/sales/post')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Post Sale"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">Sales Report</h1>
        </div>

        {/* Filters and Summary */}
        <div className="mb-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                Filter by Key Account
              </label>
              <select
                value={selectedKeyAccountId || ''}
                onChange={(e) => setSelectedKeyAccountId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Key Accounts</option>
                {keyAccounts
                  .filter(ka => ka.is_active === 1)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
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
                  placeholder="Search by station, account, vehicle, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-6 pr-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                disabled={filteredSales.length === 0}
                className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={filteredSales.length === 0 ? 'No data to export' : 'Export to CSV'}
              >
                <Download className="h-3 w-3" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total Sales</div>
              <div className="text-[11px] font-bold text-blue-600">{totalSales}</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total Quantity</div>
              <div className="text-[11px] font-bold text-green-600">{totalQuantity.toFixed(2)} L</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total Revenue</div>
              <div className="text-[11px] font-bold text-purple-600">{totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Average Price</div>
              <div className="text-[11px] font-bold text-orange-600">{averagePrice.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded border overflow-hidden">
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-gray-500">
              No sales found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Sale Date</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Station</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Client Type</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Key Account</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Vehicle</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Quantity</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Unit Price</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Total Amount</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Reference</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Staff</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[10px]">{formatDate(sale.saleDate)}</td>
                      <td className="px-2 py-1 text-[10px] font-medium">{getStationName(sale.stationId)}</td>
                      <td className="px-2 py-1 text-[10px]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          sale.clientType === 'key_account' 
                            ? 'text-blue-600 bg-blue-50' 
                            : 'text-gray-600 bg-gray-50'
                        }`}>
                          {sale.clientType === 'key_account' ? 'Key Account' : 'Regular'}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getKeyAccountName(sale.keyAccountId)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getVehicleName(sale)}</td>
                      <td className="px-2 py-1 text-[10px] text-right font-medium">{Number(sale.quantity).toFixed(2)} L</td>
                      <td className="px-2 py-1 text-[10px] text-right">{Number(sale.unitPrice).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] text-right font-bold text-purple-600">{Number(sale.totalAmount).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{sale.referenceNumber || '-'}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getStaffName(sale.createdBy)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600 max-w-xs truncate">{sale.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalesReport

