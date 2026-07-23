import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, ConversionClient } from '../services/api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  UserCheck,
  MapPin,
  Loader2,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export interface Client {
  id: number
  name: string
  email?: string
  contact: string
  address?: string
  notes?: string
  region: string
  category: 'individual' | 'company'
  organizationType?: 'individual' | 'sacco' | 'company'
  organizationName?: string
  taxPin?: string
  accountNumber?: string
  referralSource?: string
  referralNotes?: string
  taxExempt?: boolean
  applyDiscount?: boolean
  discountRate?: string
  labourRateOverride?: boolean
  labourRate?: string
  partsMarkupOverride?: boolean
  partsMarkup?: string
  paymentTermsOverride?: boolean
  paymentTerms?: string
}

export const REFERRAL_SOURCES = [
  'Referral', 'Google Search', 'Social Media', 'Walk-in', 'Repeat Customer', 'Advertisement', 'Other',
]

const ORG_TYPE_LABELS: Record<'individual' | 'sacco' | 'company', string> = {
  individual: 'Individual', sacco: 'Sacco', company: 'Company',
}
const ORG_TYPE_STYLES: Record<'individual' | 'sacco' | 'company', string> = {
  individual: 'bg-blue-100 text-blue-700', sacco: 'bg-amber-100 text-amber-700', company: 'bg-violet-100 text-violet-700',
}
const ORG_TYPE_ICONS: Record<'individual' | 'sacco' | 'company', React.ReactNode> = {
  individual: <UserCheck className="h-2.5 w-2.5" />, sacco: <Users className="h-2.5 w-2.5" />, company: <Building2 className="h-2.5 w-2.5" />,
}

