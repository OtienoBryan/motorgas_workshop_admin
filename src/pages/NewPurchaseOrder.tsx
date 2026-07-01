import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Part, Vendor, Store } from '../services/api'
import {
  ChevronLeft, Search, ShoppingCart, Plus, Minus, Trash2,
  Package, Loader2, CheckCircle2, CalendarDays, Building2,
  ChevronDown, StickyNote, X
} from 'lucide-react'

interface CartItem {
  part: Part
  quantity: number
  unit_price: number
}

const NewPurchaseOrder: React.FC = () => {
  const navigate = useNavigate()

  const [parts, setParts]       = useState<Part[]>([])
  const [vendors, setVendors]   = useState<Vendor[]>([])
  const [stores, setStores]     = useState<Store[]>([])
  const [poNumber, setPONumber] = useState('')
  const [loading, setLoading]   = useState(true)

  const [vendorId, setVendorId]   = useState<number | ''>('')
  const [storeId, setStoreId]     = useState<number | ''>('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDelivery] = useState('')
  const [notes, setNotes]         = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const [cart, setCart]         = useState<CartItem[]>([])
  const [partSearch, setPartSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      adminApiService.getParts(),
      adminApiService.getVendors(),
      adminApiService.getStores(),
      adminApiService.getNextPONumber(),
    ]).then(([p, v, s, n]) => {
      setParts(Array.isArray(p) ? p : [])
      setVendors(Array.isArray(v) ? v : [])
      setStores(Array.isArray(s) ? s : [])
      setPONumber(n)
    }).finally(() => setLoading(false))
  }, [])

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setPartSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredParts = useMemo(() => {
    if (!partSearch) return parts.slice(0, 20)
    const q = partSearch.toLowerCase()
    return parts.filter(p =>
      p.name.toLowerCase().includes(q) || p.part_number.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [parts, partSearch])

  const addToCart = (part: Part) => {
    setCart(prev => {
      const existing = prev.find(c => c.part.id === part.id)
      if (existing) return prev.map(c => c.part.id === part.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { part, quantity: 1, unit_price: Number(part.purchase_cost ?? part.unit_price ?? 0) }]
    })
    setDropdownOpen(false)
    setPartSearch('')
  }

  const setQty   = (id: number, qty: number) => {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(c => c.part.id === id ? { ...c, quantity: qty } : c))
  }
  const setPrice = (id: number, price: number) =>
    setCart(prev => prev.map(c => c.part.id === id ? { ...c, unit_price: price } : c))
  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.part.id !== id))

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0)

  const handleSubmit = async () => {
    if (!vendorId) { alert('Select a vendor'); return }
    if (!cart.length) { alert('Add at least one part'); return }
    try {
      setSaving(true)
      await adminApiService.createPurchaseOrder({
        vendor_id: Number(vendorId),
        store_id: storeId ? Number(storeId) : null,
        order_date: orderDate,
        expected_delivery_date: deliveryDate || null,
        notes: notes || null,
        status: 'draft',
        items: cart.map(c => ({ part_id: c.part.id, quantity: c.quantity, unit_price: c.unit_price, total_price: c.quantity * c.unit_price }))
      } as any)
      navigate('/purchase-orders')
    } catch (err: any) { alert(`Failed: ${err.message}`) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
    </div>
  )

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white'
  const lbl = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 h-12 flex items-center justify-between px-5 text-white shadow-lg" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase-orders')}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-white/20 text-lg">|</span>
          <span className="text-sm font-semibold">New Purchase Order</span>
          <span className="font-mono text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70">{poNumber}</span>
        </div>
        <button onClick={handleSubmit} disabled={saving || !cart.length || !vendorId}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? 'Creating…' : 'Create PO'}
        </button>
      </div>

      <div className="px-5 py-6 space-y-4">

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Order Details</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* PO Number */}
            <div>
              <label className={lbl}>PO Number</label>
              <input value={poNumber} readOnly
                className={inp + ' bg-gray-50 text-gray-500 cursor-not-allowed font-mono'} />
            </div>

            {/* Vendor */}
            <div>
              <label className={lbl}>Vendor *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select value={vendorId} onChange={e => setVendorId(e.target.value ? Number(e.target.value) : '')}
                  className={inp + ' pl-9 appearance-none'} required>
                  <option value="">Select vendor…</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Receiving store */}
            <div className="col-span-2">
              <label className={lbl}>Receiving Store *</label>
              <p className="text-[10px] text-amber-600 mb-1">Stock will be added to this store when PO is marked as received</p>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <select value={storeId} onChange={e => setStoreId(e.target.value ? Number(e.target.value) : '')}
                  className={inp + ' pl-9 appearance-none'}>
                  <option value="">Select receiving store…</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}{s.store_code ? ` (${s.store_code})` : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Order date */}
            <div>
              <label className={lbl}>Order Date *</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)}
                  className={inp + ' pl-9'} required />
              </div>
            </div>

            {/* Delivery date */}
            <div>
              <label className={lbl}>Expected Delivery</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input type="date" value={deliveryDate} onChange={e => setDelivery(e.target.value)}
                  className={inp + ' pl-9'} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Items card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Items</span>
              {cart.length > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[10px] text-red-400 hover:text-red-600 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <div className="p-5 space-y-3">
            {/* Searchable part dropdown */}
            <div ref={dropdownRef} className="relative">
              <label className={lbl}>Add Part</label>
              <div
                className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl cursor-text bg-white hover:border-green-400 transition-colors"
                onClick={() => { setDropdownOpen(true); setTimeout(() => searchRef.current?.focus(), 0) }}>
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={partSearch}
                  onChange={e => { setPartSearch(e.target.value); setDropdownOpen(true) }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search by name or part number…"
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                />
                {partSearch && (
                  <button onClick={() => { setPartSearch(''); setDropdownOpen(false) }} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown results */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  {filteredParts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No parts found</div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                      {filteredParts.map(p => {
                        const inCart = cart.some(c => c.part.id === p.id)
                        return (
                          <button key={p.id} type="button" onClick={() => addToCart(p)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left transition-colors ${inCart ? 'bg-green-50' : ''}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${inCart ? 'bg-green-100' : 'bg-gray-100'}`}>
                                <Package className={`h-3.5 w-3.5 ${inCart ? 'text-green-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{p.part_number}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-xs font-semibold text-green-700">
                                {p.purchase_cost ? `KES ${Number(p.purchase_cost).toLocaleString()}` : '—'}
                              </p>
                              {inCart && <p className="text-[10px] text-green-500">In cart</p>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart table */}
            {cart.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden mt-2">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Part</th>
                      <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-32">Quantity</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-36">Unit Price</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide w-32">Total</th>
                      <th className="px-4 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cart.map(item => (
                      <tr key={item.part.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-900">{item.part.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.part.part_number}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setQty(item.part.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                              <Minus className="h-3 w-3 text-gray-600" />
                            </button>
                            <input type="number" min="1" value={item.quantity}
                              onChange={e => setQty(item.part.id, Number(e.target.value))}
                              className="w-12 text-center text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg py-0.5 outline-none focus:ring-1 focus:ring-green-500" />
                            <button onClick={() => setQty(item.part.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                              <Plus className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium">KES</span>
                            <input type="number" min="0" step="0.01" value={item.unit_price}
                              onChange={e => setPrice(item.part.id, Number(e.target.value))}
                              className="w-full pl-9 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-gray-900">
                            KES {(item.quantity * item.unit_price).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeFromCart(item.part.id)}
                            className="p-1 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Search for parts above to add them</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button onClick={() => setShowNotes(v => !v)}
            className="flex items-center justify-between w-full px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-gray-400" />
              Notes
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showNotes ? 'rotate-180' : ''}`} />
          </button>
          {showNotes && (
            <div className="px-5 pb-5">
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes about this purchase order…"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none" />
            </div>
          )}
        </div>

        {/* ── Summary + Submit ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-16">
                <span className="text-sm text-gray-500">Items</span>
                <span className="text-sm text-gray-700">{cart.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm font-semibold text-gray-800">KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                <span className="text-base font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-green-700">KES {subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving || !cart.length || !vendorId}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              : <><CheckCircle2 className="h-4 w-4" /> Create Purchase Order</>}
          </button>
        </div>

      </div>
    </div>
  )
}

export default NewPurchaseOrder
