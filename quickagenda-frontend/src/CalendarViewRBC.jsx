import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import enUS from 'date-fns/locale/en-US'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

// Props:
// - eventDate: Date
// - sessions: [{ id, title, startTime?: 'HH:mm' | ISO, endTime?: 'HH:mm' | ISO, location?, startHour?, endHour? }]
// - onSessionUpdate: (id, startHour, endHour) => void
// - onSessionRemove?: (id) => void
export default function CalendarView({ eventDate, sessions, onSessionUpdate, onSessionUpdateExact, onSessionRemove, readOnly = false }) {
  const locales = { 'en-US': enUS }
  const localizer = useMemo(() => dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales }), [])
  const theme = useTheme()
  const isDark = theme && theme.palette && theme.palette.mode === 'dark'

  const day = useMemo(() => (eventDate instanceof Date && !isNaN(eventDate)) ? eventDate : new Date(), [eventDate])

  const min = useMemo(() => { const d = new Date(day); d.setHours(8, 0, 0, 0); return d }, [day])
  const max = useMemo(() => { const d = new Date(day); d.setHours(20, 0, 0, 0); return d }, [day])

  const events = useMemo(() => (sessions || []).map(s => {
    const parseHM = (val, fallbackH, fallbackM = 0) => {
      if (val == null) return { h: fallbackH, m: fallbackM }
      if (Number.isFinite(val)) return { h: val, m: 0 }
      const str = String(val)
      const time = str.includes('T') ? str.substring(11, 16) : str.substring(0, 5)
      const [hh, mm] = (time || '').split(':').map(n => Number(n))
      return { h: Number.isFinite(hh) ? hh : fallbackH, m: Number.isFinite(mm) ? mm : fallbackM }
    }
    const { h: sh, m: sm } = s.startTime ? parseHM(s.startTime, 9, 0) : parseHM(s.startHour, 9, 0)
    const { h: eh, m: em } = s.endTime ? parseHM(s.endTime, (sh || 9) + 1, sm) : parseHM(s.endHour, (sh || 9) + 1, sm)
    const start = new Date(day); start.setHours(sh || 9, sm || 0, 0, 0)
    const end = new Date(day); end.setHours((eh || (sh || 9) + 1), em || 0, 0, 0)
    return { id: s.id, title: s.title || 'Session', start, end, draggable: !readOnly }
  }), [sessions, day, readOnly])

  const DnDCalendar = useMemo(() => withDragAndDrop(Calendar), [])

  const onDrop = useCallback(({ event, start, end }) => {
    const hh = (n) => String(n).padStart(2, '0')
    const sh = start.getHours(); const sm = start.getMinutes()
    let eh = end.getHours(); let em = end.getMinutes()
    const startMs = start.getTime(); const endMs = end.getTime()
    if (endMs <= startMs) { const adj = new Date(startMs + 30 * 60 * 1000); eh = adj.getHours(); em = adj.getMinutes() }
    if (typeof onSessionUpdateExact === 'function') {
      onSessionUpdateExact(event.id, `${hh(sh)}:${hh(sm)}`, `${hh(eh)}:${hh(em)}`)
    } else if (typeof onSessionUpdate === 'function') {
      onSessionUpdate(event.id, sh, Math.max(sh + 1, eh))
    }
  }, [onSessionUpdate, onSessionUpdateExact])

  const onResize = useCallback(({ event, start, end }) => {
    const hh = (n) => String(n).padStart(2, '0')
    const sh = start.getHours(); const sm = start.getMinutes()
    let eh = end.getHours(); let em = end.getMinutes()
    const startMs = start.getTime(); const endMs = end.getTime()
    if (endMs <= startMs) { const adj = new Date(startMs + 30 * 60 * 1000); eh = adj.getHours(); em = adj.getMinutes() }
    if (typeof onSessionUpdateExact === 'function') {
      onSessionUpdateExact(event.id, `${hh(sh)}:${hh(sm)}`, `${hh(eh)}:${hh(em)}`)
    } else if (typeof onSessionUpdate === 'function') {
      onSessionUpdate(event.id, sh, Math.max(sh + 1, eh))
    }
  }, [onSessionUpdate, onSessionUpdateExact])

  const EventContent = useCallback(({ event }) => {
    const pad = (n) => String(n).padStart(2, '0')
    const time = `${pad(event.start.getHours())}:${pad(event.start.getMinutes())} – ${pad(event.end.getHours())}:${pad(event.end.getMinutes())}`
    return (
      <div style={{ position: 'relative', padding: '8px 28px 8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
        <div style={{ fontSize: 12, color: '#334155' }}>{time}</div>
        {onSessionRemove && !readOnly && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onSessionRemove(event.id) }}
            title="Remove session"
            style={{ position: 'absolute', top: 4, right: 4, background: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)', border: '1px solid rgba(15,23,42,0.12)' }}
          >
            <CloseIcon fontSize="small" sx={{ color: '#0f172a' }} />
          </IconButton>
        )}
      </div>
    )
  }, [onSessionRemove, readOnly, isDark])

  // Resizable width for the calendar area
  const [calWidth, setCalWidth] = useState(560)
  const resizeRef = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!resizeRef.current) return
      const dx = e.clientX - resizeRef.current.startX
      const next = Math.max(480, Math.min(1200, resizeRef.current.base + dx))
      setCalWidth(next)
    }
    const onUp = () => { resizeRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div className="qa-calendar" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
        {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(day)}
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
        <div style={{ position: 'relative', width: calWidth, maxWidth: '100%' }}>
          <DndProvider backend={HTML5Backend}>
            <DnDCalendar
              localizer={localizer}
              date={day}
              onNavigate={() => {}}
              defaultView={Views.DAY}
              views={[Views.DAY]}
              events={events}
              onEventDrop={readOnly ? undefined : onDrop}
              onEventResize={readOnly ? undefined : onResize}
              resizable={!readOnly}
              draggableAccessor="draggable"
              step={30}
              timeslots={2}
              min={min}
              max={max}
              toolbar={false}
              style={{ height: 44 * 13 + 80, width: '100%' }}
              eventPropGetter={() => ({
                style: {
                  backgroundColor: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  color: '#0f172a',
                  borderRadius: 10,
                  boxShadow: '0 2px 6px rgba(15,23,42,0.08)',
                  overflow: 'hidden'
                }
              })}
              components={{ event: EventContent }}
            />
          </DndProvider>
          {!readOnly && (
            <div
              onMouseDown={(e) => { resizeRef.current = { startX: e.clientX, base: calWidth } }}
              title="Drag to resize width"
              style={{ position: 'absolute', top: 0, right: 0, width: 10, height: '100%', cursor: 'col-resize', background: 'rgba(0,0,0,0.06)', borderTopRightRadius: 10, borderBottomRightRadius: 10, zIndex: 2 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
