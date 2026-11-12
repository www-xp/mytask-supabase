const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 查询全部任务
app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json(error);
  res.json(data);
});

// 新增任务
app.post('/api/tasks', async (req, res) => {
  const { title, priority } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ title, priority, completed: false }])
    .select();
  if (error) return res.status(500).json(error);
  res.json(data[0]);
});

// 修改完成状态
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json(error);
  res.json(data[0]);
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return res.status(500).json(error);
  res.json({ ok: true });
});

// 首页：任务清单页面
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>任务清单</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:"Microsoft Yahei",sans-serif; }
  body { background:#f4f7fa; padding:40px 16px; }
  .box { max-width:640px; margin:0 auto; background:#fff; border-radius:16px; padding:28px; box-shadow:0 10px 30px rgba(0,0,0,.08); }
  h1 { text-align:center; font-size:22px; color:#1f2937; margin-bottom:24px; }
  .bar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:22px; }
  input { flex:1; min-width:160px; padding:12px 14px; border:1px solid #d1d5db; border-radius:10px; font-size:16px; }
  select { padding:12px 14px; border:1px solid #d1d5db; border-radius:10px; font-size:16px; }
  .add { padding:12px 22px; background:#3b82f6; color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:16px; }
  .item { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:14px 16px; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:12px; }
  .title { font-size:16px; color:#111; word-break:break-all; }
  .done { text-decoration:line-through; color:#9ca3af; }
  .tag { display:inline-block; margin-top:6px; padding:3px 10px; border-radius:999px; font-size:13px; }
  .tag-高 { background:#fee2e2; color:#dc2626; }
  .tag-中 { background:#fef3c7; color:#d97706; }
  .tag-低 { background:#dcfce7; color:#16a34a; }
  .btns { display:flex; gap:8px; flex-shrink:0; }
  .btns button { padding:8px 12px; border:none; border-radius:8px; cursor:pointer; font-size:14px; color:#fff; }
  .ok { background:#10b981; }
  .del { background:#ef4444; }
  .empty { text-align:center; color:#9ca3af; padding:20px 0; }
</style>
</head>
<body>
<div class="box">
  <h1>任务清单</h1>
  <div class="bar">
    <input id="title" placeholder="输入任务内容">
    <select id="pri">
      <option value="高">高</option>
      <option value="中" selected>中</option>
      <option value="低">低</option>
    </select>
    <button class="add" onclick="addTask()">新增</button>
  </div>
  <div id="list"></div>
</div>
<script>
const listEl = document.getElementById('list');

async function load() {
  const res = await fetch('/api/tasks');
  const arr = await res.json();
  if (!Array.isArray(arr) || arr.length === 0) {
    listEl.innerHTML = '<div class="empty">暂无任务</div>';
    return;
  }
  listEl.innerHTML = arr.map(t => {
    const p = t.priority || '中';
    return '<div class="item">' +
      '<div><div class="title ' + (t.completed ? 'done' : '') + '">' + escapeHtml(t.title) + '</div>' +
      '<span class="tag tag-' + p + '">' + p + '</span></div>' +
      '<div class="btns">' +
      '<button class="ok" onclick="toggle(' + t.id + ',' + (!t.completed) + ')">' + (t.completed ? '未完成' : '完成') + '</button>' +
      '<button class="del" onclick="removeTask(' + t.id + ')">删除</button>' +
      '</div></div>';
  }).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

async function addTask() {
  const title = document.getElementById('title').value.trim();
  if (!title) return alert('请输入任务内容');
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority: document.getElementById('pri').value })
  });
  document.getElementById('title').value = '';
  load();
}

async function toggle(id, completed) {
  await fetch('/api/tasks/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed })
  });
  load();
}

async function removeTask(id) {
  await fetch('/api/tasks/' + id, { method: 'DELETE' });
  load();
}

load();
</script>
</body>
</html>`);
});

module.exports = app;
