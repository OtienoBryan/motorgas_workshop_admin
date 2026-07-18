import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ClipboardCheck,
  BarChart3,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
  BookOpen,
} from 'lucide-react'

interface AccountCard {
  slug: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  route: string
  description: string
  features: string[]
}

const CARDS: AccountCard[] = [
  {
    slug: 'invoices',
    name: 'Invoices',
    icon: FileText,
    gradient: 'from-purple-500 to-purple-600',
    route: '/invoices',
    description: 'View generated invoices, track payments received, and monitor outstanding balances across all clients.',
    features: ['Invoice list and search', 'Amount paid vs balance due', 'Client and vehicle filtering', 'Export and print'],
  },
  {
    slug: 'quotations',
    name: 'Quotations',
    icon: ClipboardCheck,
    gradient: 'from-emerald-500 to-emerald-600',
    route: '/quotations',
    description: 'Review open, sent, and approved quotations awaiting conversion into invoices.',
    features: ['Quotation status tracking', 'Total quoted value', 'Client and plate search', 'One-click convert to invoice'],
  },
  {
    slug: 'sales-report',
    name: 'Sales Report',
    icon: BarChart3,
    gradient: 'from-orange-500 to-orange-600',
    route: '/sales/report',
    description: 'Analyze revenue, profit, and sales performance across clients, vehicles, and key accounts.',
    features: ['Revenue and profit trends', 'Sales rep performance', 'Key account breakdown', 'Date range filtering'],
  },
  {
    slug: 'post-sale',
    name: 'Post Sale',
    icon: Receipt,
    gradient: 'from-red-500 to-red-600',
    route: '/sales/post',
    description: 'Record a new sale transaction and post it against inventory and client accounts.',
    features: ['New sale entry', 'Inventory deduction', 'Client account posting', 'Payment recording'],
  },
  {
    slug: 'purchase-orders',
    name: 'Purchase Orders',
    icon: ShoppingCart,
    gradient: 'from-teal-500 to-teal-600',
    route: '/purchase-orders',
    description: 'Track purchase orders placed with vendors and monitor supplier costs and delivery status.',
    features: ['Purchase order list', 'Status tracking', 'Supplier cost totals', 'Create new orders'],
  },
  {
    slug: 'vendor-ledger',
    name: 'Vendor Ledger',
    icon: Truck,
    gradient: 'from-indigo-500 to-indigo-600',
    route: '/vendors',
    description: 'Select a vendor to view their ledger — running balance of purchases, payments, and credit.',
    features: ['Vendor directory', 'Per-vendor ledger', 'Running balance', 'Payment history'],
  },
  {
    slug: 'key-accounts',
    name: 'Key Accounts',
    icon: Users,
    gradient: 'from-cyan-500 to-cyan-600',
    route: '/key-accounts',
    description: 'Manage key account clients, their credit terms, and assigned regions.',
    features: ['Key account directory', 'Credit terms management', 'Region assignment', 'Account status'],
  },
  {
    slug: 'key-account-ledger',
    name: 'Key Account Ledger',
    icon: BookOpen,
    gradient: 'from-blue-500 to-blue-600',
    route: '/key-accounts/ledger',
    description: 'Track key account balances and generate statements of running debits and credits.',
    features: ['Running balance tracking', 'Debit and credit entries', 'Statement export', 'Account filtering'],
  },
]

const Accounts: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, quotations, purchase orders, and account ledgers.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CARDS.map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.slug}
                onClick={() => navigate(card.route)}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
              >
                <div style={{ backgroundColor: '#0b0f24' }} className="px-2.5 py-2 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <h2 className="text-xs font-bold text-white truncate">{card.name}</h2>
                  </div>
                  <button
                    onClick={() => navigate(card.route)}
                    className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold text-white bg-white/20 hover:bg-white/30 rounded transition-colors"
                  >
                    View
                  </button>
                </div>

                <div className="p-2.5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {card.features.length} features
                    </span>
                    <span className="text-[9px] text-gray-300 font-mono truncate">{card.slug}</span>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-snug mb-2 line-clamp-3">{card.description}</p>

                  <ul className="space-y-0.5 mb-2.5">
                    {card.features.map(f => (
                      <li key={f} className="text-[10px] text-gray-600 flex items-start gap-1">
                        <span className="text-gray-300 mt-0.5">•</span>
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => navigate(card.route)}
                    className="mt-auto flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors self-start"
                  >
                    <ArrowRight className="h-3 w-3" />
                    View Full Report
                  </button>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default Accounts
