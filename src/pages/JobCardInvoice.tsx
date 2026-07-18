import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApiService, JobCard } from '../services/api'
import JobCardInvoiceDocument from '../components/JobCardInvoiceDocument'
import { exportElementToPdf } from '../utils/pdf'
import { ESTIMATE_STAGE_STATUSES } from './JobCardForm'
import { ChevronLeft, Printer, Download, Loader2 } from 'lucide-react'

const JobCardInvoice: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [jobCard, setJobCard] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    adminApiService.getJobCard(Number(id))
      .then(setJobCard)
      .catch(() => setJobCard(null))
      .finally(() => setLoading(false))
  }, [id])

  const isQuotation = jobCard ? ESTIMATE_STAGE_STATUSES.includes(jobCard.status) : false
  const docLabel = isQuotation ? 'Quotation' : 'Invoice'

  const handleExportPdf = async () => {
    const target = documentRef.current?.querySelector('.invoice-printable') as HTMLElement | null
    if (!target || !jobCard) return
    try {
      setExporting(true)
      const clientName = jobCard.conversionClient?.name?.trim().replace(/[^a-zA-Z0-9]+/g, '-') || 'Client'
      await exportElementToPdf(target, `${docLabel}-${clientName}-${jobCard.id}.pdf`)
    } catch (err) {
      alert('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-green-600" />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={() => navigate('/job-cards')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ChevronLeft className="h-4 w-4" /> Back to Job Cards
        </button>
        <p className="text-center text-sm text-gray-400 mt-16">Job card not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-printable, .invoice-printable * { visibility: visible; }
          .invoice-printable { position: absolute; top: 0; left: 0; width: 100%; margin: 0; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <button onClick={() => navigate(`/job-cards/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Back to Job Card
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print {docLabel}
          </button>
        </div>
      </div>

      <div ref={documentRef}>
        <JobCardInvoiceDocument
          jobCard={jobCard}
          className="invoice-printable max-w-5xl mx-auto my-6 shadow-lg"
        />
      </div>
    </div>
  )
}

export default JobCardInvoice
