import React, { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

export default function AttendeeList({ code }) {
  const [data, setData] = useState({ attendees: [], yes: 0, no: 0, maybe: 0 })

  const load = async () => {
    try {
      const res = await fetch(`/api/events/${code}/attendees`)
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      setData(json || { attendees: [], yes: 0, no: 0, maybe: 0 })
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (!code) return
    let timer
    const start = () => {
      load()
      timer = setInterval(load, 10000)
    }
    start()
    return () => { if (timer) clearInterval(timer) }
  }, [code])

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Attendees</Typography>
        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
          <Typography variant="body2">Yes: {data.yes}</Typography>
          <Typography variant="body2">No: {data.no}</Typography>
          <Typography variant="body2">Maybe: {data.maybe}</Typography>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <List dense>
          {(data.attendees || []).map(a => (
            <ListItem key={a.id}>
              <ListItemText primary={a.email} secondary={a.rsvp || '—'} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}
