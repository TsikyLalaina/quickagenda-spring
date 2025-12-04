import React, { useMemo, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

// Props:
// - eventDate: Date
// - sessions: [{ id, title, startTime?: 'HH:mm', endTime?: 'HH:mm', location?, startHour?, endHour? }]
// - onSessionUpdate: (id, startHour, endHour) => void
// - onSessionRemove?: (id) => void
export default function CalendarView({ eventDate, sessions, onSessionUpdate, onSessionRemove, readOnly = false }) {
  const hours = useMemo(() => Array.from({ length: 13 }, (_, i) => 8 + i), []) // 8..20
  const HOUR_PX = 140
  const resizeRef = useRef(null)
  const isResizingRef = useRef(false)

  const title = useMemo(() => {
    if (!(eventDate instanceof Date) || isNaN(eventDate)) return 'Pick a date'
    return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(eventDate)
  }, [eventDate])

  const parseHour = (t) => {
    if (!t) return null
    const [h] = String(t).split(':').map(Number)
    return isNaN(h) ? null : h
  }

  const sessionHourRange = (s) => {
    const sh = s.startHour ?? parseHour(s.startTime)
    const eh = s.endHour ?? parseHour(s.endTime)
    return { sh, eh }
  }

  const byHour = useMemo(() => {
    const map = new Map(hours.map(h => [h, []]))
    sessions.forEach(s => {
      const { sh } = sessionHourRange(s)
      const bucket = map.get(sh)
      if (bucket) bucket.push(s)
    })
    return map
  }, [sessions, hours])

  const onDragEnd = (result) => {
    const { destination, draggableId, source } = result
    if (!destination) return
    // If resize was active, don't process drag
    if (isResizingRef.current) {
      isResizingRef.current = false
      return
    }
    // If dropped in same location, don't update
    if (source.droppableId === destination.droppableId) return
    const destHour = parseInt(destination.droppableId.replace('hour-', ''), 10)
    const session = sessions.find(s => String(s.id) === String(draggableId))
    if (!session) return
    const { sh, eh } = sessionHourRange(session)
    const duration = Math.max(1, (eh ?? sh ?? 9) - (sh ?? 9))
    // Ensure newStart and newEnd are within valid range
    const newStart = Math.max(8, Math.min(19, destHour))
    const newEnd = Math.min(20, newStart + duration)
    onSessionUpdate(session.id, newStart, newEnd)
  }

  // Bottom-edge resize to adjust end hour by ~hour steps
  useEffect(() => {
    const onMove = (e) => {
      const r = resizeRef.current
      if (!r) return
      isResizingRef.current = true
      e.preventDefault()
      e.stopPropagation()
      const dy = e.clientY - r.startY
      // Use 22px threshold (half of 44px) for better rounding
      const delta = Math.round(dy / 22) / 2
      const nextEnd = Math.min(20, Math.max(r.sh + 1, r.baseEnd + delta))
      r.lastEnd = nextEnd
    }
    const onUp = () => {
      const r = resizeRef.current
      if (r) {
        const finalEnd = r.lastEnd ?? r.baseEnd
        if (finalEnd !== r.baseEnd && typeof onSessionUpdate === 'function') {
          onSessionUpdate(r.id, r.sh, finalEnd)
        }
      }
      resizeRef.current = null
      isResizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    if (resizeRef.current) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onMove)
      window.addEventListener('touchend', onUp)
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [onSessionUpdate])

  const shell = (
    <div className="qa-calendar" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, overflowX: 'auto' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div className="qa-cal-grid" style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 8 }}>
        <div className="qa-cal-hours">
          {hours.map(h => (
            <div key={`label-${h}`} style={{ height: 44, borderTop: '1px solid #f1f5f9', color: '#64748b' }}>
              {h <= 12 ? `${h} AM` : `${h - 12} PM`}
            </div>
          ))}
        </div>
        <div>
          {readOnly ? (
            hours.map(h => (
              <div key={`row-${h}`} style={{
                height: 44,
                borderTop: '1px solid #f1f5f9',
                padding: 4,
                position: 'relative',
                display: 'block',
                overflow: 'visible',
              }}>
                {(byHour.get(h) || []).map((s) => {
                  const { sh, eh } = sessionHourRange(s)
                  const dur = Math.max(1, (eh ?? (sh ?? 9) + 1) - (sh ?? 9))
                  return (
                  <div key={s.id} className="qa-cal-session" style={{
                    border: '1px solid #93c5fd',
                    background: '#dbeafe',
                    borderRadius: 6,
                    padding: '4px 6px',
                    width: `${dur * HOUR_PX}px`,
                    minWidth: `${HOUR_PX}px`,
                    height: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    marginBottom: 4,
                  }} title={`${s.title}${s.location ? ' @ ' + s.location : ''}`}>
                    <div style={{ fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: '#334155' }}>{(sh ?? '-')}:00 – {(eh ?? (sh ?? 9) + 1)}:00</div>
                  </div>
                )})}

              </div>
            ))
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              {hours.map(h => (
                <Droppable droppableId={`hour-${h}`} key={`drop-${h}`} direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        minHeight: 44,
                        borderTop: '1px solid #f1f5f9',
                        background: snapshot.isDraggingOver ? '#f0f9ff' : 'transparent',
                        padding: 4,
                        position: 'relative',
                        display: 'block',
                      }}
                    >
                      {(byHour.get(h) || []).map((s, idx) => (
                        <Draggable draggableId={String(s.id)} index={idx} key={s.id}>
                          {(prov, snap) => {
                            const { sh, eh } = sessionHourRange(s)
                            const dur = Math.max(1, (eh ?? (sh ?? 9) + 1) - (sh ?? 9))
                            const beginResize = (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              resizeRef.current = { id: s.id, sh: sh ?? 9, baseEnd: (eh ?? (sh ?? 9) + 1), startY: e.clientY, lastEnd: eh ?? (sh ?? 9) + 1 }
                            }
                            return (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="qa-cal-session"
                              style={{
                                ...prov.draggableProps.style,
                                border: '1px solid #93c5fd',
                                background: '#dbeafe',
                                borderRadius: 6,
                                padding: '4px 6px',
                                boxShadow: snap.isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
                                width: `${dur * HOUR_PX}px`,
                                minWidth: `${HOUR_PX}px`,
                                height: 32,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                position: 'relative',
                                marginBottom: 4,
                              }}
                              title={`${s.title}${s.location ? ' @ ' + s.location : ''}`}
                            >
                              <div style={{ fontWeight: 600, color: '#1e3a8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{s.title}</div>
                              <div style={{ fontSize: 11, color: '#334155' }}>{(sh ?? '-')}:00 – {(eh ?? (sh ?? 9) + 1)}:00</div>
                              {onSessionRemove && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onSessionRemove(s.id) }}
                                  title="Remove session"
                                  style={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 20,
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#1e3a8a',
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    lineHeight: 1,
                                  }}
                                >
                                  ×
                                </button>
                              )}
                              <div
                                onMouseDown={beginResize}
                                onTouchStart={beginResize}
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: 6,
                                  cursor: 'ns-resize',
                                  background: 'rgba(0,0,0,0.1)',
                                  borderRadius: '0 0 6px 6px',
                                }}
                                title="Drag to resize duration"
                              />
                            </div>
                            )}}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  )

  return shell
}
