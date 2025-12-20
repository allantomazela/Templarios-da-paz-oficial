import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Download, ExternalLink } from 'lucide-react'
import { format, addHours } from 'date-fns'

interface AddToCalendarProps {
  event: {
    title: string
    description?: string
    location?: string
    date: string // ISO string or date string
  }
  variant?: 'outline' | 'default' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function AddToCalendar({
  event,
  variant = 'outline',
  size = 'sm',
}: AddToCalendarProps) {
  const getEventDates = () => {
    // Assume event starts at a default time if only date is provided, or parse full ISO
    // If date string only (YYYY-MM-DD), append default time 20:00
    const dateStr = event.date.includes('T')
      ? event.date
      : `${event.date}T20:00:00`
    const start = new Date(dateStr)
    const end = addHours(start, 2) // Default 2 hours duration

    return {
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startFormatted: format(start, "yyyyMMdd'T'HHmmss"),
      endFormatted: format(end, "yyyyMMdd'T'HHmmss"),
    }
  }

  const handleGoogleCalendar = () => {
    const { startFormatted, endFormatted } = getEventDates()
    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.append('action', 'TEMPLATE')
    url.searchParams.append('text', event.title)
    url.searchParams.append('dates', `${startFormatted}/${endFormatted}`)
    url.searchParams.append('details', event.description || '')
    url.searchParams.append('location', event.location || '')
    window.open(url.toString(), '_blank')
  }

  const handleOutlookCalendar = () => {
    const { startISO, endISO } = getEventDates()
    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
    url.searchParams.append('path', '/calendar/action/compose')
    url.searchParams.append('rru', 'addevent')
    url.searchParams.append('startdt', startISO)
    url.searchParams.append('enddt', endISO)
    url.searchParams.append('subject', event.title)
    url.searchParams.append('body', event.description || '')
    url.searchParams.append('location', event.location || '')
    window.open(url.toString(), '_blank')
  }

  const handleDownloadICS = () => {
    const { startFormatted, endFormatted } = getEventDates()
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Templarios da Paz//Event//PT',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@templariosdapaz.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Adicionar à Agenda</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <ExternalLink className="mr-2 h-4 w-4" /> Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          <ExternalLink className="mr-2 h-4 w-4" /> Outlook Web
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="mr-2 h-4 w-4" /> Download .ICS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
