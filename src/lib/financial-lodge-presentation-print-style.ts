/**
 * Estilos para o PDF / impressão da apresentação da Tesouraria.
 * Anula `body * { visibility: hidden }` de main.css (mesmo padrão dos demais relatórios).
 */
export const LODGE_PRESENTATION_PRINT_STYLE = `
  @page { size: A4 landscape; margin: 12mm; }
  @media print {
    html, body {
      background: white !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body, body * {
      visibility: visible !important;
    }
    .no-print {
      display: none !important;
    }
    .lodge-presentation-slide {
      break-after: page;
      page-break-after: always;
    }
    .lodge-presentation-slide:last-child {
      break-after: auto;
      page-break-after: auto;
    }
  }
`
