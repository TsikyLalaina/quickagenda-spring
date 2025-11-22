import React, { useEffect, useMemo, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

function FieldInput({ field, value, onChange }) {
  if (field.type === 'long_text') {
    return (
      <TextField label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth multiline rows={3} required={field.required} />
    )
  }
  if (field.type === 'single_select') {
    let options = []
    try { options = JSON.parse(field.optionsJson || '[]') } catch {}
    if (!Array.isArray(options)) options = []
    return (
      <TextField select label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth required={field.required}>
        {options.map((opt, idx) => (
          <MenuItem key={idx} value={String(opt)}>{String(opt)}</MenuItem>
        ))}
      </TextField>
    )
  }
  // default short_text
  return (
    <TextField label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth required={field.required} />
  )
}

export default function DynamicForm({ code, initialEmail }) {
  const [email, setEmail] = useState(initialEmail || '')
  const [config, setConfig] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  const canLoad = Boolean((email || '').trim())

  const load = async () => {
    if (!canLoad) return
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${code}/form?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('not invited or no form')
      const data = await res.json()
      setConfig(data)
      const init = {}
      ;(data.fields || []).forEach(f => { init[String(f.id)] = '' })
      setAnswers(init)
    } catch (e) {
      setConfig(null)
      setNotice({ type: 'error', text: 'Form not available for this email' })
    } finally { setLoading(false) }
  }

  useEffect(() => { if (initialEmail) load() }, [initialEmail])

  const submit = async () => {
    if (!config) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/events/${code}/form/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, answers })
      })
      if (!res.ok) throw new Error('failed')
      setNotice({ type: 'success', text: 'Response submitted' })
    } catch (e) {
      setNotice({ type: 'error', text: 'Failed to submit form' })
    } finally { setSubmitting(false) }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">Guest Form</Typography>
          <TextField label="Your email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" size="small" fullWidth />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load} disabled={!canLoad || loading}>Load form</Button>
          </Stack>
          {loading && <Typography variant="body2">Loading…</Typography>}
          {config && (
            <Stack spacing={1}>
              {(config.fields || []).map((f) => (
                <FieldInput key={f.id} field={f} value={answers[String(f.id)]} onChange={(v) => setAnswers(prev => ({ ...prev, [String(f.id)]: v }))} />
              ))}
              <Button variant="contained" onClick={submit} disabled={submitting}>Submit</Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
      <Snackbar open={!!notice} onClose={() => setNotice(null)} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {notice && <Alert severity={notice.type}>{notice.text}</Alert>}
      </Snackbar>
    </Card>
  )
}
