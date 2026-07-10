import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, ConversionVehicle } from '../services/api'
import {
  Search,
  Car,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  X,
  Plus
} from 'lucide-react'

const VEHICLE_TYPE_COLORS: Record<string, string> = {
  Sedan:  'bg-blue-100 text-blue-700',
  SUV:    'bg-emerald-100 text-emerald-700',
  Truck:  'bg-amber-100 text-amber-700',
  Van:    'bg-purple-100 text-purple-700',
  Bus:    'bg-orange-100 text-orange-700',
  Pickup: 'bg-yellow-100 text-yellow-700',
}

function typeStyle(t?: string) {
  if (!t) return 'bg-gray-100 text-gray-500'
  return VEHICLE_TYPE_COLORS[t] ?? 'bg-gray-100 text-gray-600'
}

const PAGE_SIZE = 20

const Vehicles: React.FC = () => {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState<ConversionVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => { fetchVehicles() }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const data = await adminApiService.getAllConversionVehicles()
      setVehicles(Array.isArray(data) ? data : [])
    } catch {
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = vehicles.filter(v => {
    const q = searchTerm.toLowerCase()
    if (!q) return true
    return [
      v.registration_number, v.vin_serial_number, v.make, v.model,
      v.vehicle_type, v.color, v.conversionClient?.name
    ].some(s => s?.toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
            <h1 className="text-sm font-bold whitespace-nowrap">Vehicles</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
              {vehicles.length} total
            </span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search plate, make, model, client…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => navigate('/vehicles/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Car className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No vehicles found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Photo</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Plate</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Make</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Model</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Year</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Transmission</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Engine</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mileage</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">VIN</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Unit</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Client</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(v => (
                  <tr key={v.id}
                    className="group hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clients/${v.conversion_client_id}/vehicles/${v.id}`)}>

                    {/* Photo */}
                    <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                      {v.photo_url
                        ? <img
                            src={v.photo_url}
                            alt={v.registration_number}
                            onClick={() => setLightboxUrl(v.photo_url!)}
                            className="w-16 h-12 object-cover rounded-lg cursor-zoom-in border border-gray-100 hover:opacity-90 transition-opacity"
                          />
                        : <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-100">
                            <Car className="h-4 w-4 text-gray-300" />
                          </div>}
                    </td>

                    {/* Plate */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md">
                        {v.registration_number}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-2.5">
                      {v.vehicle_type
                        ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${typeStyle(v.vehicle_type)}`}>
                            {v.vehicle_type}
                          </span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>

                    {/* Make */}
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{v.make || <span className="text-gray-300">—</span>}</td>

                    {/* Model */}
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-900 whitespace-nowrap">{v.model || <span className="text-gray-300">—</span>}</td>

                    {/* Year */}
                    <td className="px-4 py-2.5 text-xs text-gray-700 whitespace-nowrap">{v.year || <span className="text-gray-300">—</span>}</td>

                    {/* Transmission */}
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{v.transmission_type || <span className="text-gray-300">—</span>}</td>

                    {/* Engine */}
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{v.engine || <span className="text-gray-300">—</span>}</td>

                    {/* Mileage */}
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                      {v.current_odo ? `${v.current_odo.toLocaleString()} ${v.odo_unit}` : <span className="text-gray-300">—</span>}
                    </td>

                    {/* VIN */}
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[10px] text-gray-500">{v.vin_serial_number || <span className="text-gray-300">—</span>}</span>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{v.unit_number || <span className="text-gray-300">—</span>}</td>

                    {/* Client */}
                    <td className="px-4 py-2.5">
                      {v.conversionClient?.name
                        ? <button
                            onClick={e => { e.stopPropagation(); navigate(`/clients/${v.conversion_client_id}`) }}
                            className="flex items-center gap-1 text-xs text-green-700 hover:underline whitespace-nowrap"
                          >
                            <User className="h-3 w-3 text-gray-400 shrink-0" />
                            {v.conversionClient.name}
                          </button>
                        : <span className="text-xs text-gray-400">Client #{v.conversion_client_id}</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/clients/${v.conversion_client_id}/vehicles/${v.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 ml-auto"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
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
                    : <button key={n} onClick={() => setPage(n as number)}
                        className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                          safePage === n
                            ? 'bg-green-600 border-green-600 text-white font-semibold'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}>
                        {n}
                      </button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Vehicle"
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* ── Floating add button ── */}
      <button
        onClick={() => navigate('/vehicles/new')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all z-40"
        title="Add Vehicle"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}

export default Vehicles

