import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Part, Vendor, PurchaseOrder, POItem, Store } from '../services/api'
import {
  Plus, Search, Loader2, X, ChevronLeft, ChevronRight,
  ShoppingCart, Package, Building2, CalendarDays, Hash,
  CheckCircle2, Clock, XCircle, Send, Eye
} from 'lucide-react'

const STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  draft:     { cls: 'bg-gray-100 text-gray-600',    icon: <Clock className="h-3 w-3" />       },
  sent:      { cls: 'bg-blue-100 text-blue-700',    icon: <Send className="h-3 w-3" />        },
  received:  { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { cls: 'bg-red-100 text-red-600',      icon: <XCircle className="h-3 w-3" />     },
}

const PAGE_SIZE = 20

/* ────────────────────────────────────────────────────── */
const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate()
  const [orders, setOrders]       = useState<PurchaseOrder[]>([])
  const [loading, setLoading]     = useState(true)
  const [searchTerm, setSearch]   = useState('')
  const [page, setPage]           = useState(1)
  const [viewOrder, setViewOrder] = useState<PurchaseOrder | null>(null)

  useEffect(() => { fetch() }, [])

  const fetch = async () => {
    try { setLoading(true); setOrders(await adminApiService.getPurchaseOrders()) }
    catch { setOrders([]) } finally { setLoading(false) }
  }

