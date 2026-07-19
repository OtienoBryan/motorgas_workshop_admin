import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, ChecklistTemplate } from '../services/api'
import { ClipboardCheck, Plus, Loader2, Trash2, ArrowRight } from 'lucide-react'

function getSections(checklist?: string | null): string[] {
  if (!checklist) return []
  try {
    const parsed = JSON.parse(checklist)
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

const ChecklistTemplates: React.FC = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getChecklistTemplates()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Delete this checklist?')) return
    try {
      setDeletingId(id)
      await adminApiService.deleteChecklistTemplate(id)
      await fetchTemplates()
    } catch {
      alert('Failed to delete checklist')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspection Checklists</h1>
          <p className="text-sm text-gray-500 mt-1">Reusable checklists you can apply when inspecting a vehicle.</p>
        </div>
        <button
          onClick={() => navigate('/inspections/new')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <ClipboardCheck className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">No checklists yet</p>
          <p className="text-xs text-gray-400 mt-1">Create a reusable inspection checklist to get started</p>
          <button
            onClick={() => navigate('/inspections/new')}
            className="flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Title &amp; Sections</th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {templates.map(tpl => {
                const sections = getSections(tpl.checklist)
                return (
                  <tr
                    key={tpl.id}
                    onClick={() => navigate(`/inspections/${tpl.id}/edit`)}
                    className="group hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-start gap-2">
                        <div className="h-7 w-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                          <ClipboardCheck className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{tpl.title}</p>
                          {sections.length > 0 ? (
                            <div className="flex flex-col gap-1 mt-1.5">
                              {sections.map((section, i) => (
                                <span
                                  key={i}
                                  className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-md w-fit"
                                >
                                  {section}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic mt-1 block">No sections yet</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={e => handleDelete(e, tpl.id)}
                          disabled={deletingId === tpl.id}
                          className="p-1.5 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete checklist"
                        >
                          {deletingId === tpl.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/inspections/${tpl.id}/edit`) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          Edit
                          <ArrowRight className="h-3 w-3" />
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
    </div>
  )
}

export default ChecklistTemplates
