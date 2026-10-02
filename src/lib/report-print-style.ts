/** Estilo de página padrão (A4, margens 15mm/20mm, cores fiéis) dos relatórios impressos. */
export const A4_REPORT_PRINT_STYLE = `
  @page { size: A4; margin: 15mm 20mm; }
  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`
