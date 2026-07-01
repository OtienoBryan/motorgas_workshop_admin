import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Station, KeyAccount, Vehicle, FuelPrice, Staff } from '../services/api'
import { 
  ArrowLeft,
  DollarSign,
  Save
} from 'lucide-react'

const PostSale: React.FC = () => {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [keyAccounts, setKeyAccounts] = useState<KeyAccount[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    stationId: '',
    clientType: 'regular' as 'regular' | 'key_account',
    keyAccountId: '',
    vehicleId: '',
    quantity: '',
    price: '',
    notes: '',
    createdBy: ''
  })
  const [currentFuelPrice, setCurrentFuelPrice] = useState<FuelPrice | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.stationId) {
      fetchFuelPrice(Number(formData.stationId))
    } else {
      setCurrentFuelPrice(null)
      setFormData(prev => ({ ...prev, price: '' }))
    }
  }, [formData.stationId])

  useEffect(() => {
    if (formData.clientType === 'key_account' && formData.keyAccountId) {
      fetchVehicles(Number(formData.keyAccountId))
    } else {
      setVehicles([])
      setFormData(prev => ({ ...prev, vehicleId: '' }))
    }
  }, [formData.clientType, formData.keyAccountId])

  useEffect(() => {
    if (currentFuelPrice && formData.quantity) {
      const totalPrice = Number(currentFuelPrice.price) * Number(formData.quantity)
      setFormData(prev => ({ ...prev, price: totalPrice.toFixed(2) }))
    } else if (!formData.quantity) {
      setFormData(prev => ({ ...prev, price: currentFuelPrice ? Number(currentFuelPrice.price).toFixed(2) : '' }))
    }
  }, [currentFuelPrice, formData.quantity])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [stationsData, keyAccountsData, staffData] = await Promise.all([
        adminApiService.getStations(),
        adminApiService.getKeyAccounts(),
        adminApiService.getStaff()
      ])
      setStations(Array.isArray(stationsData) ? stationsData : [])
      setKeyAccounts(Array.isArray(keyAccountsData) ? keyAccountsData : [])
      setStaff(Array.isArray(staffData) ? staffData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFuelPrice = async (stationId: number) => {
    try {
      const prices = await adminApiService.getFuelPricesByStation(stationId)
      if (prices && prices.length > 0) {
        // Get the most recent price
        const latestPrice = prices.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        setCurrentFuelPrice(latestPrice)
        if (!formData.quantity) {
          setFormData(prev => ({ ...prev, price: Number(latestPrice.price).toFixed(2) }))
        }
      } else {
        setCurrentFuelPrice(null)
        setFormData(prev => ({ ...prev, price: '' }))
      }
    } catch (error) {
      console.error('Error fetching fuel price:', error)
      setCurrentFuelPrice(null)
      setFormData(prev => ({ ...prev, price: '' }))
    }
  }

  const fetchVehicles = async (keyAccountId: number) => {
    try {
      const vehiclesData = await adminApiService.getVehiclesByKeyAccount(keyAccountId)
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setVehicles([])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, quantity: value }))
    
    if (currentFuelPrice && value) {
      const totalPrice = Number(currentFuelPrice.price) * Number(value)
      setFormData(prev => ({ ...prev, price: totalPrice.toFixed(2) }))
    } else if (currentFuelPrice && !value) {
      setFormData(prev => ({ ...prev, price: Number(currentFuelPrice.price).toFixed(2) }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.stationId || !formData.quantity) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.clientType === 'key_account' && !formData.keyAccountId) {
      alert('Please select a key account')
      return
    }

    if (formData.clientType === 'key_account' && !formData.vehicleId) {
      alert('Please select a vehicle')
      return
    }

    if (!currentFuelPrice) {
      alert('No fuel price found for this station. Please set a fuel price first.')
      return
    }

    try {
      setSaving(true)
      
      // Create inventory ledger entry for the sale (OUT transaction)
      const referenceNumber = formData.clientType === 'key_account' 
        ? `SALE-KA-${formData.keyAccountId}-V-${formData.vehicleId}`
        : 'SALE-REGULAR'
      
      const notes = formData.clientType === 'key_account'
        ? `Sale to Key Account: ${keyAccounts.find(ka => ka.id === Number(formData.keyAccountId))?.name || 'Unknown'}, Vehicle: ${vehicles.find(v => v.id === Number(formData.vehicleId))?.registration_number || 'Unknown'}${formData.notes ? ` - ${formData.notes}` : ''}`
        : `Regular Sale${formData.notes ? ` - ${formData.notes}` : ''}`

      // Create inventory ledger entry
      await adminApiService.createInventoryLedger({
        stationId: Number(formData.stationId),
        transactionType: 'OUT',
        quantity: Number(formData.quantity),
        referenceNumber,
        notes,
        createdBy: formData.createdBy ? Number(formData.createdBy) : undefined
      })

      // Create sale record
      try {
        await adminApiService.createSale({
          stationId: Number(formData.stationId),
          clientType: formData.clientType,
          keyAccountId: formData.clientType === 'key_account' && formData.keyAccountId ? Number(formData.keyAccountId) : undefined,
          vehicleId: formData.clientType === 'key_account' && formData.vehicleId ? Number(formData.vehicleId) : undefined,
          quantity: Number(formData.quantity),
          unitPrice: Number(currentFuelPrice.price),
          totalAmount: Number(formData.price),
          saleDate: new Date().toISOString(),
          referenceNumber,
          notes: formData.notes || undefined,
          createdBy: formData.createdBy ? Number(formData.createdBy) : undefined
        })
        console.log('✅ [PostSale] Sale record created successfully')
      } catch (error) {
        console.error('❌ [PostSale] Error creating sale record:', error)
        // Don't fail the whole operation if sale record creation fails
      }

      // If key account sale, also create key account ledger entry
      console.log('💰 [PostSale] Checking if should create key account ledger:', {
        clientType: formData.clientType,
        isKeyAccount: formData.clientType === 'key_account',
        keyAccountId: formData.keyAccountId,
        hasKeyAccountId: !!formData.keyAccountId,
        hasFuelPrice: !!currentFuelPrice,
        currentFuelPrice: currentFuelPrice
      })
      
      if (formData.clientType === 'key_account' && formData.keyAccountId && currentFuelPrice) {
        try {
          console.log('💰 [PostSale] Creating key account ledger entry...', {
            keyAccountId: formData.keyAccountId,
            vehicleId: formData.vehicleId,
            stationId: formData.stationId,
            quantity: formData.quantity,
            unitPrice: currentFuelPrice.price,
            totalAmount: formData.price
          })
          const ledgerResult = await adminApiService.createKeyAccountLedger({
            keyAccountId: Number(formData.keyAccountId),
            vehicleId: formData.vehicleId ? Number(formData.vehicleId) : undefined,
            stationId: Number(formData.stationId),
            transactionDate: new Date().toISOString().split('T')[0],
            transactionType: 'SALE',
            quantity: Number(formData.quantity),
            unitPrice: Number(currentFuelPrice.price),
            totalAmount: Number(formData.price),
            referenceNumber,
            description: `Sale: ${Number(formData.quantity).toFixed(2)}L @ ${Number(currentFuelPrice.price).toFixed(2)} per liter`,
            notes: formData.notes || null,
            createdBy: formData.createdBy ? Number(formData.createdBy) : undefined
          })
          console.log('✅ [PostSale] Key account ledger entry created:', ledgerResult)
        } catch (error) {
          console.error('❌ [PostSale] Error creating key account ledger entry:', error)
          const errorMessage = (error as any)?.message || 'Unknown error'
          console.error('❌ [PostSale] Error details:', errorMessage)
          // Show error to user but don't fail the whole operation
          alert(`Warning: Sale posted but key account ledger entry failed: ${errorMessage}`)
        }
      }

      alert('Sale posted successfully!')
      
      // Reset form
      setFormData({
        stationId: '',
        clientType: 'regular',
        keyAccountId: '',
        vehicleId: '',
        quantity: '',
        price: '',
        notes: '',
        createdBy: ''
      })
      setCurrentFuelPrice(null)
      setVehicles([])
    } catch (error) {
      console.error('Error posting sale:', error)
      alert(`Failed to post sale: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate('/inventory')}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Inventory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-bold text-gray-900">Post Sale</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded border p-2">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Station Selection */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Station *
              </label>
              <select
                name="stationId"
                value={formData.stationId}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Station</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Type */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Client Type *
              </label>
              <select
                name="clientType"
                value={formData.clientType}
                onChange={handleChange}
                required
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="regular">Regular</option>
                <option value="key_account">Key Account</option>
              </select>
            </div>

            {/* Key Account Selection (if key account) */}
            {formData.clientType === 'key_account' && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Key Account *
                </label>
                <select
                  name="keyAccountId"
                  value={formData.keyAccountId}
                  onChange={handleChange}
                  required={formData.clientType === 'key_account'}
                  className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Key Account</option>
                  {keyAccounts
                    .filter(ka => ka.is_active === 1)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Vehicle Selection (if key account) */}
            {formData.clientType === 'key_account' && formData.keyAccountId && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Vehicle *
                </label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleChange}
                  required={formData.clientType === 'key_account'}
                  className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model} ({vehicle.driver_name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Quantity (Liters) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                required
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Unit Price (per Liter)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentFuelPrice ? Number(currentFuelPrice.price).toFixed(2) : 'N/A'}
                  readOnly
                  className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded bg-gray-50"
                />
                {!currentFuelPrice && (
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[9px] text-red-600">
                    No price set
                  </span>
                )}
              </div>
            </div>

            {/* Total Price */}
            {formData.quantity && currentFuelPrice && (
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Total Price
                </label>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-gray-600" />
                  <input
                    type="text"
                    value={formData.price}
                    readOnly
                    className="flex-1 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded bg-gray-50 font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Staff (Created By) */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Staff (Optional)
              </label>
              <select
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Staff</option>
                {staff.map((staffMember) => (
                  <option key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-1.5 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-2 py-1 text-[10px] border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !currentFuelPrice}
                className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-3 w-3" />
                {saving ? 'Posting...' : 'Post Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PostSale

