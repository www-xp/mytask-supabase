const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  res.json({ data, error });
});

app.post('/api/tasks', async (req, res) => {
  const { title, priority } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, priority, is_done: false }])
    .select();
  res.json({ data, error });
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { is_done } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_done })
    .eq('id', id)
    .select();
  res.json({ data, error });
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  res.json({ error });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on ${PORT}`));
