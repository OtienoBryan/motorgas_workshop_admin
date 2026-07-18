import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService } from '../services/api'
import {
  ChevronLeft,
  Loader2,
  Building2,
  UserCheck,
  MapPin,
  Mail,
  Phone,
  Hash,
  Home,
  MessageSquare,
  Settings2,
  Percent,
  Wrench,
  Tags,
  CalendarClock,
  ShieldOff,
} from 'lucide-react'
import { Client, REFERRAL_SOURCES, Toggle, mapConversionClient, buildClientPayload } from './Clients'

const emptyForm: Partial<Client> = {
  name: '', email: '', contact: '', address: '', region: '', category: 'individual', taxPin: '',
  referralSource: '', referralNotes: '',
  taxExempt: false, applyDiscount: false, discountRate: '',
  labourRateOverride: false, labourRate: '',
  partsMarkupOverride: false, partsMarkup: '',
  paymentTermsOverride: false, paymentTerms: '',
}

const ClientForm: React.FC = () => {
  const navigate = useNavigate()
  const { clientId } = useParams<{ clientId?: string }>()
  const isEditing = !!clientId

  const [formData, setFormData] = useState<Partial<Client>>(emptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) { setFormData(emptyForm); return }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const raw = await adminApiService.getConversionClient(Number(clientId))
      if (cancelled) return
      if (raw) {
        const client = mapConversionClient(raw)
        setFormData({
          name: client.name, email: client.email || '', contact: client.contact,
          address: client.address || '', region: client.region,
          category: client.category, taxPin: client.taxPin || '',
          referralSource: client.referralSource || '', referralNotes: client.referralNotes || '',
          taxExempt: !!client.taxExempt, applyDiscount: !!client.applyDiscount, discountRate: client.discountRate || '',
          labourRateOverride: !!client.labourRateOverride, labourRate: client.labourRate || '',
          partsMarkupOverride: !!client.partsMarkupOverride, partsMarkup: client.partsMarkup || '',
          paymentTermsOverride: !!client.paymentTermsOverride, paymentTerms: client.paymentTerms || '',
        })
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [clientId, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = buildClientPayload(formData)
      if (isEditing) {
        await adminApiService.updateConversionClient(Number(clientId), payload)
      } else {
        await adminApiService.createConversionClient(payload)
      }
      navigate('/clients')
    } catch (error) {
      alert(`Failed to save: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'
  const iconWrap = 'relative'
  const fieldIcon = 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none'
  const section = 'bg-white rounded-xl border border-gray-100 shadow-sm p-3.5'

  const isCompany = formData.category === 'company'

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
      <div className="text-white px-5 py-2" style={{ backgroundColor: '#0b0f24' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/clients')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold">{isEditing ? 'Edit Client' : 'New Client'}</h1>
            <p className="text-xs text-white/50">
              {isEditing ? 'Update client details' : 'Add a new client to your records'}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-5 py-3">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

            {/* ── Basic info ── */}
            <div className={section + ' lg:col-span-2'}>
              <div className="mb-2.5">
                <label className={lbl}>Client Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, category: 'individual' }))}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
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
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      isCompany
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Company
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <Home className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    <textarea name="address" rows={2} value={formData.address || ''}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                      className={inp + ' resize-none'} placeholder="Street address…" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right column: referral + settings ── */}
            <div className="lg:col-span-1 space-y-3">

              {/* ── How did you find us? ── */}
              <div className={section}>
                <div className="flex items-center gap-2 mb-2.5">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-700">How did you find us?</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>Source</label>
                    <select
                      value={formData.referralSource || ''}
                      onChange={e => setFormData(p => ({ ...p, referralSource: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow text-gray-700"
                    >
                      <option value="">Select source…</option>
                      {REFERRAL_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={formData.referralNotes || ''}
                      onChange={e => setFormData(p => ({ ...p, referralNotes: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                      placeholder="e.g. Referred by John Doe" />
                  </div>
                </div>
              </div>

              {/* ── Settings ── */}
              <div className={section}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Settings2 className="h-4 w-4 text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-700">Settings</h3>
                </div>
                <div className="space-y-2">

                  {/* Tax Exempt */}
                  <div className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShieldOff className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">Tax Exempt</span>
                    </div>
                    <Toggle checked={!!formData.taxExempt} onChange={v => setFormData(p => ({ ...p, taxExempt: v }))} />
                  </div>

                  {/* Apply Discount */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Apply Discount</span>
                      </div>
                      <Toggle checked={!!formData.applyDiscount} onChange={v => setFormData(p => ({ ...p, applyDiscount: v }))} />
                    </div>
                    {formData.applyDiscount && (
                      <div className="px-3 pb-2">
                        <input type="number" min={0} max={100} step="0.01" value={formData.discountRate || ''}
                          onChange={e => setFormData(p => ({ ...p, discountRate: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                          placeholder="Discount %" />
                      </div>
                    )}
                  </div>

                  {/* Labour Rate Override */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Labour Rate Override</span>
                      </div>
                      <Toggle checked={!!formData.labourRateOverride} onChange={v => setFormData(p => ({ ...p, labourRateOverride: v }))} />
                    </div>
                    {formData.labourRateOverride && (
                      <div className="px-3 pb-2">
                        <input type="number" min={0} step="0.01" value={formData.labourRate || ''}
                          onChange={e => setFormData(p => ({ ...p, labourRate: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                          placeholder="Labour rate (per hour)" />
                      </div>
                    )}
                  </div>

                  {/* Parts Markup Override */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tags className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Parts Markup Override</span>
                      </div>
                      <Toggle checked={!!formData.partsMarkupOverride} onChange={v => setFormData(p => ({ ...p, partsMarkupOverride: v }))} />
                    </div>
                    {formData.partsMarkupOverride && (
                      <div className="px-3 pb-2">
                        <input type="number" min={0} step="0.01" value={formData.partsMarkup || ''}
                          onChange={e => setFormData(p => ({ ...p, partsMarkup: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                          placeholder="Markup %" />
                      </div>
                    )}
                  </div>

                  {/* Payment Terms Override */}
                  <div className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">Payment Terms Override</span>
                      </div>
                      <Toggle checked={!!formData.paymentTermsOverride} onChange={v => setFormData(p => ({ ...p, paymentTermsOverride: v }))} />
                    </div>
                    {formData.paymentTermsOverride && (
                      <div className="px-3 pb-2">
                        <input type="text" value={formData.paymentTerms || ''}
                          onChange={e => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow placeholder:text-gray-400"
                          placeholder="e.g. Net 30" />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={() => navigate('/clients')} disabled={saving}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors bg-white">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientForm
