/** Estilos para impressão A4 da prancha (saco de propostas). */
export const LODGE_PRANCHA_PRINT_STYLE = `
  @page { size: A4; margin: 14mm 16mm; }
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