const handleStatusChange = async (id: number, status: string, storeId?: number) => {
    if (storeId === undefined) await adminApiService.updatePOStatus(id, status)
    await fetch()
    setViewOrder(prev => prev?.id === id ? { ...prev, status: status as any } : prev)
  }

  const filtered = orders.filter(o => {
    const q = searchTerm.toLowerCase()
    return !q || o.po_number.toLowerCase().includes(q)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalValue = orders.reduce((s, o) => s + Number(o.total_amount), 0)
  const draftCount = orders.filter(o => o.status === 'draft').length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Purchase Orders</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">{orders.length} total</span>
              {draftCount > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] text-amber-300">{draftCount} draft</span>}
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">KES {totalValue.toLocaleString()}</span>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input type="text" placeholder="Search PO number…" value={searchTerm}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <button onClick={() => navigate('/purchase-orders/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap">
            <Plus className="h-3.5 w-3.5" /> New PO
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <ShoppingCart className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No purchase orders yet</p>
            <button onClick={() => navigate('/purchase-orders/new')} className="mt-3 text-xs text-green-600 hover:underline">Create your first PO →</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">PO Number</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vendor</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Order Date</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Items</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(o => {
                  const st = STATUS_STYLE[o.status] ?? STATUS_STYLE.draft
                  return (
                    <tr key={o.id} className="group hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setViewOrder(o)}>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">{o.po_number}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-gray-300 shrink-0" />
                          Vendor #{o.vendor_id}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1"><CalendarDays className="h-3 w-3 text-gray-300" />
                          {new Date(o.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{o.items?.length ?? 0} items</td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-900 whitespace-nowrap">
                        KES {Number(o.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>
                          {st.icon}{o.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewOrder(o)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">Showing {(safePage-1)*PAGE_SIZE+1}–{Math.min(safePage*PAGE_SIZE,filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={safePage===1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({length:totalPages},(_,i)=>i+1)
                .filter(n=>n===1||n===totalPages||Math.abs(n-safePage)<=1)
                .reduce<(number|'…')[]>((acc,n,i,a)=>{if(i>0&&n-(a[i-1] as number)>1)acc.push('…');acc.push(n);return acc},[])
                .map((n,i)=>n==='…'?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  :<button key={n} onClick={()=>setPage(n as number)}
                    className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage===n?'bg-green-600 border-green-600 text-white font-semibold':'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{n}</button>)}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating button */}
      <button onClick={() => navigate('/purchase-orders/new')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40">
        <Plus className="h-5 w-5" />
      </button>

      {viewOrder && <PODetailDrawer order={viewOrder} onClose={() => setViewOrder(null)} onStatusChange={handleStatusChange} />}
    </div>
  )
}

/* ────────────────────────────────────────────────────── */
interface CreatePOFormProps { onClose: () => void; onCreated: () => void }

const CreatePOForm: React.FC<CreatePOFormProps> = ({ onClose, onCreated }) => {
  const [parts, setParts]       = useState<Part[]>([])
  const [vendors, setVendors]   = useState<Vendor[]>([])
  const [poNumber, setPONumber] = useState('')
  const [vendorId, setVendorId] = useState<number | ''>('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes]       = useState('')
  const [partSearch, setPartSearch] = useState('')
  const [cart, setCart]         = useState<{ part: Part; quantity: number; unit_price: number }[]>([])
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    Promise.all([adminApiService.getParts(), adminApiService.getVendors(), adminApiService.getNextPONumber()])
      .then(([p, v, n]) => { setParts(Array.isArray(p) ? p : []); setVendors(Array.isArray(v) ? v : []); setPONumber(n) })
  }, [])

  const filteredParts = useMemo(() =>
    parts.filter(p => !partSearch || p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.part_number.toLowerCase().includes(partSearch.toLowerCase()))
  , [parts, partSearch])

  const addToCart = (part: Part) => {
    if (cart.find(c => c.part.id === part.id)) return
    setCart(prev => [...prev, { part, quantity: 1, unit_price: Number(part.purchase_cost ?? part.unit_price ?? 0) }])
    setPartSearch('')
  }

  const updateCart = (partId: number, field: 'quantity' | 'unit_price', val: number) =>
    setCart(prev => prev.map(c => c.part.id === partId ? { ...c, [field]: val } : c))

  const removeFromCart = (partId: number) => setCart(prev => prev.filter(c => c.part.id !== partId))

  const subtotal = cart.reduce((s, c) => s + c.quantity * c.unit_price, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) { alert('Please select a vendor'); return }
    if (cart.length === 0) { alert('Add at least one part'); return }
    try {
      setSaving(true)
      await adminApiService.createPurchaseOrder({
        vendor_id: Number(vendorId),
        order_date: orderDate,
        expected_delivery_date: deliveryDate || null,
        notes: notes || null,
        status: 'draft',
        items: cart.map(c => ({ part_id: c.part.id, quantity: c.quantity, unit_price: c.unit_price, total_price: c.quantity * c.unit_price }))
      } as any)
      onCreated()
    } catch (err: any) { alert(`Failed: ${err.message}`) }
    finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">New Purchase Order</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{poNumber || '—'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* PO meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>PO Number</label>
              <input className={inp + ' bg-gray-50 text-gray-500'} value={poNumber} readOnly />
            </div>
            <div>
              <label className={lbl}>Vendor *</label>
              <select className={inp} value={vendorId} onChange={e => setVendorId(e.target.value ? Number(e.target.value) : '')} required>
                <option value="">— Select vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Order Date *</label>
              <input type="date" className={inp} value={orderDate} onChange={e => setOrderDate(e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Expected Delivery</label>
              <input type="date" className={inp} value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
          </div>

          {/* Part search */}
          <div>
            <label className={lbl}>Add Parts</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input className={inp + ' pl-9'} value={partSearch} placeholder="Search by name or part number…"
                onChange={e => setPartSearch(e.target.value)} />
            </div>
            {partSearch && filteredParts.length > 0 && (
              <div className="border border-gray-200 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg bg-white">
                {filteredParts.slice(0, 10).map(p => (
                  <button type="button" key={p.id} onClick={() => addToCart(p)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.part_number}</p>
                    </div>
                    <span className="text-[10px] text-green-600 font-medium">
                      {p.purchase_cost ? `KES ${Number(p.purchase_cost).toLocaleString()}` : 'No price'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                <ShoppingCart className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-semibold text-gray-700">Cart ({cart.length} items)</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase">Part</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase w-24">Qty</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase w-32">Unit Price</th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase">Total</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map(c => (
                    <tr key={c.part.id}>
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium text-gray-900">{c.part.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{c.part.part_number}</p>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" value={c.quantity}
                          onChange={e => updateCart(c.part.id, 'quantity', Math.max(1, Number(e.target.value)))}
                          className="w-20 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.01" value={c.unit_price}
                          onChange={e => updateCart(c.part.id, 'unit_price', Number(e.target.value))}
                          className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none" />
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                        KES {(c.quantity * c.unit_price).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeFromCart(c.part.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Total</td>
                    <td className="px-3 py-2 text-sm font-bold text-gray-900">KES {subtotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div>
            <label className={lbl}>Notes</label>
            <textarea rows={2} className={inp + ' resize-none'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-white shrink-0">
          <div className="text-sm">
            <span className="text-gray-500">Total: </span>
            <span className="font-bold text-gray-900">KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit as any} disabled={saving || cart.length === 0 || !vendorId}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Creating…' : 'Create PO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────── */
interface PODetailDrawerProps {
  order: PurchaseOrder
  onClose: () => void
  onStatusChange: (id: number, status: string, storeId?: number) => void
}

const PODetailDrawer: React.FC<PODetailDrawerProps> = ({ order, onClose, onStatusChange }) => {
  const [stores, setStores]           = useState<Store[]>([])
  const [pickingStore, setPickingStore] = useState(false)
  const [selectedStore, setSelectedStore] = useState<number | ''>('')
  const [updating, setUpdating]       = useState(false)

  useEffect(() => {
    adminApiService.getStores().then(s => setStores(Array.isArray(s) ? s : [])).catch(() => {})
  }, [])

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft:    ['sent', 'cancelled'],
    sent:     ['received', 'cancelled'],
    received: [],
    cancelled:[],
  }

  const handleAction = async (s: string) => {
    if (s === 'received' && !order.store_id) {
      setPickingStore(true)
      return
    }
    setUpdating(true)
    try { await onStatusChange(order.id, s) } finally { setUpdating(false) }
  }

  const confirmReceive = async () => {
    if (!selectedStore) { alert('Please select a receiving store'); return }
    setUpdating(true)
    try {
      await adminApiService.updatePOStatus(order.id, 'received', Number(selectedStore))
      onStatusChange(order.id, 'received')
      setPickingStore(false)
    } catch (e: any) { alert(e.message) }
    finally { setUpdating(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-end z-50">
      <div className="bg-white w-full sm:w-[480px] h-full max-h-screen overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0" style={{ backgroundColor: '#0b0f24' }}>
          <div>
            <p className="font-mono text-sm font-bold text-white">{order.po_number}</p>
            <p className="text-xs text-white/50 mt-0.5">Purchase Order</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* Store picker for receive */}
        {pickingStore && (
          <div className="mx-4 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-amber-800">Select receiving store</p>
            <p className="text-[11px] text-amber-700">Stock will be added to this store when you confirm.</p>
            <select
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
            >
              <option value="">— Select store —</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.store_name}{s.store_code ? ` (${s.store_code})` : ''}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setPickingStore(false)}
                className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmReceive} disabled={!selectedStore || updating}
                className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors">
                {updating ? 'Receiving…' : 'Confirm Receive'}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 px-5 py-4 space-y-4">
          {/* Status + actions */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[order.status]?.cls}`}>
              {STATUS_STYLE[order.status]?.icon}{order.status}
            </span>
            {!pickingStore && STATUS_TRANSITIONS[order.status]?.length > 0 && (
              <div className="flex gap-1.5">
                {STATUS_TRANSITIONS[order.status].map(s => (
                  <button key={s} onClick={() => handleAction(s)} disabled={updating}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors disabled:opacity-40 ${
                      s === 'cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}>
                    {updating ? '…' : `Mark as ${s}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">Vendor</span>
              <span className="text-xs font-semibold text-gray-900">#{order.vendor_id}</span>
            </div>
            {order.store_id && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500">Receiving Store</span>
                <span className="text-xs font-semibold text-gray-900">Store #{order.store_id}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">Order Date</span>
              <span className="text-xs font-semibold text-gray-900">
                {new Date(order.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            {order.expected_delivery_date && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500">Expected Delivery</span>
                <span className="text-xs font-semibold text-gray-900">
                  {new Date(order.expected_delivery_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-900">KES {Number(order.total_amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items ({order.items?.length ?? 0})</h3>
            <div className="space-y-2">
              {(order.items ?? []).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Package className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{item.part?.name ?? `Part #${item.part_id}`}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{item.part?.part_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900">KES {Number(item.total_price).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">{item.quantity} × KES {Number(item.unit_price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 px-4 py-3">
              <p className="text-[9px] font-medium text-amber-600 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PurchaseOrders
