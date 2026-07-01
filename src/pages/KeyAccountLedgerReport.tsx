import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApiService, KeyAccountLedger, KeyAccount, Station, Vehicle, Staff } from '../services/api'
import { 
  ArrowLeft,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  RotateCw
} from 'lucide-react'

const KeyAccountLedgerReport: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyAccountIdParam = searchParams.get('keyAccountId')
  
  const [ledger, setLedger] = useState<KeyAccountLedger[]>([])
  const [keyAccounts, setKeyAccounts] = useState<KeyAccount[]>([])
  const [stations, setStations] = useState<Station[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedKeyAccountId, setSelectedKeyAccountId] = useState<number | null>(
    keyAccountIdParam ? Number(keyAccountIdParam) : null
  )
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)

  useEffect(() => {
    fetchLedger()
    fetchKeyAccounts()
    fetchStations()
    fetchStaff()
  }, [selectedKeyAccountId])

  useEffect(() => {
    if (selectedKeyAccountId) {
      fetchVehicles(selectedKeyAccountId)
    } else {
      setVehicles([])
      setSelectedVehicleId(null)
    }
  }, [selectedKeyAccountId])

  useEffect(() => {
    // Reset vehicle filter when key account changes
    setSelectedVehicleId(null)
  }, [selectedKeyAccountId])

  const fetchLedger = async () => {
    try {
      console.log('💰 [KeyAccountLedgerReport] Fetching key account ledger...')
      setLoading(true)
      const data = selectedKeyAccountId
        ? await adminApiService.getKeyAccountLedgerByKeyAccount(selectedKeyAccountId)
        : await adminApiService.getKeyAccountLedger()
      console.log('✅ [KeyAccountLedgerReport] Ledger fetched:', data)
      setLedger(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [KeyAccountLedgerReport] Error fetching ledger:', error)
      setLedger([])
    } finally {
      setLoading(false)
    }
  }

  const fetchKeyAccounts = async () => {
    try {
      const data = await adminApiService.getKeyAccounts()
      setKeyAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [KeyAccountLedgerReport] Error fetching key accounts:', error)
      setKeyAccounts([])
    }
  }

  const fetchStations = async () => {
    try {
      const data = await adminApiService.getStations()
      setStations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [KeyAccountLedgerReport] Error fetching stations:', error)
      setStations([])
    }
  }

  const fetchVehicles = async (keyAccountId: number) => {
    try {
      const data = await adminApiService.getVehiclesByKeyAccount(keyAccountId)
      setVehicles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [KeyAccountLedgerReport] Error fetching vehicles:', error)
      setVehicles([])
    }
  }

  const fetchStaff = async () => {
    try {
      const data = await adminApiService.getStaff()
      setStaff(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('❌ [KeyAccountLedgerReport] Error fetching staff:', error)
      setStaff([])
    }
  }

  const getKeyAccountName = (keyAccountId: number) => {
    const account = keyAccounts.find(ka => ka.id === keyAccountId)
    return account?.name || 'Unknown Account'
  }

  const getStationName = (stationId: number) => {
    const station = stations.find(s => s.id === stationId)
    return station?.name || 'Unknown Station'
  }

  const getVehicleName = (vehicleId?: number) => {
    if (!vehicleId) return '-'
    const vehicle = vehicles.find(v => v.id === vehicleId)
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'SALE':
        return 'text-red-600 bg-red-50'
      case 'PAYMENT':
        return 'text-green-600 bg-green-50'
      case 'ADJUSTMENT':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'SALE':
        return <TrendingUp className="h-3 w-3" />
      case 'PAYMENT':
        return <TrendingDown className="h-3 w-3" />
      case 'ADJUSTMENT':
        return <RotateCw className="h-3 w-3" />
      default:
        return null
    }
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
      'Key Account',
      'Vehicle',
      'Station',
      'Type',
      'Quantity',
      'Unit Price',
      'Total',
      'Debit',
      'Credit',
      'Balance',
      'Reference',
      'Description',
      'Staff',
      'Notes'
    ]

    // CSV Rows - matching table column order exactly
    const rows = filteredLedger.map(entry => [
      formatDateForCSV(entry.createdAt),
      escapeCSV(getKeyAccountName(entry.keyAccountId)),
      escapeCSV(getVehicleName(entry.vehicleId)),
      escapeCSV(getStationName(entry.stationId)),
      escapeCSV(entry.transactionType),
      entry.quantity ? Number(entry.quantity).toFixed(2) : '0.00',
      entry.unitPrice ? Number(entry.unitPrice).toFixed(2) : '0.00',
      Number(entry.totalAmount).toFixed(2),
      Number(entry.debit).toFixed(2),
      Number(entry.credit).toFixed(2),
      Number(entry.balance).toFixed(2),
      escapeCSV(entry.referenceNumber || ''),
      escapeCSV(entry.description || ''),
      escapeCSV(getStaffName(entry.createdBy)),
      escapeCSV(entry.notes || '')
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
    const accountName = selectedKeyAccountId 
      ? `-${getKeyAccountName(selectedKeyAccountId).replace(/\s+/g, '-')}` 
      : ''
    const filename = `key-account-ledger-report${accountName}-${dateStr}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = 
      getKeyAccountName(entry.keyAccountId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStationName(entry.stationId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVehicle = !selectedVehicleId || entry.vehicleId === selectedVehicleId
    
    return matchesSearch && matchesVehicle
  })

  // Calculate summary statistics
  const totalDebit = filteredLedger.reduce((sum, e) => sum + Number(e.debit), 0)
  const totalCredit = filteredLedger.reduce((sum, e) => sum + Number(e.credit), 0)
  const currentBalance = filteredLedger.length > 0 
    ? Number(filteredLedger[0].balance)
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
            onClick={() => navigate('/key-accounts')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Key Accounts"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">Key Account Ledger Report</h1>
        </div>

        {/* Filters and Summary */}
        <div className="mb-2 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
            {selectedKeyAccountId && vehicles.length > 0 && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Filter by Vehicle
                </label>
                <select
                  value={selectedVehicleId || ''}
                  onChange={(e) => setSelectedVehicleId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                <input
                  type="text"
                  placeholder="Search by account, station, reference, notes..."
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
              <div className="text-[9px] text-gray-600 mb-0.5">Total Debit</div>
              <div className="text-[11px] font-bold text-red-600">{totalDebit.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Total Credit</div>
              <div className="text-[11px] font-bold text-green-600">{totalCredit.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded border p-2">
              <div className="text-[9px] text-gray-600 mb-0.5">Current Balance</div>
              <div className={`text-[11px] font-bold ${currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {currentBalance.toFixed(2)}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Date</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Key Account</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Vehicle</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Station</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Type</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Quantity</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Unit Price</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Total</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Debit</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Credit</th>
                    <th className="px-2 py-1 text-right text-[10px] font-medium text-gray-700">Balance</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Reference</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Staff</th>
                    <th className="px-2 py-1 text-left text-[10px] font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLedger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-[10px]">{formatDate(entry.createdAt)}</td>
                      <td className="px-2 py-1 text-[10px] font-medium">{getKeyAccountName(entry.keyAccountId)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getVehicleName(entry.vehicleId)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getStationName(entry.stationId)}</td>
                      <td className="px-2 py-1 text-[10px]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${getTransactionTypeColor(entry.transactionType)}`}>
                          {getTransactionTypeIcon(entry.transactionType)}
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-[10px] text-right">{entry.quantity ? Number(entry.quantity).toFixed(2) : '0.00'}</td>
                      <td className="px-2 py-1 text-[10px] text-right">{entry.unitPrice ? Number(entry.unitPrice).toFixed(2) : '0.00'}</td>
                      <td className="px-2 py-1 text-[10px] font-medium text-right">{Number(entry.totalAmount).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] font-medium text-red-600 text-right">{Number(entry.debit).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] font-medium text-green-600 text-right">{Number(entry.credit).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] font-semibold text-blue-600 text-right">{Number(entry.balance).toFixed(2)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{entry.referenceNumber || '-'}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600">{getStaffName(entry.createdBy)}</td>
                      <td className="px-2 py-1 text-[10px] text-gray-600 max-w-xs truncate">{entry.notes || '-'}</td>
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

export default KeyAccountLedgerReport

