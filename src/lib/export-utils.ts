/**
 * Utilitários para exportação de dados
 */

export interface ExportableMessage {
  id: string
  name: string
  email: string
  message: string
  status: string
  category?: string
  created_at: string
  updated_at: string
  reply_text?: string
  replied_at?: string
}

/**
 * Exporta mensagens para CSV
 */
export function exportToCSV(
  messages: ExportableMessage[],
  filename: string = 'mensagens-contato',
): void {
  if (messages.length === 0) {
    throw new Error('Nenhuma mensagem para exportar')
  }

  // Cabeçalhos
  const headers = [
    'ID',
    'Nome',
    'Email',
    'Mensagem',
    'Status',
    'Categoria',
    'Data de Envio',
    'Data de Atualização',
    'Resposta',
    'Data de Resposta',
  ]

  // Converter dados para CSV
  const rows = messages.map((msg) => [
    msg.id,
    `"${msg.name.replace(/"/g, '""')}"`,
    `"${msg.email.replace(/"/g, '""')}"`,
    `"${msg.message.replace(/"/g, '""')}"`,
    msg.status,
    msg.category || '',
    new Date(msg.created_at).toLocaleString('pt-BR'),
    new Date(msg.updated_at).toLocaleString('pt-BR'),
    msg.reply_text ? `"${msg.reply_text.replace(/"/g, '""')}"` : '',
    msg.replied_at
      ? new Date(msg.replied_at).toLocaleString('pt-BR')
      : '',
  ])

  // Combinar cabeçalhos e linhas
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  // Adicionar BOM para Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })

  // Criar link de download
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Exporta mensagens para PDF (usando window.print)
 * Cria uma página formatada para impressão
 */
export function exportToPDF(messages: ExportableMessage[]): void {
  if (messages.length === 0) {
    throw new Error('Nenhuma mensagem para exportar')
  }

  // Criar conteúdo HTML formatado
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Mensagens de Contato</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          font-size: 12px;
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .message-cell {
          max-width: 300px;
          word-wrap: break-word;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        @media print {
          @page {
            margin: 1cm;
          }
        }
      </style>
    </head>
    <body>
      <h1>Mensagens de Contato</h1>
      <p><strong>Total de mensagens:</strong> ${messages.length}</p>
      <p><strong>Data de exportação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Mensagem</th>
            <th>Status</th>
            <th>Categoria</th>
            <th>Data de Envio</th>
            <th>Resposta</th>
          </tr>
        </thead>
        <tbody>
          ${messages
            .map(
              (msg) => `
            <tr>
              <td>${msg.name}</td>
              <td>${msg.email}</td>
              <td class="message-cell">${msg.message}</td>
              <td>${msg.status}</td>
              <td>${msg.category || '-'}</td>
              <td>${new Date(msg.created_at).toLocaleString('pt-BR')}</td>
              <td class="message-cell">${msg.reply_text || '-'}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>Exportado em ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `

  // Criar nova janela para impressão
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Não foi possível abrir a janela de impressão')
  }

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
