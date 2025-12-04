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
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'

function FieldInput({ field, value, onChange, error, helperText }) {
  if (field.type === 'long_text') {
    return (
      <TextField label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth multiline rows={3} required={field.required} error={error} helperText={error ? helperText : ' '} />
    )
  }
  if (field.type === 'number') {
    let cfg = {}
    try { cfg = JSON.parse(field.configJson || '{}') } catch { cfg = {} }
    const min = cfg?.min ?? undefined
    const max = cfg?.max ?? undefined
    return (
      <TextField type="number" label={field.label} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} fullWidth required={field.required} error={error} helperText={error ? helperText : ' '} inputProps={{ min, max }} />
    )
  }
  if (field.type === 'date') {
    return (
      <TextField type="date" label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth required={field.required} error={error} helperText={error ? helperText : ' '} InputLabelProps={{ shrink: true }} />
    )
  }
  if (field.type === 'yes_no') {
    const display = typeof value === 'boolean' ? String(value) : ''
    return (
      <TextField select label={field.label} value={display} onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value === 'true')} fullWidth required={field.required} error={error} helperText={error ? helperText : ' '}>
        <MenuItem value="">Select…</MenuItem>
        <MenuItem value="true">Yes</MenuItem>
        <MenuItem value="false">No</MenuItem>
      </TextField>
    )
  }
  if (field.type === 'single_select') {
    let options = []
    try { options = JSON.parse(field.optionsJson || '[]') } catch {}
    if (!Array.isArray(options)) options = []
    return (
      <FormControl component="fieldset" error={error} fullWidth>
        <FormLabel component="legend">{field.label}{field.required && ' *'}</FormLabel>
        <RadioGroup value={value || ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt, idx) => (
            <FormControlLabel key={idx} value={String(opt)} control={<Radio />} label={String(opt)} />
          ))}
        </RadioGroup>
        {error && <Typography variant="caption" color="error">{helperText}</Typography>}
      </FormControl>
    )
  }
  if (field.type === 'multi_select') {
    let options = []
    try { options = JSON.parse(field.optionsJson || '[]') } catch {}
    if (!Array.isArray(options)) options = []
    const arr = Array.isArray(value) ? value : []
    return (
      <FormControl component="fieldset" error={error} fullWidth>
        <FormLabel component="legend">{field.label}{field.required && ' *'}</FormLabel>
        <FormGroup>
          {options.map((opt, idx) => (
            <FormControlLabel
              key={idx}
              control={
                <Checkbox
                  checked={arr.includes(String(opt))}
                  onChange={(e) => {
                    const optStr = String(opt)
                    if (e.target.checked) {
                      onChange([...arr, optStr])
                    } else {
                      onChange(arr.filter(v => v !== optStr))
                    }
                  }}
                />
              }
              label={String(opt)}
            />
          ))}
        </FormGroup>
        {error && <Typography variant="caption" color="error">{helperText}</Typography>}
      </FormControl>
    )
  }
  // default short_text
  return (
    <TextField label={field.label} value={value || ''} onChange={(e) => onChange(e.target.value)} fullWidth required={field.required} error={error} helperText={error ? helperText : ' '} />
  )
}

export default function DynamicForm({ code, initialEmail }) {
  const [email, setEmail] = useState(initialEmail || '')
  const [config, setConfig] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)
  const isDisabled = !code
  const isValidEmail = (v) => /^(?:[A-Za-z0-9._%+-])+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test((v || '').trim())
  const emailValid = isValidEmail(email)
  const canLoad = emailValid
  const [errors, setErrors] = useState({})

  const load = async () => {
    if (isDisabled || !canLoad) return
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${code}/form?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('not invited or no form')
      const data = await res.json()
      setConfig(data)
      const init = {}
      ;(data.fields || []).forEach(f => {
        const key = String(f.id)
        if (f.type === 'multi_select') init[key] = []
        else init[key] = ''
      })
      setAnswers(init)
    } catch (e) {
      setConfig(null)
      setNotice({ type: 'error', text: 'Form not available right now' })
    } finally { setLoading(false) }
  }

  useEffect(() => { if (initialEmail && isValidEmail(initialEmail)) load() }, [initialEmail])

  const submit = async () => {
    if (isDisabled || !config) return
    const errs = {}
    ;(config.fields || []).forEach(f => {
      const key = String(f.id)
      const val = answers[key]
      let empty = false
      switch (f.type) {
        case 'multi_select':
          empty = !Array.isArray(val) || val.length === 0
          break
        case 'yes_no':
          empty = typeof val !== 'boolean'
          break
        case 'number':
          empty = val === '' || val === null || val === undefined
          break
        default:
          empty = !val || String(val).trim() === ''
      }
      if (f.required && empty) {
        errs[key] = 'This field is required'
        return
      }
      if (f.type === 'number' && !empty) {
        let cfg = {}
        try { cfg = JSON.parse(f.configJson || '{}') } catch { cfg = {} }
        const numVal = Number(val)
        if (cfg?.min != null && numVal < Number(cfg.min)) {
          errs[key] = `Minimum is ${cfg.min}`
          return
        }
        if (cfg?.max != null && numVal > Number(cfg.max)) {
          errs[key] = `Maximum is ${cfg.max}`
          return
        }
      }
    })
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
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
          {isDisabled && (
            <Typography variant="body2" color="text.secondary">Form will be available once an event is created.</Typography>
          )}
          <TextField
            label="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            size="small"
            fullWidth
            disabled={isDisabled}
            error={!isDisabled && email.trim() !== '' && !emailValid}
            helperText={!isDisabled && email.trim() !== '' && !emailValid ? 'Enter a valid email' : ' '}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={load} disabled={isDisabled || !canLoad || loading}>Load form</Button>
          </Stack>
          {loading && <Typography variant="body2">Loading…</Typography>}
          {config && (
            <Stack spacing={1}>
              {(config.fields || []).map((f) => (
                <FieldInput key={f.id} field={f} value={answers[String(f.id)]} onChange={(v) => setAnswers(prev => ({ ...prev, [String(f.id)]: v }))} error={!!errors[String(f.id)]} helperText={errors[String(f.id)]} />
              ))}
              <Button variant="contained" onClick={submit} disabled={isDisabled || submitting || !emailValid}>Submit</Button>
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
