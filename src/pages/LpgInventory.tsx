import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApiService, Station, FuelPrice, StationTank } from '../services/api'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Building2,
  AlertCircle,
  Download,
  ArrowUpDown,
  ArrowRight,
  Tag,
  X,
  Container,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'

const TANK_STATUS_STYLES: Record<StationTank['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-amber-100 text-amber-700',
}

interface TankDraft {
  name: string
  capacity: string
  current_quantity: string
  status: StationTank['status']
}

const emptyTankDraft = (): TankDraft => ({
  name: '', capacity: '', current_quantity: '', status: 'active',
})

const PAGE_SIZE = 15

const todayInput = () => new Date().toISOString().slice(0, 10)
const dateLabel = (d?: string | null) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString() : '—')

const qty = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type SortKey = 'name' | 'quantity'

const LpgInventory: React.FC = () => {
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('quantity')
  const [page, setPage] = useState(1)

  const [priceStation, setPriceStation] = useState<Station | null>(null)
  const [priceHistory, setPriceHistory] = useState<FuelPrice[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [startDate, setStartDate] = useState(todayInput())
  const [endDate, setEndDate] = useState('')
  const [priceNotes, setPriceNotes] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  const [tanks, setTanks] = useState<StationTank[]>([])
  const [tankStation, setTankStation] = useState<Station | null>(null)
  const [editingTank, setEditingTank] = useState<StationTank | null>(null)
  const [tankDraft, setTankDraft] = useState<TankDraft>(emptyTankDraft())
  const [showTankForm, setShowTankForm] = useState(false)
  const [savingTank, setSavingTank] = useState(false)

  const fetchStations = () =>
    adminApiService.getStations()
      .then(d => setStations(Array.isArray(d) ? d : []))
      .catch(() => setStations([]))

  const fetchTanks = () =>
    adminApiService.getStationTanks()
      .then(d => setTanks(Array.isArray(d) ? d : []))
      .catch(() => setTanks([]))

  useEffect(() => {
    Promise.all([fetchStations(), fetchTanks()]).finally(() => setLoading(false))
  }, [])

  // Tanks are the source of truth for stock. Stations with no tanks recorded yet
  // fall back to the legacy lpgQuantity column so existing figures aren't lost.
  const tanksByStation = useMemo(() => {
    const map = new Map<number, StationTank[]>()
    for (const t of tanks) {
      if (!map.has(t.station_id)) map.set(t.station_id, [])
      map.get(t.station_id)!.push(t)
    }
    return map
  }, [tanks])

  const stockOf = (station: Station) => {
    const stationTanks = tanksByStation.get(station.id)
    if (!stationTanks || stationTanks.length === 0) return Number(station.lpgQuantity || 0)
    return stationTanks.reduce((sum, t) => sum + Number(t.current_quantity || 0), 0)
  }

  const capacityOf = (station: Station) =>
    (tanksByStation.get(station.id) || []).reduce((sum, t) => sum + Number(t.capacity || 0), 0)

  const openTankModal = (station: Station) => {
    setTankStation(station)
    setEditingTank(null)
    setTankDraft(emptyTankDraft())
    setShowTankForm(false)
  }

  const startEditTank = (tank: StationTank) => {
    setEditingTank(tank)
    setTankDraft({
      name: tank.name,
      capacity: String(tank.capacity ?? ''),
      current_quantity: String(tank.current_quantity ?? ''),
      status: tank.status,
    })
    setShowTankForm(true)
  }

  const saveTank = async () => {
    if (!tankStation) return
    if (!tankDraft.name.trim()) { alert('Enter a tank name'); return }
    const capacity = Number(tankDraft.capacity || 0)
    const current = Number(tankDraft.current_quantity || 0)
    if (isNaN(capacity) || capacity < 0) { alert('Capacity must be zero or more'); return }
    if (isNaN(current) || current < 0) { alert('Current quantity must be zero or more'); return }
    if (capacity > 0 && current > capacity) { alert('Current quantity cannot exceed the tank capacity'); return }

    const payload = {
      station_id: tankStation.id,
      name: tankDraft.name.trim(),
      capacity,
      current_quantity: current,
      status: tankDraft.status,
    }

    try {
      setSavingTank(true)
      if (editingTank) {
        await adminApiService.updateStationTank(editingTank.id, payload)
      } else {
        await adminApiService.createStationTank(payload)
      }
      await Promise.all([fetchTanks(), fetchStations()])
      setShowTankForm(false)
      setEditingTank(null)
      setTankDraft(emptyTankDraft())
    } catch (error) {
      alert(`Failed to save tank: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSavingTank(false)
    }
  }

  const deleteTank = async (tank: StationTank) => {
    if (!confirm(`Delete tank "${tank.name}"? This cannot be undone.`)) return
    try {
      await adminApiService.deleteStationTank(tank.id)
      await Promise.all([fetchTanks(), fetchStations()])
    } catch (error) {
      alert(`Failed to delete tank: ${(error as any).message || 'Unknown error'}`)
    }
  }

  const openPriceModal = async (station: Station) => {
    setPriceStation(station)
    setNewPrice(station.price !== null && station.price !== undefined ? String(station.price) : '')
    setStartDate(todayInput())
    setEndDate('')
    setPriceNotes('')
    setPriceHistory([])
    try {
      setLoadingHistory(true)
      const history = await adminApiService.getFuelPricesByStation(station.id)
      setPriceHistory(Array.isArray(history) ? history : [])
    } catch {
      setPriceHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const savePrice = async () => {
    if (!priceStation) return
    const price = Number(newPrice)
    if (!newPrice || isNaN(price) || price <= 0) { alert('Enter a price greater than zero'); return }
    if (!startDate) { alert('Choose a start date'); return }
    if (endDate && endDate < startDate) { alert('End date cannot be before the start date'); return }

    try {
      setSavingPrice(true)
      await adminApiService.createFuelPrice({
        stationId: priceStation.id,
        price,
        fuelType: 'LPG',
        startDate,
        endDate: endDate || null,
        notes: priceNotes.trim() || null,
      })
      await fetchStations()
      setPriceStation(null)
    } catch (error) {
      alert(`Failed to update price: ${(error as any).message || 'Unknown error'}`)
    } finally {
      setSavingPrice(false)
    }
  }

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase()
    const rows = stations.filter(s =>
      !q || [s.name, s.region?.name, s.contact].some(v => v?.toLowerCase().includes(q))
    )
    return [...rows].sort((a, b) =>
      sortKey === 'name' ? a.name.localeCompare(b.name) : stockOf(b) - stockOf(a)
    )
  }, [stations, searchTerm, sortKey, tanksByStation])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalStock = stations.reduce((sum, s) => sum + stockOf(s), 0)
  const emptyCount = stations.filter(s => stockOf(s) <= 0).length
  // Only counted where a station has a price set — stations without one can't be valued.
  const stockValue = stations.reduce((sum, s) => sum + stockOf(s) * Number(s.price || 0), 0)
  const totalCapacity = tanks.reduce((sum, t) => sum + Number(t.capacity || 0), 0)

  const exportToCSV = () => {
    if (filtered.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Station', 'Region', 'Contact', 'Unit Price', 'Tanks', 'Capacity', 'LPG Quantity', 'Stock Value']
    const escapeCSV = (v: string) => (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v
    const rows = filtered.map(s => [
      escapeCSV(s.name),
      escapeCSV(s.region?.name || ''),
      escapeCSV(s.contact || ''),
      s.price !== null && s.price !== undefined ? Number(s.price).toFixed(2) : '',
      String((tanksByStation.get(s.id) || []).length),
      capacityOf(s).toFixed(2),
      stockOf(s).toFixed(2),
      (stockOf(s) * Number(s.price || 0)).toFixed(2),
    ])
    rows.push(['TOTAL', '', '', '', String(tanks.length), totalCapacity.toFixed(2), totalStock.toFixed(2), stockValue.toFixed(2)])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `lpg-inventory-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

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
            <h1 className="text-sm font-bold whitespace-nowrap">LPG Inventory</h1>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/70">
                {stations.length} stations
              </span>
              {emptyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-[10px] text-red-300">
                  {emptyCount} out of stock
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setSortKey(sortKey === 'quantity' ? 'name' : 'quantity')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 border border-white/10 rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap"
            title="Toggle sort order"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortKey === 'quantity' ? 'By Quantity' : 'By Name'}
          </button>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/40" />
            <input
              type="text"
              placeholder="Search station, region…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="px-5 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Fuel className="h-4 w-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total LPG in Stock</p>
            <p className="text-sm font-bold text-gray-900 truncate">{qty(totalStock)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Stations</p>
            <p className="text-sm font-bold text-gray-900 truncate">{stations.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Out of Stock</p>
            <p className="text-sm font-bold text-gray-900 truncate">{emptyCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Fuel className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Stock Value</p>
            <p className="text-sm font-bold text-gray-900 truncate">{money(stockValue)}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-5 py-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Fuel className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No stations found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Stations will appear here once added'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Station</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Region</th>
                    <th className="px-4 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Unit Price</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tanks</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Capacity</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">LPG Quantity</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Stock Value</th>
                    <th className="px-4 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(s => {
                    const quantity = stockOf(s)
                    const price = Number(s.price || 0)
                    const stationTanks = tanksByStation.get(s.id) || []
                    const capacity = capacityOf(s)
                    return (
                      <tr
                        key={s.id}
                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/inventory/lpg/${s.id}`)}
                        title="View LPG ledger"
                      >
                        <td className="px-4 py-1.5 text-xs font-medium text-gray-900 whitespace-nowrap">{s.name.trim()}</td>
                        <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                          {s.region?.name || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-1.5 text-xs text-gray-600 whitespace-nowrap">
                          {s.contact || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-1.5 text-xs text-gray-600 text-right whitespace-nowrap">
                          {s.price !== null && s.price !== undefined
                            ? Number(s.price).toFixed(2)
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-1.5 text-xs text-right whitespace-nowrap">
                          {stationTanks.length > 0
                            ? <span className="text-gray-700">{stationTanks.length}</span>
                            : <span className="text-gray-300" title="No tanks recorded — showing the legacy station figure">—</span>}
                        </td>
                        <td className="px-4 py-1.5 text-xs text-gray-600 text-right whitespace-nowrap">
                          {capacity > 0 ? qty(capacity) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className={`px-4 py-1.5 text-xs text-right font-semibold whitespace-nowrap ${quantity <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {qty(quantity)}
                        </td>
                        <td className="px-4 py-1.5 text-xs text-gray-700 text-right whitespace-nowrap">
                          {price > 0 ? money(quantity * price) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-1.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={e => { e.stopPropagation(); openTankModal(s) }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
                              title="Manage tanks"
                            >
                              <Container className="h-3 w-3" />
                              Tanks
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); openPriceModal(s) }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title="Update LPG price"
                            >
                              <Tag className="h-3 w-3" />
                              Price
                            </button>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-green-600 transition-colors" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-100">
                  <tr>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900" colSpan={4}>Total</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{tanks.length}</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{qty(totalCapacity)}</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{qty(totalStock)}</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{money(stockValue)}</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
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

      {/* ── Tanks modal ── */}
      {tankStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Container className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Tanks</h2>
                  <p className="text-[11px] text-gray-400">{tankStation.name.trim()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!showTankForm && (
                  <button
                    onClick={() => { setEditingTank(null); setTankDraft(emptyTankDraft()); setShowTankForm(true) }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Tank
                  </button>
                )}
                <button onClick={() => setTankStation(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Add / edit form */}
              {showTankForm && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/60">
                  <p className="text-xs font-semibold text-gray-700">
                    {editingTank ? `Edit ${editingTank.name}` : 'New Tank'}
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tank Name *</label>
                    <input
                      type="text"
                      value={tankDraft.name}
                      onChange={e => setTankDraft({ ...tankDraft, name: e.target.value })}
                      placeholder="Tank 1"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={tankDraft.capacity}
                        onChange={e => setTankDraft({ ...tankDraft, capacity: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Current Quantity</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={tankDraft.current_quantity}
                        onChange={e => setTankDraft({ ...tankDraft, current_quantity: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                      <select
                        value={tankDraft.status}
                        onChange={e => setTankDraft({ ...tankDraft, status: e.target.value as StationTank['status'] })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setShowTankForm(false); setEditingTank(null) }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTank}
                      disabled={savingTank}
                      className="px-4 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {savingTank && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {savingTank ? 'Saving…' : editingTank ? 'Update Tank' : 'Add Tank'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tank list */}
              {(tanksByStation.get(tankStation.id) || []).length === 0 ? (
                <div className="text-center py-10">
                  <Container className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No tanks recorded for this station yet.</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Stock is currently showing the legacy station figure of {qty(Number(tankStation.lpgQuantity || 0))}.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tank</th>
                        <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                        <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Capacity</th>
                        <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Current</th>
                        <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Fill</th>
                        <th className="px-3 py-1.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wide"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(tanksByStation.get(tankStation.id) || []).map(t => {
                        const fill = Number(t.capacity) > 0
                          ? (Number(t.current_quantity) / Number(t.capacity)) * 100
                          : null
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-3 py-1.5 text-xs font-medium text-gray-900">{t.name}</td>
                            <td className="px-3 py-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${TANK_STATUS_STYLES[t.status]}`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-xs text-gray-600 text-right whitespace-nowrap">{qty(t.capacity)}</td>
                            <td className="px-3 py-1.5 text-xs text-gray-900 font-semibold text-right whitespace-nowrap">{qty(t.current_quantity)}</td>
                            <td className="px-3 py-1.5 text-xs text-right whitespace-nowrap">
                              {fill === null
                                ? <span className="text-gray-300">—</span>
                                : <span className={fill < 20 ? 'text-red-600 font-medium' : 'text-gray-600'}>{fill.toFixed(0)}%</span>}
                            </td>
                            <td className="px-3 py-1.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => startEditTank(t)} className="text-indigo-600 hover:text-indigo-900" title="Edit tank">
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button onClick={() => deleteTank(t)} className="text-red-600 hover:text-red-900" title="Delete tank">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td className="px-3 py-1.5 text-xs font-bold text-gray-900" colSpan={2}>Station Total</td>
                        <td className="px-3 py-1.5 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{qty(capacityOf(tankStation))}</td>
                        <td className="px-3 py-1.5 text-xs font-bold text-gray-900 text-right whitespace-nowrap">{qty(stockOf(tankStation))}</td>
                        <td className="px-3 py-1.5" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Update price modal ── */}
      {priceStation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Update LPG Price</h2>
                  <p className="text-[11px] text-gray-400">{priceStation.name.trim()}</p>
                </div>
              </div>
              <button onClick={() => setPriceStation(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-500">Current Price</span>
                <span className="font-bold text-gray-900">
                  {priceStation.price !== null && priceStation.price !== undefined
                    ? money(Number(priceStation.price))
                    : 'Not set'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank to keep this price in force until the next change.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={priceNotes}
                  onChange={e => setPriceNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for the change, approval reference, etc."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Price history */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Price History</p>
                {loadingHistory ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-300" /></div>
                ) : priceHistory.length === 0 ? (
                  <p className="text-[11px] text-gray-400 py-2">No previous price changes recorded.</p>
                ) : (
                  <div className="border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto">
                    {priceHistory.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                        <span className="text-gray-500">
                          {dateLabel(p.startDate)} → {p.endDate ? dateLabel(p.endDate) : <span className="text-emerald-600 font-medium">current</span>}
                        </span>
                        <span className="font-semibold text-gray-900">{money(Number(p.price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setPriceStation(null)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={savePrice}
                disabled={savingPrice}
                className="px-4 py-2 text-xs font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {savingPrice && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {savingPrice ? 'Saving…' : 'Save Price'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LpgInventory
