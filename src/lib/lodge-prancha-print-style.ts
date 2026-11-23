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
      overflow: hidden !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .lodge-prancha-document,
    .lodge-prancha-document * {
      letter-spacing: normal !important;
      word-spacing: normal !important;
      text-transform: none !important;
      font-family: Georgia, 'Times New Roman', Times, serif !important;
    }
    .lodge-prancha-document .prancha-panel,
    .lodge-prancha-document .prancha-panel * {
      color: #0a0a0a !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-wrap: break-word !important;
      word-break: break-word !important;
      max-width: 100% !important;
    }
    .lodge-prancha-document .prancha-panel {
      overflow: hidden !important;
      min-width: 0 !important;
    }
    .lodge-prancha-document .prancha-fit-content,
    .lodge-prancha-document .prancha-body,
    .lodge-prancha-document .prancha-rich-body {
      min-width: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    .lodge-prancha-document .prancha-rich-body p {
      margin: 0 0 0.7em 0 !important;
      line-height: 1.55 !important;
      font-size: inherit !important;
      color: #0a0a0a !important;
      white-space: normal !important;
    }
    .lodge-prancha-document strong,
    .lodge-prancha-document b {
      font-weight: 700 !important;
      color: #0a0a0a !important;
    }
    .lodge-prancha-document em,
    .lodge-prancha-document i {
      font-style: italic !important;
      color: #0a0a0a !important;
    }
    .lodge-prancha-document u {
      text-decoration: underline !important;
      color: #0a0a0a !important;
    }
    .lodge-prancha-document .prancha-panel .prancha-title,
    .lodge-prancha-document .prancha-panel .prancha-kicker {
      color: #6b1212 !important;
    }
  }
`
