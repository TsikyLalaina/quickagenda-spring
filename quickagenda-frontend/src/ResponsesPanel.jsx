import React, { useEffect, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

export default function ResponsesPanel({ code }) {
  const [loading, setLoading] = useState(false)
  const [responses, setResponses] = useState([])
  const [fields, setFields] = useState([])

  const loadConfig = async () => {
    try {
      const res = await fetch(`/api/events/${code}/form/admin`)
      if (!res.ok) return
      const data = await res.json()
      setFields(Array.isArray(data?.fields) ? data.fields : [])
    } catch {}
  }

  const loadResponses = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${code}/form/admin/responses`)
      if (!res.ok) return
      const data = await res.json()
      setResponses(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (code) { loadConfig(); loadResponses() } }, [code])

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">Responses ({responses.length})</Typography>
            <Button size="small" onClick={loadResponses} disabled={!code || loading}>Refresh</Button>
          </Stack>
          {loading && <Typography variant="body2">Loading…</Typography>}
          {!loading && (
            <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
              <TableContainer>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Submitted</TableCell>
                      {(fields || []).map((f) => (
                        <TableCell key={String(f.id)}>{f.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responses.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</TableCell>
                        {(fields || []).map((f) => {
                          const vid = String(f.id)
                          const raw = r.answers ? r.answers[vid] : undefined
                          let display = ''
                          if (Array.isArray(raw)) display = raw.join(', ')
                          else if (typeof raw === 'boolean') display = raw ? 'Yes' : 'No'
                          else if (raw === null || raw === undefined) display = ''
                          else display = String(raw)
                          return (
                            <TableCell key={vid}>{display}</TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
