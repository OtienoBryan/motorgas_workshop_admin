import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Renders a DOM element to a paginated A4 PDF, scaled to fit the page width
 *  with margins, and triggers a download. */
export async function exportElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2

  // mm per canvas pixel, once the canvas is scaled down to fit the page width
  const pxToMm = contentWidth / canvas.width
  const pageSliceHeightPx = contentHeight / pxToMm

  let renderedPx = 0
  let firstPage = true

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

    if (!firstPage) pdf.addPage()
    const sliceHeightMm = sliceHeightPx * pxToMm
    pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', margin, margin, contentWidth, sliceHeightMm)

    renderedPx += sliceHeightPx
    firstPage = false
  }

  pdf.save(filename)
}
