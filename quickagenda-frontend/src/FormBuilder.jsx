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

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'single_select', label: 'Single select' },
]

export default function FormBuilder({ code }) {
  const [title, setTitle] = useState('Guest Form')
  const [active, setActive] = useState(true)
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

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

  useEffect(() => { if (code) load() }, [code])

  const addField = (type) => {
    setFields(prev => [...prev, { id: null, type, label: '', required: false, orderIndex: prev.length, optionsJson: type === 'single_select' ? '[]' : null, configJson: null }])
  }

  const save = async () => {
    try {
      setSaving(true)
      const body = { title, active, openAt: null, closeAt: null, fields }
      const res = await fetch(`/api/events/${code}/form/admin`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('failed')
      setNotice({ type: 'success', text: 'Form saved' })
      load()
    } catch(e) {
      setNotice({ type: 'error', text: 'Failed to save form' })
    } finally { setSaving(false) }
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">Guest Form</Typography>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1}>
            {fields.map((f, idx) => (
              <Card key={idx} variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <TextField select label="Type" value={f.type} onChange={(e) => setFields(prev => prev.map((x,i) => i===idx ? { ...x, type: e.target.value } : x))} size="small">
                      {FIELD_TYPES.map(t => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
                    </TextField>
                    <TextField label="Label" value={f.label} onChange={(e) => setFields(prev => prev.map((x,i) => i===idx ? { ...x, label: e.target.value } : x))} fullWidth />
                    <TextField label="Required" value={f.required ? 'Yes' : 'No'} onClick={() => setFields(prev => prev.map((x,i) => i===idx ? { ...x, required: !x.required } : x))} inputProps={{ readOnly: true }} />
                    {f.type === 'single_select' && (
                      <TextField label="Options (JSON array)" value={f.optionsJson || '[]'} onChange={(e) => setFields(prev => prev.map((x,i) => i===idx ? { ...x, optionsJson: e.target.value } : x))} fullWidth />
                    )}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" color="error" onClick={() => setFields(prev => prev.filter((_,i) => i!==idx))}>Remove</Button>
                      <Button size="small" onClick={() => setFields(prev => prev.map((x,i) => i===idx ? { ...x, orderIndex: idx } : x))}>Set order</Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            {FIELD_TYPES.map(ft => (
              <Button key={ft.value} variant="outlined" onClick={() => addField(ft.value)}>{ft.label}</Button>
            ))}
          </Stack>
          <Button variant="contained" onClick={save} disabled={saving}>Save form</Button>
        </Stack>
      </CardContent>
      <Snackbar open={!!notice} onClose={() => setNotice(null)} autoHideDuration={2000} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {notice && <Alert severity={notice.type}>{notice.text}</Alert>}
      </Snackbar>
    </Card>
  )
}
