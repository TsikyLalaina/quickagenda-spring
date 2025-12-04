import React, { useEffect, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multi select' },
]

export default function FormBuilder({ code }) {
  const [title, setTitle] = useState('Guest Form')
  const [active, setActive] = useState(true)
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const isDisabled = !code
  const [optionInputs, setOptionInputs] = useState({}) // per-field temp input

  const load = async () => {
    try {
      const res = await fetch(`/api/events/${code}/form/admin`)
      if (!res.ok) return
      const data = await res.json()
      if (!data) return
      if (data.title) setTitle(data.title)
      if (typeof data.active === 'boolean') setActive(data.active)
      if (Array.isArray(data.fields)) setFields(data.fields)
    } catch {}
  }

  useEffect(() => { if (code) { load() } }, [code])

  const addField = (type) => {
    if (isDisabled) return
    setFields(prev => [...prev, {
      id: null,
      type,
      label: '',
      required: false,
      orderIndex: prev.length,
      optionsJson: (type === 'single_select' || type === 'multi_select') ? '[]' : null,
      configJson: type === 'number' ? JSON.stringify({ min: null, max: null }) : null
    }])
  }

  const save = async () => {
    try {
      if (isDisabled) {
        setNotice({ type: 'error', text: 'Create the event first to configure a form' })
        return
      }
      if (!title || title.trim() === '') {
        setNotice({ type: 'error', text: 'Title is required' })
        return
      }
      // Validate fields: label required; select types need options; number min<=max
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i]
        if (!f.label || f.label.trim() === '') {
          setNotice({ type: 'error', text: 'Each field must have a label' })
          return
        }
        if (f.type === 'single_select' || f.type === 'multi_select') {
          let opts = []
          try { opts = JSON.parse(f.optionsJson || '[]') } catch { opts = [] }
          if (!Array.isArray(opts) || opts.length === 0) {
            setNotice({ type: 'error', text: 'Select fields need at least one option' })
            return
          }
        }
        if (f.type === 'number') {
          let cfg = {}
          try { cfg = JSON.parse(f.configJson || '{}') } catch { cfg = {} }
          const min = cfg?.min
          const max = cfg?.max
          if (min != null && max != null && Number(min) > Number(max)) {
            setNotice({ type: 'error', text: 'Number field: min cannot be greater than max' })
            return
          }
        }
      }
      setSaving(true)
      const body = { title, active, openAt: null, closeAt: null, fields }
      const res = await fetch(`/api/events/${code}/form/admin`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (!res.ok) {
        if (res.status === 409) {
          setNotice({ type: 'error', text: 'Only one form is allowed per event. Update the existing form instead.' })
          return
        }
        throw new Error('failed')
      }
      setNotice({ type: 'success', text: 'Form saved' })
      load()
    } catch(e) {
      setNotice({ type: 'error', text: 'Failed to save form' })
    } finally { setSaving(false) }
  }

  

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Guest Form</Typography>
          {/* Settings section */}
          <Stack spacing={1}>
            <FormControlLabel
              control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} disabled={isDisabled} />}
              label="Active (published)"
            />
            {isDisabled && (
              <Typography variant="body2" color="text.secondary">Create the event first to configure the form.</Typography>
            )}
            <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth disabled={isDisabled} required error={!isDisabled && title.trim() === ''} helperText={!isDisabled && title.trim() === '' ? 'Title is required' : ' '} />
          </Stack>

          <Divider />
          {/* Fields section */}
          <Typography variant="subtitle1">Fields</Typography>
          <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
            <Stack spacing={1}>
              {fields.map((f, idx) => {
                let opts = []
                try { opts = JSON.parse(f.optionsJson || '[]') } catch { opts = [] }
                const labelError = !isDisabled && (!f.label || f.label.trim() === '')
                const optsError = !isDisabled && (f.type === 'single_select' || f.type === 'multi_select') && (!Array.isArray(opts) || opts.length === 0)
                return (
                  <React.Fragment key={idx}>
                    <Stack spacing={1} sx={{ p: 1 }}>
                      <TextField select label="Type" value={f.type} onChange={(e) => setFields(prev => prev.map((x,i) => i===idx ? { ...x, type: e.target.value } : x))} size="small" disabled={isDisabled}>
                        {FIELD_TYPES.map(t => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
                      </TextField>
                      <TextField label="Label" value={f.label} onChange={(e) => setFields(prev => prev.map((x,i) => i===idx ? { ...x, label: e.target.value } : x))} fullWidth disabled={isDisabled} required error={labelError} helperText={labelError ? 'Label is required' : ' '} />
                      <TextField label="Required" value={f.required ? 'Yes' : 'No'} onClick={() => { if (!isDisabled) setFields(prev => prev.map((x,i) => i===idx ? { ...x, required: !x.required } : x)) }} inputProps={{ readOnly: true }} disabled={isDisabled} />
                      {(f.type === 'single_select' || f.type === 'multi_select') && (
                        <Stack spacing={1}>
                          <Stack direction="row" spacing={1}>
                            <TextField size="small" label="New option" value={optionInputs[idx] || ''} onChange={(e) => setOptionInputs(prev => ({ ...prev, [idx]: e.target.value }))} disabled={isDisabled} />
                            <Button size="small" variant="outlined" onClick={() => {
                              const val = (optionInputs[idx] || '').trim()
                              if (!val) return
                              const next = Array.isArray(opts) ? [...opts] : []
                              if (!next.includes(val)) next.push(val)
                              setFields(prev => prev.map((x,i) => i===idx ? { ...x, optionsJson: JSON.stringify(next) } : x))
                              setOptionInputs(prev => ({ ...prev, [idx]: '' }))
                            }} disabled={isDisabled}>Add</Button>
                          </Stack>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            {(Array.isArray(opts) ? opts : []).map((o, oi) => (
                              <Chip key={oi} label={String(o)} onDelete={isDisabled ? undefined : () => {
                                const next = (Array.isArray(opts) ? opts : []).filter((_, j) => j !== oi)
                                setFields(prev => prev.map((x,i) => i===idx ? { ...x, optionsJson: JSON.stringify(next) } : x))
                              }} disabled={isDisabled} />
                            ))}
                          </Stack>
                          {optsError && <Typography variant="caption" color="error">Add at least one option</Typography>}
                        </Stack>
                      )}
                      {f.type === 'number' && (() => {
                        let cfg = {}
                        try { cfg = JSON.parse(f.configJson || '{}') } catch { cfg = {} }
                        const min = cfg?.min ?? ''
                        const max = cfg?.max ?? ''
                        return (
                          <Stack direction="row" spacing={1}>
                            <TextField size="small" type="number" label="Min" value={min} onChange={(e) => {
                              const v = e.target.value
                              const next = { ...(cfg || {}) , min: v === '' ? null : Number(v) }
                              setFields(prev => prev.map((x,i) => i===idx ? { ...x, configJson: JSON.stringify(next) } : x))
                            }} disabled={isDisabled} />
                            <TextField size="small" type="number" label="Max" value={max} onChange={(e) => {
                              const v = e.target.value
                              const next = { ...(cfg || {}) , max: v === '' ? null : Number(v) }
                              setFields(prev => prev.map((x,i) => i===idx ? { ...x, configJson: JSON.stringify(next) } : x))
                            }} disabled={isDisabled} />
                          </Stack>
                        )
                      })()}
                      <Stack direction="row" spacing={1}>
                        <Button size="small" color="error" onClick={() => setFields(prev => prev.filter((_,i) => i!==idx))} disabled={isDisabled}>Remove</Button>
                        <Button size="small" onClick={() => setFields(prev => prev.map((x,i) => i===idx ? { ...x, orderIndex: idx } : x))} disabled={isDisabled}>Set order</Button>
                      </Stack>
                    </Stack>
                    {idx < fields.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </Stack>
          </Box>

          {/* Actions */}
          <Stack spacing={1}>
            <Box sx={{ overflowX: 'auto' }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'nowrap', pb: 1 }}>
                {FIELD_TYPES.map(ft => (
                  <Button key={ft.value} variant="outlined" onClick={() => addField(ft.value)} disabled={isDisabled}>{ft.label}</Button>
                ))}
              </Stack>
            </Box>
            <Button variant="contained" onClick={save} disabled={saving || isDisabled || title.trim() === ''}>Save form</Button>
          </Stack>
          
        </Stack>
      </CardContent>
      <Snackbar open={!!notice} onClose={() => setNotice(null)} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {notice && <Alert severity={notice.type}>{notice.text}</Alert>}
      </Snackbar>
    </Card>
  )
}
