function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatIcsDate(dateStr: string, timeStr?: string | null): string {
  const d = new Date(dateStr + 'T12:00:00')
  if (timeStr) {
    const [h, m] = timeStr.split(':')
    d.setHours(parseInt(h), parseInt(m), 0)
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
  }
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function nowIcs(): string {
  const d = new Date()
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function generateIcs(events: Array<{
  title: string
  description?: string | null
  date: string
  start_time?: string | null
  end_time?: string | null
  created_at?: string | null
}>): string {
  const now = nowIcs()
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
    lines.push(`DTSTAMP:${now}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

export async function onRequest(context) {
  const { token } = context.params
  const supabaseUrl = context.env.VITE_SUPABASE_URL
  const supabaseKey = context.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response('Server configuration error', { status: 500, headers: CORS_HEADERS })
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_calendar_events_by_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ p_token: token }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      console.error(`ICS feed: Supabase returned ${response.status} for token ${token}: ${errorBody}`)
      return new Response('Calendario non trovato', { status: 404, headers: CORS_HEADERS })
    }

    const events = await response.json()
    const ics = generateIcs(events)

    return new Response(ics, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="netflow-calendario.ics"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (err) {
    console.error('ICS feed error:', err)
    return new Response('Errore interno', { status: 500, headers: CORS_HEADERS })
  }
}
