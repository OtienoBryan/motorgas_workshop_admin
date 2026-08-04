import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, Station, SalesPosting } from '../services/api'
import { ArrowLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'mpesa', label: 'Mpesa' },
  { key: 'credit', label: 'Credit' },
  { key: 'other', label: 'Other' },
] as const

const VARIANCE_EPSILON = 0.01

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function varianceRows(posting: SalesPosting) {
  return PAYMENT_METHODS.map(m => {
    const posted = Number(posting[`${m.key}_posted` as const])
    const system = Number(posting[`${m.key}_system` as const])
    const variance = posted - system
    return { key: m.key, label: m.label, posted, system, variance, matching: Math.abs(variance) < VARIANCE_EPSILON }
  })
}

const StationVarianceReport: React.FC = () => {
  const navigate = useNavigate()
  const { stationId } = useParams<{ stationId: string }>()

  const [station, setStation] = useState<Station | null>(null)
  const [postings, setPostings] = useState<SalesPosting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stationId) return
    setLoading(true)
    Promise.all([
      adminApiService.getSalesPostings(Number(stationId)),
      adminApiService.getStations(),
    ])
      .then(([postings, stations]) => {
        setPostings(postings)
        setStation((Array.isArray(stations) ? stations : []).find(s => s.id === Number(stationId)) || null)
      })
      .finally(() => setLoading(false))
  }, [stationId])

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => navigate(`/sales/report/summary/${stationId}`)}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="Back to Daily Breakdown"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-bold text-gray-900">{station ? station.name.trim() : 'Station'} — Variance Report</h1>
        </div>

        <div className="bg-white rounded border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : postings.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-500">
              No accountant postings recorded for this station yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Date</th>
                    {PAYMENT_METHODS.map(m => (
                      <th key={m.key} className="px-2 py-1 text-right text-[11px] font-medium text-gray-700">{m.label}</th>
                    ))}
                    <th className="px-2 py-1 text-center text-[11px] font-medium text-gray-700">Status</th>
                    <th className="px-2 py-1 text-left text-[11px] font-medium text-gray-700">Posted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {postings.map((p) => {
                    const rows = varianceRows(p)
                    const allMatching = rows.every(r => r.matching)
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-[11px] font-medium text-gray-900 whitespace-nowrap">
                          {new Date(p.period_start).toLocaleDateString()}
                        </td>
                        {rows.map(r => (
                          <td key={r.key} className="px-2 py-1 text-[11px] text-right whitespace-nowrap">
                            <div className={r.matching ? 'text-gray-700' : 'text-red-600 font-semibold'}>{money(r.posted)}</div>
                            {!r.matching && (
                              <div className="text-[10px] text-red-500">{r.variance > 0 ? '+' : ''}{money(r.variance)}</div>
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1 text-center">
                          {allMatching ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                              <CheckCircle2 className="h-3 w-3" /> Matching
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-semibold">
                              <AlertTriangle className="h-3 w-3" /> Variance
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-[11px] text-gray-500 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StationVarianceReport
