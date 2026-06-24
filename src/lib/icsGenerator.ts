import { format } from 'date-fns'

interface IcsEvent {
  title: string
  description?: string | null
  date: string
  start_time?: string | null
  end_time?: string | null
  color?: string
  created_at?: string
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatIcsDate(dateStr: string, timeStr?: string | null): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (timeStr) {
    const parts = timeStr.split(':')
    d.setHours(parseInt(parts[0] || '0'), parseInt(parts[1] || '0'), 0)
    return format(d, "yyyyMMdd'T'HHmmss")
  }
  return format(d, 'yyyyMMdd')
}

export function generateIcs(events: IcsEvent[]): string {
  const now = format(new Date(), "yyyyMMdd'T'HHmmss")
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NetFlow//Calendario//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NetFlow Calendario',
  ]

  for (const event of events) {
    const dtStart = formatIcsDate(event.date, event.start_time)
    const dtEnd = event.end_time
      ? formatIcsDate(event.date, event.end_time)
      : formatIcsDate(event.date, event.start_time || undefined)

    const uid = `${event.title.replace(/\s+/g, '-')}-${event.date}-${event.created_at ?? now}@netflow`

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(`SUMMARY:${escapeIcs(event.title)}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcs(event.description)}`)
    }
    if (event.color) {
      lines.push(`COLOR:${event.color}`)
    }
    lines.push(`DTSTAMP:${now}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(events: IcsEvent[], filename = 'netflow-calendario.ics'): void {
  const ics = generateIcs(events)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
