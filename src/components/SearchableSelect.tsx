import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  options: (string | SelectOption)[]
  onChange: (value: string) => void
  placeholder?: string
  /** Shorter text shown in the closed button (defaults to the selected option's label). */
  buttonLabel?: string
  /** Extra classes for the dropdown panel, e.g. a wider min-width. */
  menuClassName?: string
  clearable?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value, options: rawOptions, onChange, placeholder = 'Select…', buttonLabel, menuClassName = '', clearable = true,
}) => {
  const options = useMemo<SelectOption[]>(
    () => rawOptions.map(o => (typeof o === 'string' ? { value: o, label: o } : o)),
    [rawOptions],
  )
  const selected = options.find(o => o.value === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options
  }, [options, query])

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-left"
      >
        <span className={`truncate ${selected ? 'text-gray-700' : 'text-gray-400'}`}>
          {selected ? (buttonLabel ?? selected.label) : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600"
              onClick={e => { e.stopPropagation(); pick('') }} />
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </button>
      {open && (
        <div className={`absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg ${menuClassName}`}>
          <div className="relative p-2 border-b border-gray-100">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); if (filtered[0]) pick(filtered[0].value) }
                if (e.key === 'Escape') setOpen(false)
              }}
              placeholder="Search…"
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <ul className="max-h-56 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400">No matches</li>
            ) : filtered.map(o => (
              <li key={o.value}>
                <button type="button" onClick={() => pick(o.value)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-green-50 ${o.value === value ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
