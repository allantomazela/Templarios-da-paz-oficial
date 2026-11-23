/** Impressão A4 da prancha ornamental — tipografia isolada do tema. */
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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .lodge-prancha-document,
    .lodge-prancha-document * {
      letter-spacing: normal !important;
      word-spacing: normal !important;
      text-transform: none !important;
      color: #0a0a0a !important;
      font-family: Georgia, 'Times New Roman', Times, serif !important;
      line-height: 1.6 !important;
      white-space: normal !important;
    }
  }
`
