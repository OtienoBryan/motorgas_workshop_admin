import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { adminApiService, ConversionClient, ConversionVehicle, Part, Service, JobCardItem, Staff, Store } from '../services/api'
import {
  ChevronLeft,
  User,
  Car,
  Search,
  X,
  Plus,
  Trash2,
  Loader2,
  StickyNote,
  Wrench,
  Package,
  Clock,
  Hash,
  CheckCircle2,
  UserCog,
  FileText,
  ArrowRightLeft,
} from 'lucide-react'

interface ItemDraft extends JobCardItem {
  key: string
}

export type JobStatus = 'open' | 'sent' | 'approved' | 'not_paid' | 'paid' | 'warranty' | 'special_order' | 'written_off' | 'voided'

export const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'sent', label: 'Sent' },
  { value: 'approved', label: 'Approved' },
  { value: 'not_paid', label: 'Not Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'special_order', label: 'Special Order' },
  { value: 'written_off', label: 'Written Off' },
  { value: 'voided', label: 'Voided' },
]

export const STATUS_STYLES: Record<JobStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  sent: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-violet-100 text-violet-700',
  not_paid: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  warranty: 'bg-amber-100 text-amber-700',
  special_order: 'bg-cyan-100 text-cyan-700',
  written_off: 'bg-gray-200 text-gray-600',
  voided: 'bg-gray-100 text-gray-400',
}

export const STATUS_LABELS: Record<JobStatus, string> = {
  open: 'Open',
  sent: 'Sent',
  approved: 'Approved',
  not_paid: 'Not Paid',
  paid: 'Paid',
  warranty: 'Warranty',
  special_order: 'Special Order',
  written_off: 'Written Off',
  voided: 'Voided',
}

export const ESTIMATE_STAGE_STATUSES: JobStatus[] = ['open', 'sent', 'approved']

type TaxOption = 'standard' | 'exempt' | 'zero'

const TAX_OPTIONS: { value: TaxOption; label: string; rate: number }[] = [
  { value: 'standard', label: '16%', rate: 16 },
  { value: 'exempt', label: 'Exempted', rate: 0 },
  { value: 'zero', label: 'Zero Rated', rate: 0 },
]

let keySeq = 0
const newKey = () => `item-${Date.now()}-${keySeq++}`

