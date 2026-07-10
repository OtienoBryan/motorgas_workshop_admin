import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService } from '../services/api'
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
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Hash,
  Home,
  UserPlus,
} from 'lucide-react'

interface Client {
  id: number
  name: string
  email?: string
  contact: string
  address?: string
  region: string
  category: 'individual' | 'company'
  taxPin?: string
  accountNumber?: string
}

/* ── Add / Edit modal ── */
interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client?: Client | null
  onSave: (data: Partial<Client>) => Promise<void>
  isEditing: boolean
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client, onSave, isEditing }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '', email: '', contact: '', address: '', region: '', category: 'individual', taxPin: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFormData(isEditing && client ? {
      name: client.name, email: client.email || '', contact: client.contact,
      address: client.address || '', region: client.region,
      category: client.category, taxPin: client.taxPin || ''
    } : { name: '', email: '', contact: '', address: '', region: '', category: 'individual', taxPin: '' })
  }, [isOpen, isEditing, client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      alert(`Failed to save: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1.5'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'

  if (!isOpen) return null

  const isCompany = formData.category === 'company'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isEditing ? 'Edit Client' : 'New Client'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing ? 'Update client details' : 'Add a new client to your records'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className={lbl}>Client Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, category: 'individual' }))}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  !isCompany
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="h-4 w-4" /> Individual
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, category: 'company' }))}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  isCompany
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Building2 className="h-4 w-4" /> Company
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={lbl}>{isCompany ? 'Company Name' : 'Full Name'} *</label>
              <div className={iconWrap}>
                {isCompany ? <Building2 className={fieldIcon} /> : <UserCheck className={fieldIcon} />}
                <input type="text" name="name" value={formData.name || ''} required
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className={inp} placeholder={isCompany ? 'Enter company name' : 'Enter full name'} />
              </div>
            </div>

            <div>
              <label className={lbl}>Contact *</label>
              <div className={iconWrap}>
                <Phone className={fieldIcon} />
                <input type="text" name="contact" value={formData.contact || ''} required
                  onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                  className={inp} placeholder="+254…" />
              </div>
            </div>
            <div>
              <label className={lbl}>Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className={iconWrap}>
                <Mail className={fieldIcon} />
                <input type="email" name="email" value={formData.email || ''}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className={inp} placeholder="client@email.com" />
              </div>
            </div>

            <div>
              <label className={lbl}>Tax PIN <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className={iconWrap}>
                <Hash className={fieldIcon} />
                <input type="text" name="taxPin" value={formData.taxPin || ''}
                  onChange={e => setFormData(p => ({ ...p, taxPin: e.target.value }))}
                  className={inp} placeholder="A000000000X" />
              </div>
            </div>
            <div>
              <label className={lbl}>Region</label>
              <div className={iconWrap}>
                <MapPin className={fieldIcon} />
                <input type="text" name="region" value={formData.region || ''}
                  onChange={e => setFormData(p => ({ ...p, region: e.target.value }))}
                  className={inp} placeholder="e.g. Nairobi" />
              </div>
            </div>

            <div className="col-span-2">
              <label className={lbl}>Address</label>
              <div className={iconWrap}>
                <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                <textarea name="address" rows={2} value={formData.address || ''}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                  className={inp + ' resize-none'} placeholder="Street address…" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
type Filter = 'all' | 'company' | 'individual'

const Clients: React.FC = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getConversionClients()
      setClients(data.map(c => ({
        id: c.id, name: c.name, email: c.email || undefined,
        contact: c.contact, address: c.address || undefined,
        region: c.region || '', category: (c.category as 'individual' | 'company') || 'individual',
        taxPin: c.tax_pin || undefined, accountNumber: c.account_number || undefined
      })))
    } catch { setClients([]) }
    finally { setLoading(false) }
  }

  const handleSave = async (clientData: Partial<Client>) => {
    const payload = {
      name: clientData.name || '', email: clientData.email || undefined,
      contact: clientData.contact || '', category: clientData.category || 'individual',
      tax_pin: clientData.taxPin || '', address: clientData.address || '',
      region: clientData.region || '', is_active: 1
    }
    if (editingClient) {
      await adminApiService.updateConversionClient(editingClient.id, payload)
    } else {
      await adminApiService.createConversionClient(payload)
    }
    await fetchClients()
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
    const matchesSearch = !q || [c.name, c.email, c.contact, c.address, c.region, c.accountNumber]
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
            onClick={() => { setEditingClient(null); setIsModalOpen(true) }}
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
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Region</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tax PIN</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(client => {
                  const isCompany = client.category === 'company'
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

                      {/* Type */}
                      <td className="px-4 py-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isCompany ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isCompany ? <Building2 className="h-2.5 w-2.5" /> : <UserCheck className="h-2.5 w-2.5" />}
                          {isCompany ? 'Company' : 'Individual'}
                        </span>
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
                            onClick={() => { setEditingClient(client); setIsModalOpen(true) }}
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
        onClick={() => { setEditingClient(null); setIsModalOpen(true) }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Client"
      >
        <Plus className="h-5 w-5" />
      </button>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingClient(null) }}
        client={editingClient}
        onSave={handleSave}
        isEditing={!!editingClient}
      />
    </div>
  )
}

export default Clients
