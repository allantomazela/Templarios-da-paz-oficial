/** Impressão A4 da prancha ornamental (fundo do modelo, sem margens laterais grandes). */
export const LODGE_PRANCHA_PRINT_STYLE = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
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
    .lodge-prancha-document {
      width: 210mm !important;
      height: 297mm !important;
      max-width: none !important;
      margin: 0 !important;
      box-shadow: none !important;
      color: #0a0a0a !important;
      font-family: Georgia, 'Times New Roman', Times, serif !important;
      font-size: 12pt !important;
      line-height: 1.55 !important;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .lodge-prancha-document,
    .lodge-prancha-document * {
      letter-spacing: normal !important;
      word-spacing: normal !important;
      text-transform: none !important;
    }
    .lodge-prancha-document p,
    .lodge-prancha-document span,
    .lodge-prancha-document strong {
      color: #0a0a0a !important;
      font-size: inherit !important;
      line-height: 1.55 !important;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      white-space: normal !important;
    }
  }
`