const JobCardForm: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id && id !== 'new'

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  const [clients, setClients] = useState<ConversionClient[]>([])
  const [vehicles, setVehicles] = useState<ConversionVehicle[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [technicians, setTechnicians] = useState<Staff[]>([])

  const [clientId, setClientId] = useState<number | null>(null)
  const [vehicleId, setVehicleId] = useState<number | null>(null)
  const [status, setStatus] = useState<JobStatus>('open')
  const [notes, setNotes] = useState('')
  const [taxOption, setTaxOption] = useState<TaxOption>('standard')
  const vatRate = TAX_OPTIONS.find(o => o.value === taxOption)?.rate ?? 0
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [otherCharges, setOtherCharges] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [items, setItems] = useState<ItemDraft[]>([])

  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false)
  const [partSearch, setPartSearch] = useState('')
  const [partDropdownOpen, setPartDropdownOpen] = useState(false)
  const [laborSearch, setLaborSearch] = useState('')
  const [laborDropdownOpen, setLaborDropdownOpen] = useState(false)

  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [converting, setConverting] = useState(false)
  const [updateInventoryChoice, setUpdateInventoryChoice] = useState(true)
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState('')

  const partRef = useRef<HTMLDivElement>(null)
  const laborRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    adminApiService.getConversionClients().then(setClients).catch(() => setClients([]))
    adminApiService.getParts().then(setParts).catch(() => setParts([]))
    adminApiService.getServices().then(setServices).catch(() => setServices([]))
    adminApiService.getStaff('technician').then(setTechnicians).catch(() => setTechnicians([]))
  }, [])

  useEffect(() => {
    if (isEditing) return
    const state = location.state as { clientId?: number; vehicleId?: number } | null
    if (state?.clientId) setClientId(state.clientId)
    if (state?.vehicleId) setVehicleId(state.vehicleId)
  }, [isEditing, location.state])

  useEffect(() => {
    if (!isEditing) return
    const fetchJobCard = async () => {
      try {
        setLoading(true)
        const jc = await adminApiService.getJobCard(Number(id))
        setClientId(jc.conversion_client_id ?? null)
        setVehicleId(jc.conversion_vehicle_id ?? null)
        setStatus(jc.status)
        setNotes(jc.notes || '')
        setTaxOption(Number(jc.vat_rate) === 16 ? 'standard' : 'zero')
        setDiscount(Number(jc.discount))
        setOtherCharges(Number(jc.other_charges))
        setAmountPaid(Number(jc.amount_paid))
        setItems((jc.items || []).map(i => ({ ...i, key: newKey() })))
      } catch {
        alert('Failed to load job card')
        navigate('/job-cards')
      } finally {
        setLoading(false)
      }
    }
    fetchJobCard()
  }, [id, isEditing])

  useEffect(() => {
    if (!clientId) { setVehicles([]); return }
    adminApiService.getConversionVehiclesByClient(clientId).then(setVehicles).catch(() => setVehicles([]))
  }, [clientId])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (partRef.current && !partRef.current.contains(e.target as Node)) setPartDropdownOpen(false)
      if (laborRef.current && !laborRef.current.contains(e.target as Node)) setLaborDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selectedClient = clients.find(c => c.id === clientId) || null
  const selectedVehicle = vehicles.find(v => v.id === vehicleId) || null

  const filteredParts = useMemo(() => {
    const q = partSearch.toLowerCase()
    if (!q) return parts.slice(0, 20)
    return parts.filter(p => p.name.toLowerCase().includes(q) || p.part_number.toLowerCase().includes(q)).slice(0, 20)
  }, [parts, partSearch])

  const filteredServices = useMemo(() => {
    const q = laborSearch.toLowerCase()
    if (!q) return services.slice(0, 20)
    return services.filter(s => s.title.toLowerCase().includes(q)).slice(0, 20)
  }, [services, laborSearch])

  const addPartItem = (part: Part) => {
    setItems(prev => [...prev, {
      key: newKey(),
      item_type: 'part',
      part_id: part.id,
      description: part.name,
      cost: part.unit_price || 0,
      price: part.selling_price ?? part.unit_price ?? 0,
      quantity: 1,
      taxable: 1,
      amount: part.selling_price ?? part.unit_price ?? 0,
    }])
    setPartSearch('')
    setPartDropdownOpen(false)
  }

  const addCustomPartItem = () => {
    const key = newKey()
    setItems(prev => [...prev, {
      key, item_type: 'part', description: '', cost: 0, price: 0, quantity: 1, taxable: 1, amount: 0
    }])
    requestAnimationFrame(() => {
      const el = document.getElementById(`part-desc-${key}`) as HTMLInputElement | null
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus()
    })
  }

  const addLaborItem = (service: Service) => {
    setItems(prev => [...prev, {
      key: newKey(),
      item_type: 'labor',
      service_id: service.id,
      description: service.title,
      cost: 0,
      price: service.rate,
      quantity: 1,
      taxable: 0,
      amount: service.rate,
    }])
    setLaborSearch('')
    setLaborDropdownOpen(false)
  }

  const addCustomLaborItem = () => {
    const key = newKey()
    setItems(prev => [...prev, {
      key, item_type: 'labor', description: '', cost: 0, price: 0, quantity: 1, taxable: 0, amount: 0
    }])
    requestAnimationFrame(() => {
      const el = document.getElementById(`labor-desc-${key}`) as HTMLInputElement | null
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus()
    })
  }

  const updateItem = (key: string, patch: Partial<ItemDraft>) => {
    setItems(prev => prev.map(it => {
      if (it.key !== key) return it
      const next = { ...it, ...patch }
      next.amount = Number(next.price || 0) * Number(next.quantity || 0)
      return next
    }))
  }

  const removeItem = (key: string) => setItems(prev => prev.filter(it => it.key !== key))

  const partItems = items.filter(i => i.item_type === 'part')
  const laborItems = items.filter(i => i.item_type === 'labor')

  const subtotal = items.reduce((s, i) => s + Number(i.amount || 0), 0)
  const taxableSubtotal = items.filter(i => i.taxable !== 0).reduce((s, i) => s + Number(i.amount || 0), 0)
  const vatAmount = taxableSubtotal * (vatRate / 100)
  const discountAmount = discountType === 'percentage' ? subtotal * (discount / 100) : discount
  const total = subtotal + vatAmount - discountAmount + otherCharges

  const profitFromParts = partItems.reduce((s, i) => s + (Number(i.price || 0) - Number(i.cost || 0)) * Number(i.quantity || 0), 0)
  const profitFromLabor = laborItems.reduce((s, i) => s + Number(i.amount || 0), 0)
  const profit = profitFromParts + profitFromLabor - discountAmount
  const balanceDue = total - amountPaid

  const handleSave = async () => {
    if (!clientId) { alert('Please select a client'); return }
    try {
      setSaving(true)
      const payload = {
        conversion_client_id: clientId,
        conversion_vehicle_id: vehicleId ?? undefined,
        status,
        vat_enabled: 1,
        vat_rate: vatRate,
        discount: discountAmount,
        other_charges: otherCharges,
        amount_paid: amountPaid,
        notes: notes || undefined,
        items: items.map(({ key, part, service, assignedStaff, id: _id, job_card_id, created_at, ...rest }) => rest),
      }
      if (isEditing) {
        await adminApiService.updateJobCard(Number(id), payload)
      } else {
        const created = await adminApiService.createJobCard(payload)
        navigate(`/job-cards/${created.id}`, { replace: true })
      }
      alert(isEditing ? 'Job card saved successfully' : 'Quote saved successfully')
    } catch (error) {
      alert(`Failed to save job card: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const openConvertModal = () => {
    setUpdateInventoryChoice(true)
    setSelectedStoreId('')
    setConvertModalOpen(true)
    if (stores.length === 0) {
      setLoadingStores(true)
      adminApiService.getStores().then(setStores).catch(() => setStores([])).finally(() => setLoadingStores(false))
    }
  }

  const handleConvertToInvoice = async () => {
    if (!id) return
    const shouldUpdateInventory = updateInventoryChoice && partItems.length > 0
    if (shouldUpdateInventory && !selectedStoreId) {
      alert('Please select a store to deduct inventory from')
      return
    }
    try {
      setConverting(true)
      const updated = await adminApiService.convertJobCardToInvoice(Number(id), {
        update_inventory: shouldUpdateInventory,
        store_id: shouldUpdateInventory ? Number(selectedStoreId) : undefined,
      })
      setStatus(updated.status)
      setConvertModalOpen(false)
      alert('Converted to invoice successfully')
    } catch (error) {
      alert(`Failed to convert to invoice: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setConverting(false)
    }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'
  const money = (n: number) => `Ksh${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Still a quotation until converted to an invoice
  const isQuotation = ESTIMATE_STAGE_STATUSES.includes(status)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="text-white px-5 py-3 flex items-center gap-3" style={{ backgroundColor: '#0b0f24' }}>
        <button
          onClick={() => navigate('/job-cards')}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-bold flex-1">
          {!isEditing ? 'New Quotation' : isQuotation ? `Quotation #${id}` : `Invoice #${id}`}
        </h1>
        {isEditing && isQuotation && (
          <button
            onClick={openConvertModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Convert to Invoice
          </button>
        )}
        {isEditing && (
          <button
            onClick={() => navigate(`/job-cards/${id}/invoice`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="h-3.5 w-3.5" />
            {isQuotation ? 'View Quotation' : 'View Invoice'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-5 py-4">

        {/* ── Main column ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Client + Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setClientPickerOpen(o => !o)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:border-green-300 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {selectedClient ? selectedClient.name : 'Select Client'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {selectedClient ? (selectedClient.contact || selectedClient.email || 'View details') : 'Add customer to this record'}
                  </p>
                </div>
              </button>
              {clientPickerOpen && (
                <PickerDropdown
                  items={clients}
                  getLabel={c => c.name}
                  getSub={c => c.contact || c.email || ''}
                  onSelect={c => { setClientId(c.id); setVehicleId(null); setClientPickerOpen(false) }}
                  onClose={() => setClientPickerOpen(false)}
                />
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => clientId && setVehiclePickerOpen(o => !o)}
                disabled={!clientId}
                className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 hover:border-green-300 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {selectedVehicle ? selectedVehicle.registration_number : 'Select Vehicle'}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {selectedVehicle
                      ? [selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')
                      : clientId ? 'Add vehicle to this record' : 'Select a client first'}
                  </p>
                </div>
              </button>
              {vehiclePickerOpen && (
                <PickerDropdown
                  items={vehicles}
                  getLabel={v => v.registration_number}
                  getSub={v => [v.year, v.make, v.model].filter(Boolean).join(' ')}
                  onSelect={v => { setVehicleId(v.id); setVehiclePickerOpen(false) }}
                  onClose={() => setVehiclePickerOpen(false)}
                  emptyLabel="No vehicles for this client"
                />
              )}
            </div>
          </div>

          {/* Parts and Labor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Parts and Labor</h2>

            {/* Parts */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Parts</span>
                  {partItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">{partItems.length}</span>
                  )}
                </div>
                {partItems.length > 0 && (
                  <span className="text-xs font-semibold text-gray-700">
                    Ksh {partItems.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>

              {partItems.length > 0 ? (
                <div className="rounded-xl border border-gray-100 overflow-hidden mb-3">
                  <div className="overflow-x-auto">
                    <div className="min-w-[850px]">
                      <div className="grid grid-cols-[1fr_100px_100px_72px_90px_110px_160px_36px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Description</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Cost</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Price</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Qty</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Taxable</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Amount</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Assigned To</span>
                        <span></span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {partItems.map(item => (
                          <div key={item.key} className="grid grid-cols-[1fr_100px_100px_72px_90px_110px_160px_36px] gap-2 px-3 py-2 items-center hover:bg-gray-50/60 transition-colors">
                            <input id={`part-desc-${item.key}`} value={item.description} onChange={e => updateItem(item.key, { description: e.target.value })}
                              className="w-full text-xs font-medium text-gray-800 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none"
                              placeholder="Part description" />
                            <span className="text-xs text-gray-400 text-right">
                              {item.cost ? `${Number(item.cost).toLocaleString()}` : '—'}
                            </span>
                            <input type="number" min="0" step="0.01" value={item.price}
                              onChange={e => updateItem(item.key, { price: Number(e.target.value) || 0 })}
                              className="w-full text-xs text-right border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none" />
                            <input type="number" min="0" step="1" value={item.quantity}
                              onChange={e => updateItem(item.key, { quantity: Number(e.target.value) || 0 })}
                              className="w-full text-xs text-right border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none" />
                            <select value={item.taxable ?? 1}
                              onChange={e => updateItem(item.key, { taxable: Number(e.target.value) })}
                              className="w-full text-xs border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none">
                              <option value={1}>True</option>
                              <option value={0}>False</option>
                            </select>
                            <span className="text-xs font-semibold text-gray-900 text-right whitespace-nowrap">
                              Ksh {Number(item.amount).toLocaleString()}
                            </span>
                            <StaffAssignSelect item={item} technicians={technicians} updateItem={updateItem} />
                            <button onClick={() => removeItem(item.key)}
                              className="justify-self-end p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-4 text-center mb-3">
                  <p className="text-xs text-gray-400">No parts added yet</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative flex-1" ref={partRef}>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    value={partSearch}
                    onChange={e => { setPartSearch(e.target.value); setPartDropdownOpen(true) }}
                    onFocus={() => setPartDropdownOpen(true)}
                    placeholder="Select from inventory…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  {partDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 max-h-56 overflow-y-auto">
                      {filteredParts.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-400">No parts found</p>
                      ) : filteredParts.map(p => (
                        <button key={p.id} type="button" onClick={() => addPartItem(p)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                          <p className="text-xs font-medium text-gray-800">{p.name}</p>
                          <p className="text-[10px] text-gray-400">{p.part_number} · KES {Number(p.selling_price ?? p.unit_price ?? 0).toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={addCustomPartItem}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5" /> New part
                </button>
              </div>
            </div>

            {/* Labor */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Wrench className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Labor</span>
                  {laborItems.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-500">{laborItems.length}</span>
                  )}
                </div>
                {laborItems.length > 0 && (
                  <span className="text-xs font-semibold text-gray-700">
                    Ksh {laborItems.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>

              {laborItems.length > 0 ? (
                <div className="rounded-xl border border-gray-100 overflow-hidden mb-3">
                  <div className="overflow-x-auto">
                    <div className="min-w-[770px]">
                      <div className="grid grid-cols-[1fr_100px_84px_90px_110px_160px_36px] gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Description</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Rate</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Hrs/Qty</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Taxable</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center text-right">Amount</span>
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide self-center">Assigned To</span>
                        <span></span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {laborItems.map(item => (
                          <div key={item.key} className="grid grid-cols-[1fr_100px_84px_90px_110px_160px_36px] gap-2 px-3 py-2 items-center hover:bg-gray-50/60 transition-colors">
                            <input id={`labor-desc-${item.key}`} value={item.description} onChange={e => updateItem(item.key, { description: e.target.value })}
                              className="w-full text-xs font-medium text-gray-800 border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none"
                              placeholder="Labor description" />
                            <input type="number" min="0" step="0.01" value={item.price}
                              onChange={e => updateItem(item.key, { price: Number(e.target.value) || 0 })}
                              className="w-full text-xs text-right border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none" />
                            <input type="number" min="0" step="0.5" value={item.quantity}
                              onChange={e => updateItem(item.key, { quantity: Number(e.target.value) || 0 })}
                              className="w-full text-xs text-right border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none" />
                            <select value={item.taxable ?? 0}
                              onChange={e => updateItem(item.key, { taxable: Number(e.target.value) })}
                              className="w-full text-xs border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent rounded-lg px-2 py-1.5 outline-none">
                              <option value={1}>True</option>
                              <option value={0}>False</option>
                            </select>
                            <span className="text-xs font-semibold text-gray-900 text-right whitespace-nowrap">
                              Ksh {Number(item.amount).toLocaleString()}
                            </span>
                            <StaffAssignSelect item={item} technicians={technicians} updateItem={updateItem} />
                            <button onClick={() => removeItem(item.key)}
                              className="justify-self-end p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-4 text-center mb-3">
                  <p className="text-xs text-gray-400">No labor added yet</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="relative flex-1" ref={laborRef}>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    value={laborSearch}
                    onChange={e => { setLaborSearch(e.target.value); setLaborDropdownOpen(true) }}
                    onFocus={() => setLaborDropdownOpen(true)}
                    placeholder="Select from services…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  {laborDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 max-h-56 overflow-y-auto">
                      {filteredServices.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-gray-400">No services found</p>
                      ) : filteredServices.map(s => (
                        <button key={s.id} type="button" onClick={() => addLaborItem(s)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                          <p className="text-xs font-medium text-gray-800">{s.title}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            {s.pricing_type === 'hourly' ? <Clock className="h-2.5 w-2.5" /> : <Hash className="h-2.5 w-2.5" />}
                            KES {Number(s.rate).toLocaleString()}{s.pricing_type === 'hourly' ? '/hr' : ''}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={addCustomLaborItem}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5" /> New labor
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2.5">
              <StickyNote className="h-3.5 w-3.5 text-green-600" />
              Notes
            </div>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className={inp + ' resize-none'} placeholder="Job notes, diagnosis findings, instructions…"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Quotation'}
          </button>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">{!isEditing || isQuotation ? 'Quotation' : 'Invoice'}</p>
                <p className="text-lg font-bold text-gray-900">{isEditing ? `#${id}` : 'New'}</p>
              </div>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as typeof status)}
                className="text-xs font-medium px-2.5 py-1 rounded-full border-0 bg-blue-50 text-blue-700 outline-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {selectedClient && (
              <div className="text-xs text-gray-500 space-y-0.5 pt-2 border-t border-gray-50">
                <p className="flex items-center gap-1.5"><User className="h-3 w-3" /> {selectedClient.name}</p>
                {selectedVehicle && <p className="flex items-center gap-1.5"><Car className="h-3 w-3" /> {selectedVehicle.registration_number}</p>}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Subtotal</p>
            <p className="text-xl font-bold text-gray-900 mb-3">{money(subtotal)}</p>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-600">Tax</span>
              <select value={taxOption} onChange={e => setTaxOption(e.target.value as TaxOption)}
                className="text-xs px-2 py-1 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                {TAX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="text-[10px] text-gray-400">— applies to items marked Taxable</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">VAT ({vatRate}%, Exclusive)</span>
                <span className="text-gray-700">{money(vatAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                  Discount
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                    className="text-[10px] px-1 py-0.5 border border-gray-200 rounded outline-none">
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">%</option>
                  </select>
                </span>
                <input type="number" min="0" step="0.01" value={discount}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-24 text-xs text-right px-1.5 py-0.5 border border-gray-200 rounded" />
              </div>
              {discountType === 'percentage' && discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">= {discount}% of subtotal</span>
                  <span className="text-gray-400 text-[10px]">{money(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Other Charges</span>
                <input type="number" min="0" step="0.01" value={otherCharges}
                  onChange={e => setOtherCharges(Number(e.target.value) || 0)}
                  className="w-24 text-xs text-right px-1.5 py-0.5 border border-gray-200 rounded" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-sm font-bold text-gray-900">{money(total)}</span>
            </div>

            <div className="space-y-1.5 text-xs pt-3 mt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Profit from Parts</span>
                <span className="text-gray-700">{money(profitFromParts)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Profit from Labor (100%)</span>
                <span className="text-gray-700">{money(profitFromLabor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Discount Subtraction</span>
                <span className="text-red-500">-{money(discountAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-50">
                <span className="font-semibold text-gray-900">Profit</span>
                <span className="font-bold text-green-600">{money(profit)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Payments</p>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500">Amount Paid</span>
              <input type="number" min="0" step="0.01" value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value) || 0)}
                className="w-24 text-xs text-right px-1.5 py-0.5 border border-gray-200 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">Balance Due</span>
              <span className={`text-sm font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{money(balanceDue)}</span>
            </div>
          </div>

          {/* Convert to invoice */}
          {isEditing && isQuotation && (
            <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-green-600" />
                </div>
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Convert to Invoice</p>
              </div>
              <p className="text-[11px] text-gray-500 mb-3">
                Turn this quotation into an invoice. You'll choose whether to deduct the parts from stock.
              </p>
              <button
                onClick={openConvertModal}
                className="w-full py-2.5 text-xs font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Convert to Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Convert to invoice modal ── */}
      {convertModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">Convert to Invoice</h2>
              </div>
              <button onClick={() => setConvertModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <p className="text-xs text-gray-500">
                This will change the status to <span className="font-medium text-gray-700">Not Paid</span> and mark it as an invoice.
              </p>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Update inventory?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdateInventoryChoice(true)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      updateInventoryChoice
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Yes, deduct stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpdateInventoryChoice(false)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      !updateInventoryChoice
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </button>
                </div>
                {updateInventoryChoice && partItems.length === 0 && (
                  <p className="text-[10px] text-gray-400 mt-1.5">No parts on this job card — nothing to deduct.</p>
                )}
              </div>

              {updateInventoryChoice && partItems.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deduct from store *</label>
                  <select
                    value={selectedStoreId}
                    onChange={e => setSelectedStoreId(e.target.value)}
                    disabled={loadingStores}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="">{loadingStores ? 'Loading stores…' : 'Select a store'}</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.store_name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {partItems.length} part{partItems.length === 1 ? '' : 's'} will be deducted and logged to the inventory ledger.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setConvertModalOpen(false)} disabled={converting}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleConvertToInvoice} disabled={converting}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {converting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {converting ? 'Converting…' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Search/select dropdown for client/vehicle cards ── */
interface PickerDropdownProps<T> {
  items: T[]
  getLabel: (item: T) => string
  getSub: (item: T) => string
  onSelect: (item: T) => void
  onClose: () => void
  emptyLabel?: string
}

function PickerDropdown<T extends { id: number }>({ items, getLabel, getSub, onSelect, onClose, emptyLabel }: PickerDropdownProps<T>) {
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  const filtered = items.filter(i => getLabel(i).toLowerCase().includes(query.toLowerCase()))

  return (
    <div ref={ref} className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="p-2 border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search…" onClick={e => e.stopPropagation()}
            className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-3 text-xs text-gray-400 text-center">{emptyLabel || 'No results'}</p>
        ) : filtered.map(item => (
          <button key={item.id} type="button" onClick={() => onSelect(item)}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-center justify-between group">
            <div>
              <p className="text-xs font-medium text-gray-800">{getLabel(item)}</p>
              <p className="text-[10px] text-gray-400">{getSub(item)}</p>
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 text-transparent group-hover:text-green-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Assign technician to a line item ── */
interface StaffAssignSelectProps {
  item: ItemDraft
  technicians: Staff[]
  updateItem: (key: string, patch: Partial<ItemDraft>) => void
}

const StaffAssignSelect: React.FC<StaffAssignSelectProps> = ({ item, technicians, updateItem }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const staffId = e.target.value ? Number(e.target.value) : null
    updateItem(item.key, {
      assigned_staff_id: staffId,
      assigned_at: staffId ? new Date().toISOString() : null,
    })
  }

  const isAssigned = !!item.assigned_staff_id

  return (
    <div>
      <div className="relative">
        <UserCog className={`absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none ${isAssigned ? 'text-green-600' : 'text-gray-400'}`} />
        <select
          value={item.assigned_staff_id ?? ''}
          onChange={handleChange}
          className={`w-full pl-6 pr-1.5 py-1.5 text-[11px] rounded-lg outline-none border transition-colors ${
            isAssigned
              ? 'border-green-200 bg-green-50 text-green-800 font-medium focus:ring-2 focus:ring-green-500'
              : 'border-gray-200 text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent'
          }`}
        >
          <option value="">Unassigned</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      {isAssigned && item.assigned_at && (
        <p className="text-[9px] text-gray-400 pl-1 mt-0.5">
          Assigned {new Date(item.assigned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  )
}

export default JobCardForm
