import { Button } from '@/components/ui/button'
import { Event } from '@/lib/data'
import { Calendar as CalendarIcon, Download, ExternalLink } from 'lucide-react'
import { format, addHours } from 'date-fns'

interface CalendarExportButtonsProps {
  event: Event
}

export function CalendarExportButtons({ event }: CalendarExportButtonsProps) {
  const getEventDates = () => {
    const start = new Date(`${event.date}T${event.time}`)
    const end = addHours(start, 2) // Assume 2 hours duration default
    return {
      start: format(start, "yyyyMMdd'T'HHmmss"),
      end: format(end, "yyyyMMdd'T'HHmmss"),
    }
  }

  const handleGoogleCalendar = () => {
    const { start, end } = getEventDates()
    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.append('action', 'TEMPLATE')
    url.searchParams.append('text', event.title)
    url.searchParams.append('dates', `${start}/${end}`)
    url.searchParams.append('details', event.description || '')
    url.searchParams.append('location', event.location || '')
    window.open(url.toString(), '_blank')
  }

  const handleOutlookCalendar = () => {
    const start = new Date(`${event.date}T${event.time}`).toISOString()
    const end = addHours(
      new Date(`${event.date}T${event.time}`),
      2,
    ).toISOString()

    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
    url.searchParams.append('path', '/calendar/action/compose')
    url.searchParams.append('rru', 'addevent')
    url.searchParams.append('startdt', start)
    url.searchParams.append('enddt', end)
    url.searchParams.append('subject', event.title)
    url.searchParams.append('body', event.description || '')
    url.searchParams.append('location', event.location || '')
    window.open(url.toString(), '_blank')
  }

  const handleDownloadICS = () => {
    const { start, end } = getEventDates()
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Templarios da Paz//Agenda//PT',
      'BEGIN:VEVENT',
      `UID:${event.id}@templariosdapaz.com`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
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
    <div className="flex flex-wrap gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGoogleCalendar}
        className="flex-1"
      >
        <ExternalLink className="mr-2 h-3 w-3" /> Google
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOutlookCalendar}
        className="flex-1"
      >
        <CalendarIcon className="mr-2 h-3 w-3" /> Outlook
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadICS}
        className="flex-1"
      >
        <Download className="mr-2 h-3 w-3" /> .ICS
      </Button>
    </div>
  )
}