/* ── Small toggle switch ── */
export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
      checked ? 'bg-green-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4.5' : 'translate-x-1'
      }`}
      style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
    />
  </button>
)

export const mapConversionClient = (c: ConversionClient): Client => ({
  id: c.id, name: c.name, email: c.email || undefined,
  contact: c.contact, address: c.address || undefined, notes: c.description || undefined,
  region: c.region || '', category: (c.category as 'individual' | 'company') || 'individual',
  organizationType: c.organization_type || undefined, organizationName: c.organization_name || undefined,
  taxPin: c.tax_pin || undefined, accountNumber: c.account_number || undefined,
  referralSource: c.referral_source || undefined, referralNotes: c.referral_notes || undefined,
  taxExempt: !!c.tax_exempt, applyDiscount: !!c.apply_discount, discountRate: c.discount_rate?.toString() || undefined,
  labourRateOverride: !!c.labour_rate_override, labourRate: c.labour_rate?.toString() || undefined,
  partsMarkupOverride: !!c.parts_markup_override, partsMarkup: c.parts_markup?.toString() || undefined,
  paymentTermsOverride: !!c.payment_terms_override, paymentTerms: c.payment_terms || undefined,
})

export const buildClientPayload = (clientData: Partial<Client>) => ({
  name: clientData.name || '', email: clientData.email || undefined,
  contact: clientData.contact || '', category: clientData.category || 'individual',
  organization_type: clientData.organizationType || undefined,
  organization_name: clientData.organizationType ? (clientData.organizationName || undefined) : undefined,
  tax_pin: clientData.taxPin || '', address: clientData.address || '',
  description: clientData.notes || undefined,
  region: clientData.region || '', is_active: 1,
  referral_source: clientData.referralSource || undefined,
  referral_notes: clientData.referralNotes || undefined,
  tax_exempt: clientData.taxExempt ? 1 : 0,
  apply_discount: clientData.applyDiscount ? 1 : 0,
  discount_rate: clientData.applyDiscount && clientData.discountRate ? Number(clientData.discountRate) : undefined,
  labour_rate_override: clientData.labourRateOverride ? 1 : 0,
  labour_rate: clientData.labourRateOverride && clientData.labourRate ? Number(clientData.labourRate) : undefined,
  parts_markup_override: clientData.partsMarkupOverride ? 1 : 0,
  parts_markup: clientData.partsMarkupOverride && clientData.partsMarkup ? Number(clientData.partsMarkup) : undefined,
  payment_terms_override: clientData.paymentTermsOverride ? 1 : 0,
  payment_terms: clientData.paymentTermsOverride ? (clientData.paymentTerms || undefined) : undefined,
})

/* ── Main page ── */
type Filter = 'all' | 'company' | 'individual'

const Clients: React.FC = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [deletingClient, setDeletingClient] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getConversionClients()
      setClients(data.map(mapConversionClient))
    } catch { setClients([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this client? This cannot be undone.')) return
    try {
      setDeletingClient(id)
      await adminApiService.deleteConversionClient(id)
      await fetchClients()
    } catch (err) {
      alert(`Failed to delete: ${(err as any).message || 'Unknown error'}`)
    } finally { setDeletingClient(null) }
  }

  const filtered = clients.filter(c => {
    const matchesFilter = filter === 'all' || c.category === filter
    const q = searchTerm.toLowerCase()
    const matchesSearch = !q || [c.name, c.email, c.contact, c.address, c.region, c.accountNumber, c.organizationName]
      .some(v => v?.toLowerCase().includes(q))
    return matchesFilter && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const companies   = clients.filter(c => c.category === 'company').length
  const individuals = clients.filter(c => c.category === 'individual').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Page header ── */}
      <div className="text-white px-5 py-3" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          {/* Title + stats */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Clients</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                {clients.length} total
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 hidden sm:inline-block">
                {companies} companies
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 hidden sm:inline-block">
                {individuals} individuals
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => navigate('/clients/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="bg-white border-b border-gray-200 px-5">
        <div className="flex gap-0">
          {(['all', 'company', 'individual'] as Filter[]).map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors capitalize ${
                filter === f
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {f === 'all' ? `All (${clients.length})` : f === 'company' ? `Companies (${companies})` : `Individuals (${individuals})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No clients found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Account No.</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Organization Type</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Organization Name</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Region</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tax PIN</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(client => {
                  return (
                    <tr key={client.id}
                      className="group hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}>

                      {/* Name */}
                      <td className="px-4 py-1.5">
                        <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{client.name}</span>
                      </td>

                      {/* Account Number */}
                      <td className="px-4 py-1.5">
                        {client.accountNumber
                          ? <span className="text-xs font-mono text-gray-600 whitespace-nowrap">{client.accountNumber}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>

                      {/* Organization Type */}
                      <td className="px-4 py-1.5">
                        {client.organizationType
                          ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${ORG_TYPE_STYLES[client.organizationType]}`}>
                              {ORG_TYPE_ICONS[client.organizationType]}
                              {ORG_TYPE_LABELS[client.organizationType]}
                            </span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>

                      {/* Organization Name */}
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">
                        {client.organizationName || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-1.5 text-xs text-gray-700 whitespace-nowrap">{client.contact}</td>

                      {/* Email */}
                      <td className="px-4 py-1.5 text-xs text-gray-500 whitespace-nowrap">
                        {client.email || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Region */}
                      <td className="px-4 py-1.5">
                        {client.region
                          ? <div className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />{client.region}
                            </div>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>

                      {/* Tax PIN */}
                      <td className="px-4 py-1.5">
                        {client.taxPin
                          ? <span className="text-xs font-mono text-gray-600">{client.taxPin}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-1.5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            disabled={deletingClient === client.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingClient === client.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
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

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-xs text-gray-400">
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>
                    : <button key={n}
                        onClick={() => setPage(n as number)}
                        className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                          safePage === n
                            ? 'bg-green-600 border-green-600 text-white font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}>
                        {n}
                      </button>
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating add button ── */}
      <button
        onClick={() => navigate('/clients/new')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Client"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}

export default Clients
