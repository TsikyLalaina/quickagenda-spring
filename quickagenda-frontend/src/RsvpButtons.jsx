import React, { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

export default function RsvpButtons({ code, email: initialEmail }) {
  const [email, setEmail] = useState(initialEmail || '')
  const [selection, setSelection] = useState(null) // 'YES' | 'NO' | 'MAYBE'
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setEmail(initialEmail || '') }, [initialEmail])

  const send = async (rsvp) => {
    if (!email) {
      // no-op if email missing
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch(`/api/events/${code}/rsvp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, rsvp })
      })
      if (!res.ok) throw new Error('failed')
      setSelection(rsvp)
      try { localStorage.setItem(`rsvp:${code}:${email}`, rsvp) } catch {}
    } catch (e) {
      // swallow; UI remains
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = Boolean((email || '').trim())

  return (
    <Stack spacing={1}>
      {!initialEmail && (
        <TextField
          label="Your email"
          placeholder="you@example.com"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
      )}
      <Stack direction="row" spacing={1}>
        <Button variant={selection === 'YES' ? 'contained' : 'outlined'} disabled={submitting || !canSubmit} onClick={() => send('YES')}>Yes</Button>
        <Button variant={selection === 'NO' ? 'contained' : 'outlined'} disabled={submitting || !canSubmit} onClick={() => send('NO')}>No</Button>
        <Button variant={selection === 'MAYBE' ? 'contained' : 'outlined'} disabled={submitting || !canSubmit} onClick={() => send('MAYBE')}>Maybe</Button>
      </Stack>
    </Stack>
  )
}
