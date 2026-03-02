/**
 * Feriados nacionais e dias comemorativos do Brasil.
 * Gera eventos no formato da agenda (date YYYY-MM-DD, title, type) para um ano.
 */

/** Retorna o domingo de Páscoa (Gregoriano) para o ano dado. */
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function formatYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type HolidayEventType = 'Feriado' | 'Comemorativo'

export interface BrazilianHolidayItem {
  date: string
  title: string
  type: HolidayEventType
  description?: string
}

/**
 * Gera a lista de feriados nacionais e dias comemorativos para o ano.
 * Inclui datas fixas e móveis (Páscoa, Carnaval, Corpus Christi).
 */
export function getBrazilianHolidaysAndComemorativos(year: number): BrazilianHolidayItem[] {
  const easter = getEasterSunday(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  const carnivalTuesday = new Date(easter)
  carnivalTuesday.setDate(easter.getDate() - 47)
  const corpusChristi = new Date(easter)
  corpusChristi.setDate(easter.getDate() + 60)

  const items: BrazilianHolidayItem[] = [
    // --- Feriados nacionais (fixos) ---
    { date: `${year}-01-01`, title: 'Confraternização Universal', type: 'Feriado' },
    { date: `${year}-04-21`, title: 'Tiradentes', type: 'Feriado' },
    { date: `${year}-05-01`, title: 'Dia do Trabalho', type: 'Feriado' },
    { date: `${year}-09-07`, title: 'Independência do Brasil', type: 'Feriado' },
    { date: `${year}-10-12`, title: 'Nossa Senhora Aparecida', type: 'Feriado' },
    { date: `${year}-11-02`, title: 'Finados', type: 'Feriado' },
    { date: `${year}-11-15`, title: 'Proclamação da República', type: 'Feriado' },
    { date: `${year}-11-20`, title: 'Dia da Consciência Negra', type: 'Feriado' },
    { date: `${year}-12-25`, title: 'Natal', type: 'Feriado' },
    // --- Feriados móveis ---
    { date: formatYMD(goodFriday), title: 'Sexta-feira Santa', type: 'Feriado' },
    { date: formatYMD(easter), title: 'Páscoa', type: 'Feriado' },
    { date: formatYMD(corpusChristi), title: 'Corpus Christi', type: 'Feriado' },
    // Carnaval (ponto facultativo, mas muito relevante para planejamento)
    { date: formatYMD(carnivalTuesday), title: 'Carnaval', type: 'Comemorativo', description: 'Ponto facultativo' },
    // --- Dias comemorativos (não são feriado nacional, mas úteis para organização) ---
    { date: `${year}-03-08`, title: 'Dia Internacional da Mulher', type: 'Comemorativo' },
    { date: `${year}-04-22`, title: 'Descobrimento do Brasil', type: 'Comemorativo' },
    { date: `${year}-06-12`, title: 'Dia dos Namorados', type: 'Comemorativo' },
    { date: `${year}-09-05`, title: 'Dia da Amazônia', type: 'Comemorativo' },
    { date: `${year}-10-12`, title: 'Dia das Crianças (BR)', type: 'Comemorativo' },
    { date: `${year}-11-19`, title: 'Dia da Bandeira', type: 'Comemorativo' },
  ]

  // Dia das Mães: segundo domingo de maio
  let sundayCount = 0
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, 4, d)
    if (date.getDay() === 0) {
      sundayCount++
      if (sundayCount === 2) {
        items.push({ date: formatYMD(date), title: 'Dia das Mães', type: 'Comemorativo', description: 'Segundo domingo de maio' })
        break
      }
    }
  }
  // Dia dos Pais: segundo domingo de agosto
  let sundayCountAug = 0
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, 7, d)
    if (date.getDay() === 0) {
      sundayCountAug++
      if (sundayCountAug === 2) {
        items.push({ date: formatYMD(date), title: 'Dia dos Pais', type: 'Comemorativo', description: 'Segundo domingo de agosto' })
        break
      }
    }
  }

  return items
}
