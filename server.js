require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json({ data })
})

app.post('/api/tasks', async (req, res) => {
  const { title, priority } = req.body
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, priority, completed: false }])
    .select()
  if (error) return res.status(500).json({ error })
  res.json({ data })
})

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params
  const { completed } = req.body
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .select()
  if (error) return res.status(500).json({ error })
  res.json({ data })
})

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) return res.status(500).json({ error })
  res.json({ ok: true })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
