import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService } from '../services/api'
import {
  ChevronLeft,
  Loader2,
  ClipboardCheck,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react'

interface ChecklistSectionRow {
  key: string
  title: string
}

let idCounter = 0
const newKey = () => `k${Date.now()}_${idCounter++}`

const newSection = (): ChecklistSectionRow => ({ key: newKey(), title: '' })

const InspectionForm: React.FC = () => {
  const navigate = useNavigate()
  const { templateId } = useParams<{ templateId?: string }>()
  const isEditing = !!templateId

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<ChecklistSectionRow[]>([newSection()])

  useEffect(() => {
    if (!templateId) return
    adminApiService.getChecklistTemplate(Number(templateId))
      .then(tpl => {
        setTitle(tpl.title || '')

        if (tpl.checklist) {
          try {
            const parsed = JSON.parse(tpl.checklist) as string[]
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSections(parsed.map((sectionTitle): ChecklistSectionRow => ({ key: newKey(), title: sectionTitle })))
            }
          } catch {
            // leave the default empty section if the stored checklist can't be parsed
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [templateId])

  const addSection = () => setSections(s => [...s, newSection()])
  const removeSection = (key: string) => setSections(s => s.filter(sec => sec.key !== key))
  const updateSectionTitle = (key: string, sectionTitle: string) =>
    setSections(s => s.map(sec => sec.key === key ? { ...sec, title: sectionTitle } : sec))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    // Drop empty sections
    const sectionTitles = sections.map(s => s.title.trim()).filter(Boolean)

    const payload = {
      title: title.trim(),
      checklist: sectionTitles.length > 0 ? JSON.stringify(sectionTitles) : undefined,
    }

    try {
      setSaving(true)
      if (isEditing) {
        await adminApiService.updateChecklistTemplate(Number(templateId), payload)
      } else {
        await adminApiService.createChecklistTemplate(payload)
      }
      navigate('/checklist-templates')
    } catch (err) {
      alert(`Failed to save checklist: ${(err as any).message ?? 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

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
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-sm font-bold flex-1">
          {isEditing ? 'Edit Inspection Checklist' : 'Inspection Checklist Form'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-5 py-6 space-y-5">

        {/* Title */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className={lbl}>Title *</label>
          <input
            className={inp}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Pre-Delivery LPG Conversion Inspection"
            required
          />
        </div>

        {/* Checklist sections */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-green-600" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Checklist</h2>
            </div>
            <button
              type="button"
              onClick={addSection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Section
            </button>
          </div>

          <div className="space-y-2">
            {sections.map(section => (
              <div key={section.key} className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2">
                <GripVertical className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                <input
                  value={section.title}
                  onChange={e => updateSectionTitle(section.key, e.target.value)}
                  placeholder="Section (e.g. Engine, Brakes, Electrical)…"
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => removeSection(section.key)}
                  disabled={sections.length === 1}
                  className="p-1 text-gray-300 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors shrink-0"
                  title="Remove section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Checklist'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default InspectionForm
