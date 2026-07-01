import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Part, Store, PartLedgerEntry } from '../services/api'
import {
  ChevronLeft, Loader2, Edit, Package, Tag, History,
  AlertCircle, CheckCircle2, X, MapPin, Building2,
  DollarSign, Hash, Layers, Activity, TrendingDown
} from 'lucide-react'

interface InventoryRow {
  id: number
  store_id: number
  part_id: number
  quantity: number
  min_stock_level?: number | null
  location?: string | null
  last_updated: string
  store?: Store
}

type Tab = 'overview' | 'stock' | 'usage'

function stockBadge(qty: number, min?: number | null) {
  if (qty === 0)                    return { label: 'Out of Stock', cls: 'bg-gray-100 text-gray-500',   icon: AlertCircle   }
  if (min != null && qty <= min)    return { label: 'Low Stock',    cls: 'bg-red-100 text-red-600',     icon: AlertCircle   }
  return                                   { label: 'In Stock',     cls: 'bg-green-100 text-green-700', icon: CheckCircle2  }
}

const PartDetails: React.FC = () => {
  const navigate  = useNavigate()
  const { partId } = useParams<{ partId: string }>()
  const [part, setPart]           = useState<Part | null>(null)
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [stores, setStores]       = useState<Store[]>([])
  const [ledger, setLedger]       = useState<PartLedgerEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => { if (partId) load(Number(partId)) }, [partId])

  const load = async (id: number) => {
    try {
      setLoading(true)
      const [allParts, partInvData, st, ledgerData] = await Promise.all([
        adminApiService.getParts(),
        adminApiService.getInventoryByPart(id),
        adminApiService.getStores(),
        adminApiService.getPartLedger(id),
      ])
      const found   = (Array.isArray(allParts)    ? allParts    : []).find((p: any) => p.id === id) ?? null
      const partInv = Array.isArray(partInvData) ? partInvData : []
      setPart(found)
      setInventory(partInv)
      setStores(Array.isArray(st) ? st : [])
      setLedger(Array.isArray(ledgerData) ? ledgerData : [])
    } catch (err) {
      console.error('PartDetails load error:', err)
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
    </div>
  )

  if (!part) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <button onClick={() => navigate('/inventory')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <p className="text-center text-sm text-gray-400 mt-16">Part not found.</p>
    </div>
  )

  const totalQty    = inventory.reduce((s, r) => s + r.quantity, 0)
  const lowStores   = inventory.filter(r => r.min_stock_level != null && r.quantity <= r.min_stock_level).length
  const sellingPrice = part.selling_price ?? part.unit_price ?? null
  const margin       = sellingPrice != null && part.purchase_cost != null
    ? Number(sellingPrice) - Number(part.purchase_cost) : null

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview',  icon: <Package className="h-3.5 w-3.5" /> },
    { id: 'stock',    label: 'Stock',     icon: <Layers className="h-3.5 w-3.5" />,  badge: ledger.length },
    { id: 'usage',    label: 'Usage',     icon: <Activity className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative text-white" style={{ backgroundColor: '#0b0f24' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,white 1px,transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative px-5 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/inventory')}
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Inventory
            </button>
            <button onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg transition-colors">
              <Edit className="h-3 w-3" /> Edit
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-white/80" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{part.part_number}</span>
              </div>
              <h1 className="text-base font-bold leading-tight truncate">{part.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {part.category && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15"><Tag className="h-2.5 w-2.5" />{part.category}</span>}
                {part.unit     && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">{part.unit}</span>}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  part.status === 'active'       ? 'bg-green-500/30 text-green-200' :
                  part.status === 'discontinued' ? 'bg-red-500/30 text-red-200'    : 'bg-white/10 text-white/60'
                }`}>{part.status ?? 'active'}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/15">
                  <Package className="h-2.5 w-2.5" />{totalQty} in stock
                </span>
                {lowStores > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/30 text-red-200">
                    <AlertCircle className="h-2.5 w-2.5" />{lowStores} low
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-gray-200 px-5">
        <div className="flex">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              {t.icon}{t.label}
              {t.badge !== undefined && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  activeTab === t.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">

        {/* ══ Overview ══ */}
        {activeTab === 'overview' && (
          <>
            {/* Main info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Part Information</h2>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-50">
                <InfoCell label="Part Number"  value={part.part_number}   mono />
                <InfoCell label="Name"         value={part.name} />
                <InfoCell label="Category"     value={part.category} />
                <InfoCell label="Unit"         value={part.unit} />
                <InfoCell label="Manufacturer" value={part.manufacturer} />
                <InfoCell label="Status"       value={part.status} />
                <InfoCell label="Alert Quantity" value={part.min_stock_level?.toString()} />
                {part.location && <InfoCell label="Default Location" value={part.location} />}
              </div>
            </div>

            {/* Pricing card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pricing</h2>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-50">
                <div className="px-4 py-4 text-center">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Purchase Cost</p>
                  <p className="text-base font-bold text-gray-900">
                    {part.purchase_cost != null ? `KES ${Number(part.purchase_cost).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="px-4 py-4 text-center">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Selling Price</p>
                  <p className="text-base font-bold text-gray-900">
                    {sellingPrice != null ? `KES ${Number(sellingPrice).toLocaleString()}` : '—'}
                  </p>
                </div>
                <div className="px-4 py-4 text-center">
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Margin</p>
                  <p className={`text-base font-bold ${margin != null ? (margin >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-300'}`}>
                    {margin != null ? `KES ${margin.toLocaleString()}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description / Notes */}
            {(part.description || part.notes) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes & Description</h2>
                </div>
                <div className="px-4 py-3 space-y-3">
                  {part.description && (
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium mb-1">Description</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{part.description}</p>
                    </div>
                  )}
                  {part.notes && (
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium mb-1">Internal Notes</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{part.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ Stock (ledger) ══ */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Current stock per store */}
            {inventory.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h2 className="text-xs font-semibold text-gray-700">Current Stock by Store</h2>
                  <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">{totalQty} {part.unit || 'units'}</span></span>
                </div>
                <div className="grid grid-cols-1 divide-y divide-gray-50">
                  {inventory.map(row => {
                    const store = stores.find(s => s.id === row.store_id)
                    const badge = stockBadge(row.quantity, row.min_stock_level)
                    const Icon  = badge.icon
                    return (
                      <div key={row.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{store?.store_name ?? `Store #${row.store_id}`}</p>
                            {row.location && <p className="text-[10px] text-gray-400 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{row.location}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{row.quantity} <span className="text-[10px] font-normal text-gray-400">{part.unit || 'units'}</span></p>
                            {row.min_stock_level != null && <p className="text-[10px] text-gray-400">min {row.min_stock_level}</p>}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badge.cls}`}>
                            <Icon className="h-3 w-3" />{badge.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ledger transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <h2 className="text-xs font-semibold text-gray-700">Transaction History</h2>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ledger.length} records</span>
              </div>

              {ledger.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <History className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400">No transactions recorded yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Store</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Qty</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Before</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">After</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ref</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {ledger.map(entry => {
                      const txColors: Record<string, string> = {
                        IN:           'bg-green-100 text-green-700',
                        OUT:          'bg-red-100 text-red-600',
                        ADJUSTMENT:   'bg-amber-100 text-amber-700',
                        TRANSFER_IN:  'bg-blue-100 text-blue-700',
                        TRANSFER_OUT: 'bg-purple-100 text-purple-700',
                      }
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-[10px] text-gray-500 whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${txColors[entry.transaction_type] ?? 'bg-gray-100 text-gray-600'}`}>
                              {entry.transaction_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">
                            {entry.store?.store_name ?? `Store #${entry.store_id}`}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs font-bold ${entry.transaction_type === 'OUT' || entry.transaction_type === 'TRANSFER_OUT' ? 'text-red-600' : 'text-green-600'}`}>
                              {entry.transaction_type === 'OUT' || entry.transaction_type === 'TRANSFER_OUT' ? '−' : '+'}{entry.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{entry.previous_quantity}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-gray-900">{entry.new_quantity}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{entry.reference_number || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-400 max-w-[160px] truncate">{entry.notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══ Usage ══ */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 text-center">
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Total In Stock</p>
                <p className="text-xl font-bold text-gray-900">{totalQty}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{part.unit || 'units'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 text-center">
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Stores Stocked</p>
                <p className="text-xl font-bold text-gray-900">{inventory.filter(r => r.quantity > 0).length}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">of {stores.length} stores</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 text-center">
                <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Low Stock</p>
                <p className={`text-xl font-bold ${lowStores > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStores}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">stores</p>
              </div>
            </div>

            {/* Stock value card */}
            {sellingPrice != null && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock Value</h2>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-50">
                  {part.purchase_cost != null && (
                    <div className="px-4 py-4">
                      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Cost Value</p>
                      <p className="text-base font-bold text-gray-900">
                        KES {(totalQty * Number(part.purchase_cost)).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{totalQty} × KES {Number(part.purchase_cost).toLocaleString()}</p>
                    </div>
                  )}
                  <div className="px-4 py-4">
                    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-1">Retail Value</p>
                    <p className="text-base font-bold text-green-600">
                      KES {(totalQty * Number(sellingPrice)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{totalQty} × KES {Number(sellingPrice).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage history placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Usage History</h2>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Coming soon</span>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <TrendingDown className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs font-medium text-gray-500">No usage records yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
                  Usage will be tracked automatically when this part is issued on a job card or sale
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {isEditOpen && (
        <EditPartModal part={part} onClose={() => setIsEditOpen(false)} onSaved={() => load(part.id)} />
      )}
    </div>
  )
}

/* ── Info cell ── */
const InfoCell: React.FC<{ label: string; value?: string | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="px-4 py-3">
    <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
    <p className={`text-xs leading-snug ${value ? 'text-gray-800' : 'text-gray-300'} ${mono ? 'font-mono font-semibold' : ''}`}>
      {value || '—'}
    </p>
  </div>
)

/* ── Edit modal ── */
interface EditPartModalProps { part: Part; onClose: () => void; onSaved: () => void }

const EditPartModal: React.FC<EditPartModalProps> = ({ part, onClose, onSaved }) => {
  const [form, setForm] = useState<Partial<Part>>({ ...part })
  const [saving, setSaving] = useState(false)
  const [cats, setCats] = useState<{ id: number; name: string; is_active: boolean }[]>([])

  useEffect(() => {
    adminApiService.getPartCategories().then((d: any) => setCats(d)).catch(() => setCats([]))
  }, [])

  const set = (k: keyof Part, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const { id, created_at, updated_at, stock_quantity, ...payload } = form as any
      await adminApiService.updatePart(part.id, payload)
      onSaved(); onClose()
    } catch (err: any) { alert(`Failed to save: ${err.message}`) }
    finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Edit Part</h2>
            <p className="text-xs text-gray-400 mt-0.5">{part.part_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Part Number *</label>
              <input className={inp} value={form.part_number || ''} required onChange={e => set('part_number', e.target.value)} /></div>
            <div><label className={lbl}>Name *</label>
              <input className={inp} value={form.name || ''} required onChange={e => set('name', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Category</label>
              <select className={inp} value={form.category || ''} onChange={e => set('category', e.target.value || null)}>
                <option value="">— Select —</option>
                {cats.filter(c => c.is_active).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select></div>
            <div><label className={lbl}>Unit</label>
              <select className={inp} value={form.unit || ''} onChange={e => set('unit', e.target.value || null)}>
                <option value="">— Select —</option>
                {['pcs','litres','kg','metres','box','set','pair','roll','sheet','can','bottle','drum','bag','carton'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Purchase Cost (KES)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.purchase_cost ?? ''} placeholder="0.00"
                onChange={e => set('purchase_cost', e.target.value ? Number(e.target.value) : null)} /></div>
            <div><label className={lbl}>Selling Price (KES)</label>
              <input type="number" step="0.01" min="0" className={inp} value={form.selling_price ?? ''} placeholder="0.00"
                onChange={e => set('selling_price', e.target.value ? Number(e.target.value) : null)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Status</label>
              <select className={inp} value={form.status || 'active'} onChange={e => set('status', e.target.value)}>
                {['active','inactive','discontinued'].map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className={lbl}>Alert Quantity</label>
              <input type="number" min="0" className={inp} value={form.min_stock_level ?? ''} placeholder="0"
                onChange={e => set('min_stock_level', e.target.value ? Number(e.target.value) : null)} /></div>
          </div>
          <div><label className={lbl}>Manufacturer</label>
            <input className={inp} value={form.manufacturer || ''} onChange={e => set('manufacturer', e.target.value || null)} /></div>
          <div><label className={lbl}>Description</label>
            <textarea rows={2} className={inp + ' resize-none'} value={form.description || ''}
              onChange={e => set('description', e.target.value || null)} /></div>
          <div><label className={lbl}>Notes</label>
            <textarea rows={2} className={inp + ' resize-none'} value={form.notes || ''}
              onChange={e => set('notes', e.target.value || null)} /></div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartDetails
