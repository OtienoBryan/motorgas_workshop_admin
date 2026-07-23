import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PdfHeaderOptions {
  title: string
  subtitle?: string
  logoUrl?: string
}

export interface ExportPdfOptions {
  orientation?: 'p' | 'l'
  header?: PdfHeaderOptions
}

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = dataUrl
    })
    return { dataUrl, width, height }
  } catch {
    return null
  }
}

/** Renders a DOM element to a paginated A4 PDF, scaled to fit the page width
 *  with margins, and triggers a download. Optionally draws a title/logo
 *  header (outside the captured content) on the first page. */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: ExportPdfOptions
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF(options?.orientation ?? 'p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2

  let headerHeight = 0
  const header = options?.header
  if (header) {
    const logoHeightMm = 14
    let textX = margin

    if (header.logoUrl) {
      const logo = await loadImageAsDataUrl(header.logoUrl)
      if (logo) {
        const logoWidthMm = (logo.width / logo.height) * logoHeightMm
        pdf.addImage(logo.dataUrl, 'JPEG', margin, margin, logoWidthMm, logoHeightMm)
        textX = margin + logoWidthMm + 5
      }
    }

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(20, 20, 20)
    pdf.text(header.title, textX, margin + 6)

    if (header.subtitle) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(100, 100, 100)
      pdf.text(header.subtitle, textX, margin + 12)
    }

    headerHeight = logoHeightMm + 5
    pdf.setDrawColor(210, 210, 210)
    pdf.line(margin, margin + headerHeight, pageWidth - margin, margin + headerHeight)
    headerHeight += 4
  }

  const contentHeight = pageHeight - margin * 2
  const firstPageContentHeight = contentHeight - headerHeight

  // mm per canvas pixel, once the canvas is scaled down to fit the page width
  const pxToMm = contentWidth / canvas.width
  const firstPageSliceHeightPx = firstPageContentHeight / pxToMm
  const pageSliceHeightPx = contentHeight / pxToMm

  let renderedPx = 0
  let firstPage = true

  while (renderedPx < canvas.height) {
    const maxSlicePx = firstPage ? firstPageSliceHeightPx : pageSliceHeightPx
    const sliceHeightPx = Math.min(maxSlicePx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

    if (!firstPage) pdf.addPage()
    const sliceHeightMm = sliceHeightPx * pxToMm
    const y = firstPage ? margin + headerHeight : margin
    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, y, contentWidth, sliceHeightMm)

    renderedPx += sliceHeightPx
    firstPage = false
  }

  pdf.save(filename)
}
