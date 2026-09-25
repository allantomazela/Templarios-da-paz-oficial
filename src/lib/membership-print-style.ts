/** Estilos injetados no iframe do react-to-print.
 * Precisam anular `body * { visibility: hidden }` de main.css. */
export const MEMBERSHIP_PRINT_STYLE = `
  @page { size: A4; margin: 12mm; }
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
  }
`

export const MEMBERSHIP_PRINT_STYLE_LANDSCAPE = `
  @page { size: A4 landscape; margin: 10mm; }
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
  }
`
