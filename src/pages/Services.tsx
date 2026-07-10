import React, { useState, useEffect } from 'react'
import { adminApiService, Service } from '../services/api'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Wrench,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hash,
  FileText,
} from 'lucide-react'

/* ── Add / Edit modal ── */
interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: Service | null
  onSave: (data: Partial<Service>) => Promise<void>
  isEditing: boolean
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, service, onSave, isEditing }) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    title: '', description: '', rate: undefined, pricing_type: 'fixed'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setFormData(isEditing && service ? {
      title: service.title, description: service.description || '',
      rate: service.rate, pricing_type: service.pricing_type
    } : { title: '', description: '', rate: undefined, pricing_type: 'fixed' })
  }, [isOpen, isEditing, service])

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
  const inpPlain = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1.5'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'

  if (!isOpen) return null

  const isHourly = formData.pricing_type === 'hourly'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Wrench className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isEditing ? 'Edit Service' : 'Add New Service'}
              </h2>
              <p className="text-xs text-gray-400">
                {isEditing ? 'Update labour/service details' : 'Register a labour or service item'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Labour Title *</label>
            <div className={iconWrap}>
              <Hash className={fieldIcon} />
              <input
                type="text" value={formData.title || ''} required
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className={inp} placeholder="e.g. Engine Diagnostic"
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Description</label>
            <div className={iconWrap}>
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              <textarea
                value={formData.description || ''} rows={3}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className={inp + ' resize-none'} placeholder="Describe the labour/service…"
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Pricing Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, pricing_type: 'fixed' }))}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  !isHourly ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Hash className="h-4 w-4" /> Fixed
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, pricing_type: 'hourly' }))}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  isHourly ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Clock className="h-4 w-4" /> Hourly
              </button>
            </div>
          </div>

          <div>
            <label className={lbl}>{isHourly ? 'Hourly Rate (KES) *' : 'Fixed Rate (KES) *'}</label>
            <input
              type="number" min="0" step="0.01" value={formData.rate ?? ''} required
              onChange={e => setFormData(p => ({ ...p, rate: e.target.value ? Number(e.target.value) : undefined }))}
              className={inpPlain} placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
const PAGE_SIZE = 15

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => { fetchServices() }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getServices()
      setServices(Array.isArray(data) ? data : [])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: Partial<Service>) => {
    if (editingService) {
      await adminApiService.updateService(editingService.id, data)
    } else {
      await adminApiService.createService(data as Omit<Service, 'id' | 'created_at' | 'updated_at'>)
    }
    await fetchServices()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service? This action cannot be undone.')) return
    try {
      setDeletingService(id)
      await adminApiService.deleteService(id)
      await fetchServices()
    } catch (error) {
      alert(`Failed to delete service: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setDeletingService(null)
    }
  }

  const filtered = services.filter(s => {
    const q = searchTerm.toLowerCase()
    return !q || [s.title, s.description].some(v => v?.toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const hourlyCount = services.filter(s => s.pricing_type === 'hourly').length
  const fixedCount  = services.filter(s => s.pricing_type === 'fixed').length

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
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-sm font-bold whitespace-nowrap">Services</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                {services.length} total
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 hidden sm:inline-block">
                {fixedCount} fixed
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70 hidden sm:inline-block">
                {hourlyCount} hourly
              </span>
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search services…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={() => { setEditingService(null); setIsModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Service
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Wrench className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No services found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first service'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Title</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Rate</th>
                  <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(service => {
                  const isHourly = service.pricing_type === 'hourly'
                  return (
                    <tr key={service.id} className="group hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-1.5">
                        <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">{service.title}</span>
                      </td>
                      <td className="px-4 py-1.5 max-w-[280px]">
                        {service.description
                          ? <p className="text-[11px] text-gray-500 truncate" title={service.description}>{service.description}</p>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isHourly ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                        }`}>
                          {isHourly ? <Clock className="h-2.5 w-2.5" /> : <Hash className="h-2.5 w-2.5" />}
                          {isHourly ? 'Hourly' : 'Fixed'}
                        </span>
                      </td>
                      <td className="px-4 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap">
                        KES {Number(service.rate).toLocaleString()}{isHourly && <span className="text-gray-400"> /hr</span>}
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingService(service); setIsModalOpen(true) }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            disabled={deletingService === service.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            {deletingService === service.id
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
        onClick={() => { setEditingService(null); setIsModalOpen(true) }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Service"
      >
        <Plus className="h-5 w-5" />
      </button>

      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingService(null) }}
        service={editingService}
        onSave={handleSave}
        isEditing={!!editingService}
      />
    </div>
  )
}

export default Services
