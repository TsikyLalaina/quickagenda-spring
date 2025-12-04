import { useEffect, useState } from 'react'
import './App.css'
import CalendarView from './CalendarViewRBC'
import FormBuilder from './FormBuilder'
import ResponsesPanel from './ResponsesPanel'
import Container from '@mui/material/Container'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Skeleton from '@mui/material/Skeleton'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from './theme.jsx'

function hhmmAdd(start, minutes) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60)
  const nm = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(Math.max(0, Math.min(23, nh)))}:${pad(Math.max(0, Math.min(59, nm)))}`
}

function App() {
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('') // YYYY-MM-DD
  const [description, setDescription] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [duration, setDuration] = useState(60) // minutes
  const [localSessions, setLocalSessions] = useState([]) // before event is created
  const [shareCode, setShareCode] = useState(null)
  const [serverSessions, setServerSessions] = useState([]) // after event is created
  const [notice, setNotice] = useState({ type: null, text: '' }) // type: 'success' | 'error' | 'info'
  const [feedbackInput, setFeedbackInput] = useState('')
  const [feedbackList, setFeedbackList] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)
  const FEEDBACK_MAX = 300
  

  const loadFeedback = async () => {
    try {
      setFeedbackLoading(true)
      const res = await fetch('/api/feedback')
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setFeedbackList(data || [])
    } catch (e) {
      // ignore
    } finally { setFeedbackLoading(false) }
  }

  const resetEvent = () => {
    setShareCode(null)
    setServerSessions([])
    setLocalSessions([])
    setName('')
    setEventDate('')
    setDescription('')
    setSessionTitle('')
    setIsEditingEvent(false)
    try { localStorage.removeItem('qa:shareCode') } catch {}
    setNotice({ type: 'info', text: 'Start a new event' })
  }

  const startEditingEvent = () => {
    setEditingName(name)
    setEditingDescription(description)
    setEditingDate(eventDate)
    setIsEditingEvent(true)
  }

  const cancelEditingEvent = () => {
    setIsEditingEvent(false)
  }

  const saveEventChanges = async () => {
    if (!editingName || editingName.trim() === '') {
      setNotice({ type: 'error', text: 'Event name is required' })
      return
    }
    if (!editingDate) {
      setNotice({ type: 'error', text: 'Event date is required' })
      return
    }
    try {
      setSavingEvent(true)
      const res = await fetch(`/api/events/${shareCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName, description: editingDescription, eventDate: editingDate })
      })
      if (!res.ok) throw new Error('Failed to update event')
      const updated = await res.json()
      setName(updated.name)
      setDescription(updated.description)
      setEventDate(updated.eventDate)
      setIsEditingEvent(false)
      setNotice({ type: 'success', text: 'Event updated' })
    } catch (e) {
      console.error(e)
      setNotice({ type: 'error', text: 'Error updating event' })
    } finally { setSavingEvent(false) }
  }

  

  useEffect(() => { loadFeedback() }, [])

  // Restore created event on refresh
  useEffect(() => {
    try {
      const stored = localStorage.getItem('qa:shareCode')
      if (stored && !shareCode) {
        setShareCode(stored)
        // Load sessions with IDs to restore monitoring UI
        fetch(`/api/events/${stored}`).then(r => r.ok ? r.json() : null).then(details => {
          if (!details) return
          if (details.sessions) setServerSessions(details.sessions)
          if (typeof details.name === 'string') setName(details.name)
          if (typeof details.description === 'string') setDescription(details.description || '')
          if (details.eventDate) setEventDate(details.eventDate)
        }).catch(() => {})
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist shareCode changes
  useEffect(() => {
    try {
      if (shareCode) localStorage.setItem('qa:shareCode', shareCode)
      else localStorage.removeItem('qa:shareCode')
    } catch {}
  }, [shareCode])

  const isCreated = !!shareCode

  const addToCalendar = async () => {
    if (!isCreated && !eventDate) {
      setNotice({ type: 'error', text: 'Pick an event date first' })
      return
    }
    const start = '09:00'
    const end = hhmmAdd(start, Number(duration))
    if (!isCreated) {
      const id = `tmp-${Date.now()}`
      setLocalSessions((prev) => [...prev, { id, title: (sessionTitle && sessionTitle.trim()) ? sessionTitle : 'Session', startTime: start, endTime: end, location: '' }])
      setSessionTitle('')
      setNotice({ type: 'success', text: 'Session added to calendar draft' })
    } else {
      try {
        const res = await fetch(`/api/events/${shareCode}/sessions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: (sessionTitle && sessionTitle.trim()) ? sessionTitle : 'Session', start, end, location: '' })
        })
        if (!res.ok) throw new Error('Failed to add session')
        const data = await res.json()
        setServerSessions(data.sessions || [])
        setSessionTitle('')
        setNotice({ type: 'success', text: 'Session added' })
      } catch (e) {
        console.error(e)
        setNotice({ type: 'error', text: 'Error adding session' })
      }
    }
  }

  const createEvent = async () => {
    if (!name || !eventDate) {
      setNotice({ type: 'error', text: 'Please enter event name and date' })
      return
    }
    const todayStr = new Date().toISOString().split('T')[0]
    if (eventDate < todayStr) {
      setNotice({ type: 'error', text: 'Event date cannot be in the past' })
      return
    }
    if (localSessions.length === 0) {
      setNotice({ type: 'error', text: 'Please add at least one session' })
      return
    }
    try {
      const body = {
        name,
        description,
        eventDate,
        sessions: localSessions.map((s) => ({ title: s.title, start: s.startTime, end: s.endTime, location: s.location || '' }))
      }
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to create event')
      const created = await res.json()
      setShareCode(created.shareCode)
      // Load sessions with IDs
      const detailsRes = await fetch(`/api/events/${created.shareCode}`)
      if (!detailsRes.ok) throw new Error('Failed to load created event details')
      const details = await detailsRes.json()
      setServerSessions(details.sessions || [])
      setLocalSessions([])
      setNotice({ type: 'success', text: `Event created! Share code: ${created.shareCode}` })
    } catch (e) {
      console.error(e)
      setNotice({ type: 'error', text: 'Error creating event' })
    }
  }

  const hh = (n) => String(n).padStart(2, '0')
  const toHHmmFromHour = (h) => `${hh(h)}:00`

  const handleSessionTimeChange = async (id, newStart, newEnd) => {
    if (!isCreated) {
      // Update local only
      setLocalSessions((prev) => prev.map(s => s.id === id ? { ...s, startTime: newStart, endTime: newEnd } : s))
      setNotice({ type: 'success', text: 'Session time updated' })
      return
    }
    try {
      const res = await fetch(`/api/events/${shareCode}/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: newStart, end: newEnd })
      })
      if (!res.ok) throw new Error('Failed to update session times')
      const data = await res.json()
      setServerSessions(data.sessions || [])
      setNotice({ type: 'success', text: 'Session time saved' })
    } catch (e) {
      console.error(e)
      setNotice({ type: 'error', text: 'Error updating session time' })
    }
  }

  const handleSessionUpdateByHour = (id, startHour, endHour) => {
    const start = toHHmmFromHour(startHour)
    const end = toHHmmFromHour(endHour)
    return handleSessionTimeChange(id, start, end)
  }

  // Preserve minutes (e.g., 09:30) coming from the calendar
  const handleSessionUpdateExact = (id, startHHmm, endHHmm) => {
    return handleSessionTimeChange(id, startHHmm, endHHmm)
  }

  const handleSessionRemove = async (id) => {
    if (!isCreated) {
      setLocalSessions(prev => prev.filter(s => String(s.id) !== String(id)))
      setNotice({ type: 'success', text: 'Session removed' })
      return
    }
    try {
      const res = await fetch(`/api/events/${shareCode}/sessions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete session')
      const data = await res.json()
      setServerSessions(data.sessions || [])
      setNotice({ type: 'success', text: 'Session removed' })
    } catch (e) {
      console.error(e)
      setNotice({ type: 'error', text: 'Error removing session' })
    }
  }

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {}
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.top = '-9999px'
      ta.setAttribute('readonly', '')
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  const getShareLink = async () => {
    if (!shareCode) {
      setNotice({ type: 'info', text: 'Create the event first' })
      return
    }
    const absolute = `${window.location.origin}/s/${shareCode}`
    try {
      const ok = await copyText(absolute)
      if (ok) {
        setNotice({ type: 'success', text: 'Share link copied to clipboard' })
      } else {
        setNotice({ type: 'info', text: absolute })
      }
    } catch {
      setNotice({ type: 'info', text: absolute })
    }
  }

  const sessionsForView = (isCreated ? serverSessions : localSessions).map(s => {
    // Extract time from ISO datetime (e.g., "2025-11-26T09:00:00" -> "09:00") or use as-is if already HH:mm
    const startTimeStr = s.startTime ? (s.startTime.includes('T') ? s.startTime.split('T')[1].substring(0, 5) : s.startTime) : ''
    const endTimeStr = s.endTime ? (s.endTime.includes('T') ? s.endTime.split('T')[1].substring(0, 5) : s.endTime) : ''
    const [sh] = (startTimeStr || '').split(':').map(Number)
    const [eh] = (endTimeStr || '').split(':').map(Number)
    return { ...s, startHour: sh, endHour: eh }
  })

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <CalendarMonthIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quickagenda
          </Typography>
          {/* Theme toggle */}
          {(() => { const { mode, toggle } = useThemeMode(); return (
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton aria-label="Toggle theme" color="inherit" onClick={toggle} size="large" sx={{ mr: 1 }}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          )})()}
          <IconButton aria-label="Copy share link" color="inherit" onClick={getShareLink} disabled={!isCreated} size="large">
            <ContentCopyIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3, overflowX: 'hidden' }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="flex-start" justifyContent="center">
          <Grid item xs={12} sm={6} md={6} sx={{ minWidth: 0 }}>
            <Stack spacing={{ xs: 2, md: 3 }} sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
              <Card>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography variant="h6" gutterBottom>{isEditingEvent ? 'Edit event' : 'Create event'}</Typography>
                  <Stack spacing={{ xs: 1.5, md: 2 }}>
                    <TextField label="Event name" value={isEditingEvent ? editingName : name} onChange={(e) => isEditingEvent ? setEditingName(e.target.value) : setName(e.target.value)} placeholder="BBQ" fullWidth disabled={isCreated && !isEditingEvent} />
                    <TextField label="Description (optional)" value={isEditingEvent ? editingDescription : description} onChange={(e) => isEditingEvent ? setEditingDescription(e.target.value) : setDescription(e.target.value)} fullWidth multiline rows={3} disabled={isCreated && !isEditingEvent} />
                    <TextField label="Event date" type="date" value={isEditingEvent ? editingDate : eventDate} onChange={(e) => isEditingEvent ? setEditingDate(e.target.value) : setEventDate(e.target.value)} inputProps={{ min: new Date().toISOString().split('T')[0] }} fullWidth InputLabelProps={{ shrink: true }} disabled={isCreated && !isEditingEvent} />
                    {isEditingEvent && (
                      <>
                        <Divider />
                        <Typography variant="subtitle2">Add session</Typography>
                        <TextField label="Session title" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Cake" fullWidth />
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={addToCalendar} fullWidth>
                          Add Session
                        </Button>
                      </>
                    )}
                    {!isCreated && (
                      <>
                        <Divider />
                        <TextField label="Session title" value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Cake" fullWidth />
                      </>
                    )}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      {!isCreated && (
                        <>
                          <Button variant="outlined" startIcon={<AddIcon />} onClick={addToCalendar} fullWidth>
                            Add to Calendar (9:00)
                          </Button>
                          <Button variant="contained" startIcon={<EventAvailableIcon />} onClick={createEvent} disabled={isCreated} fullWidth>
                            Create Event
                          </Button>
                        </>
                      )}
                      {isCreated && !isEditingEvent && (
                        <Button variant="outlined" onClick={startEditingEvent} fullWidth>
                          Edit Event
                        </Button>
                      )}
                      {isCreated && isEditingEvent && (
                        <>
                          <Button variant="contained" onClick={saveEventChanges} disabled={savingEvent} fullWidth>
                            Save Changes
                          </Button>
                          <Button variant="outlined" onClick={cancelEditingEvent} disabled={savingEvent} fullWidth>
                            Cancel
                          </Button>
                        </>
                      )}
                    </Stack>
                    {isCreated && !isEditingEvent && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="success.main" sx={{ flexGrow: 1 }}>Share code: {shareCode}</Typography>
                        <Button size="small" variant="text" color="secondary" onClick={resetEvent}>Create New Event</Button>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {isCreated && (
                <FormBuilder code={shareCode} />
              )}

              {isCreated && (
                <ResponsesPanel code={shareCode} />
              )}

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom><InfoOutlinedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />How it works</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Create your event: enter a name and pick a date." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Add sessions, then drag them on the calendar to adjust times." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="After creation, use Edit Event to change name/description/date and add or remove sessions (× on a session)." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Build your guest form (text, number, date, yes/no, radio, checkboxes) and save it." />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><InfoOutlinedIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Share the link or QR. View responses in the table. Guests can add sessions to their calendars (.ics)." />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Feedback</Typography>
                  <Stack spacing={1}>
                    <TextField
                      label="Suggest a feature…"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      multiline rows={3} fullWidth
                      helperText={`${Math.min(feedbackInput.length, FEEDBACK_MAX)}/${FEEDBACK_MAX}`}
                      error={feedbackInput.length > FEEDBACK_MAX}
                    />
                    <Button variant="contained" disabled={feedbackSubmitting || feedbackInput.trim().length === 0 || feedbackInput.length > FEEDBACK_MAX} onClick={async () => {
                      const text = (feedbackInput || '').trim()
                      if (!text) return
                      try {
                        setFeedbackSubmitting(true)
                        const res = await fetch('/api/feedback', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, source: 'app' })
                        })
                        if (!res.ok) throw new Error('submit failed')
                        setFeedbackInput('')
                        setNotice({ type: 'success', text: 'Thanks for your feedback!' })
                        loadFeedback()
                      } catch (e) {
                        setNotice({ type: 'error', text: 'Could not submit feedback' })
                      } finally { setFeedbackSubmitting(false) }
                    }}>
                      Submit feedback
                    </Button>
                  </Stack>
                  {feedbackLoading && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Stack spacing={1}>
                        <Skeleton variant="text" height={24} />
                        <Skeleton variant="text" height={24} />
                        <Skeleton variant="text" height={24} />
                      </Stack>
                    </>
                  )}
                  {!feedbackLoading && feedbackList.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <List dense>
                        {feedbackList.map(f => (
                          <ListItem key={f.id} alignItems="flex-start">
                            <ListItemIcon><ChatBubbleOutlineIcon /></ListItemIcon>
                            <ListItemText primary={f.text} secondary={f.createdAt ? new Date(f.createdAt).toLocaleString() : null} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={6} sx={{ position: { md: 'sticky' }, top: { md: 24 }, minWidth: 0 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom>Calendar preview</Typography>
                <CalendarView
                  eventDate={eventDate ? new Date(eventDate) : null}
                  sessions={sessionsForView}
                  onSessionUpdate={handleSessionUpdateByHour}
                  onSessionUpdateExact={handleSessionUpdateExact}
                  onSessionRemove={handleSessionRemove}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={!!notice.type}
        autoHideDuration={4000}
        onClose={() => setNotice({ type: null, text: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {notice.type && (
          <Alert severity={notice.type} onClose={() => setNotice({ type: null, text: '' })} sx={{ width: '100%' }}>
            {notice.text}
          </Alert>
        )}
      </Snackbar>
    </>
  )
}

export default App
