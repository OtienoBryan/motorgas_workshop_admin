import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Vendor } from '../services/api'
import {
  Plus, Search, Edit, Trash2, Loader2, X,
  ChevronLeft, ChevronRight, Building2,
  Mail, Phone, User, CreditCard, DollarSign, BookOpen
} from 'lucide-react'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  blocked:  'bg-red-100 text-red-600',
}

const PAGE_SIZE = 20

const Vendors: React.FC = () => {
  const navigate = useNavigate()
  const [vendors, setVendors]         = useState<Vendor[]>([])
  const [loading, setLoading]         = useState(true)
  const [searchTerm, setSearchTerm]   = useState('')
  const [page, setPage]               = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing]         = useState<Vendor | null>(null)
  const [deleting, setDeleting]       = useState<number | null>(null)

  useEffect(() => { fetchVendors() }, [])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setVendors(await adminApiService.getVendors())
    } catch { setVendors([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vendor? This cannot be undone.')) return
    try {
      setDeleting(id)
      await adminApiService.deleteVendor(id)
      await fetchVendors()
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`)
    } finally { setDeleting(null) }
  }

  const filtered = vendors.filter(v => {
    const q = searchTerm.toLowerCase()
    return !q || [v.name, v.email, v.phone, v.contact_person, v.tax_pin]
      .some(s => s?.toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const active   = vendors.filter(v => v.status === 'active').length
  const totalBal = vendors.reduce((s, v) => s + (v.current_balance ?? 0), 0)

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
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Vendors</h1>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">{vendors.length} total</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-[10px] text-green-300">{active} active</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                Balance: KES {totalBal.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text" placeholder="Search vendors…" value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => { setEditing(null); setIsModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vendor
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Building2 className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No vendors found</p>
            <p className="text-xs text-gray-400 mt-1">Add your first vendor to get started</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Vendor</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tax PIN</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contact Person</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(v => (
                  <tr key={v.id} className="group hover:bg-gray-50 transition-colors">
                    {/* Vendor name */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
                          {getInitials(v.name)}
                        </div>
                        <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{v.name}</span>
                      </div>
                    </td>

                    {/* Tax PIN */}
                    <td className="px-4 py-2.5">
                      {v.tax_pin
                        ? <div className="flex items-center gap-1 text-xs font-mono text-gray-600"><CreditCard className="h-3 w-3 text-gray-300 shrink-0" />{v.tax_pin}</div>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Contact person */}
                    <td className="px-4 py-2.5">
                      {v.contact_person
                        ? <div className="flex items-center gap-1 text-xs text-gray-700"><User className="h-3 w-3 text-gray-300 shrink-0" />{v.contact_person}</div>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-2.5">
                      {v.email
                        ? <div className="flex items-center gap-1 text-xs text-gray-600"><Mail className="h-3 w-3 text-gray-300 shrink-0" />{v.email}</div>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-2.5">
                      {v.phone
                        ? <div className="flex items-center gap-1 text-xs text-gray-600"><Phone className="h-3 w-3 text-gray-300 shrink-0" />{v.phone}</div>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-300 shrink-0" />
                        <span className={`text-xs font-semibold whitespace-nowrap ${v.current_balance > 0 ? 'text-red-600' : v.current_balance < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          KES {Number(v.current_balance).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[v.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {v.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/vendors/${v.id}/ledger`)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="View Ledger"
                        >
                          <BookOpen className="h-3 w-3" />
                          Ledger
                        </button>
                        <button
                          onClick={() => { setEditing(v); setIsModalOpen(true) }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          disabled={deleting === v.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n); return acc
                }, [])
                .map((n, i) => n === '…'
                  ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                  : <button key={n} onClick={() => setPage(n as number)}
                      className={`w-7 h-7 text-xs rounded-lg border transition-colors ${safePage === n ? 'bg-green-600 border-green-600 text-white font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => { setEditing(null); setIsModalOpen(true) }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Vendor"
      >
        <Plus className="h-5 w-5" />
      </button>

      {isModalOpen && (
        <VendorModal
          vendor={editing}
          onClose={() => { setIsModalOpen(false); setEditing(null) }}
          onSaved={fetchVendors}
        />
      )}

    </div>
  )
}

/* ── Add / Edit modal ── */
interface VendorModalProps {
  vendor: Vendor | null
  onClose: () => void
  onSaved: () => void
}

const VendorModal: React.FC<VendorModalProps> = ({ vendor, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: '', tax_pin: '', current_balance: 0, status: 'active',
    email: '', phone: '', contact_person: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        tax_pin: vendor.tax_pin || '',
        current_balance: vendor.current_balance ?? 0,
        status: vendor.status || 'active',
        email: vendor.email || '',
        phone: vendor.phone || '',
        contact_person: vendor.contact_person || ''
      })
    } else {
      setForm({ name: '', tax_pin: '', current_balance: 0, status: 'active', email: '', phone: '', contact_person: '' })
    }
  }, [vendor])

  const set = (k: keyof typeof form, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = {
        name: form.name,
        tax_pin: form.tax_pin || null,
        current_balance: Number(form.current_balance),
        status: form.status,
        email: form.email || null,
        phone: form.phone || null,
        contact_person: form.contact_person || null
      }
      if (vendor) {
        await adminApiService.updateVendor(vendor.id, payload)
      } else {
        await adminApiService.createVendor(payload)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      alert(`Failed to save: ${err.message || 'Unknown error'}`)
    } finally { setSaving(false) }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{vendor ? 'Edit Vendor' : 'New Vendor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className={lbl}>Vendor Name *</label>
            <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Acme Supplies Ltd" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Tax PIN</label>
              <input className={inp} value={form.tax_pin} onChange={e => set('tax_pin', e.target.value)} placeholder="e.g. A123456789B" />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Contact Person</label>
            <input className={inp} value={form.contact_person} onChange={e => set('contact_person', e.target.value)} placeholder="Full name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Email</label>
              <input type="email" className={inp} value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@example.com" />
            </div>
            <div>
              <label className={lbl}>Phone</label>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+254…" />
            </div>
          </div>

          <div>
            <label className={lbl}>Current Balance (KES)</label>
            <input type="number" step="0.01" className={inp} value={form.current_balance}
              onChange={e => set('current_balance', e.target.value)} placeholder="0.00" />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : vendor ? 'Save Changes' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Vendors
