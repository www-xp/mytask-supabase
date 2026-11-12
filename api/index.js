const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/api/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json(error);
  res.json(data);
});

app.post('/api/tasks', async (req, res) => {
  const { title, priority } = req.body;
  const { data, error } = await supabase.from('tasks').insert([{ title, priority, completed: false }]).select();
  if (error) return res.status(500).json(error);
  res.json(data[0]);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const { data, error } = await supabase.from('tasks').update({ completed }).eq('id', id).select();
  if (error) return res.status(500).json(error);
  res.json(data[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return res.status(500).json(error);
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>任务清单 · TaskFlow</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body {
    min-height:100vh;
    font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    color:#1c2333;
    background:
      radial-gradient(900px 500px at 12% -10%, #dbe7ff 0%, transparent 60%),
      radial-gradient(700px 420px at 100% 0%, #e2fbf2 0%, transparent 55%),
      linear-gradient(180deg, #f6f8fd 0%, #eff3fb 100%);
    padding:36px 18px 60px;
  }
  .wrap { max-width:720px; margin:0 auto; }
  .head { margin-bottom:26px; }
  .eyebrow {
    display:inline-flex; align-items:center; gap:6px;
    font-size:12px; letter-spacing:.14em; text-transform:uppercase;
    color:#6b7a99; font-weight:600;
    padding:6px 12px; border-radius:999px;
    background:rgba(255,255,255,.75);
    border:1px solid rgba(255,255,255,.9);
    box-shadow:0 2px 10px rgba(28,35,51,.05);
  }
  .dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.18); }
  h1 {
    font-size:34px; font-weight:800; letter-spacing:-.02em; margin:14px 0 6px;
    background:linear-gradient(100deg,#1b2a4a 0%, #3b62e0 55%, #14a17b 100%);
    -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  }
  .sub { font-size:14px; color:#7c889b; }
  .stats { display:flex; gap:10px; margin:18px 0 22px; }
  .stat {
    flex:1; background:rgba(255,255,255,.82); border:1px solid rgba(255,255,255,.95);
    border-radius:16px; padding:14px 16px;
    box-shadow:0 6px 20px rgba(28,35,51,.06);
  }
  .stat .n { font-size:22px; font-weight:800; letter-spacing:-.02em; }
  .stat .l { font-size:12px; color:#8a95a8; margin-top:2px; letter-spacing:.05em; }
  .n-blue { color:#3b62e0; }
  .n-green { color:#0f9f74; }
  .composer {
    background:#fff; border-radius:20px; padding:16px;
    box-shadow:0 12px 34px rgba(28,35,51,.09);
    border:1px solid #e8edf6;
    margin-bottom:26px;
  }
  .row { display:flex; gap:10px; align-items:center; }
  #title {
    flex:1; min-width:0; border:none; outline:none; font-size:16px; color:#1c2333;
    padding:14px 14px; background:#f3f6fc; border-radius:13px;
    transition:box-shadow .18s ease, background .18s ease;
  }
  #title::placeholder { color:#a8b2c4; }
  #title:focus { background:#fff; box-shadow:0 0 0 2px #cfdcff inset; }
  .submit {
    flex-shrink:0; border:none; cursor:pointer;
    width:52px; height:52px; border-radius:14px;
    background:linear-gradient(135deg,#4f7cf7,#3b62e0);
    color:#fff; font-size:22px; line-height:1;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 20px rgba(59,98,224,.32);
    transition:transform .14s ease, box-shadow .14s ease;
  }
  .submit:hover { transform:translateY(-1px); box-shadow:0 10px 24px rgba(59,98,224,.38); }
  .submit:active { transform:scale(.94); }
  .pri-row { display:flex; gap:8px; margin-top:14px; }
  .pri {
    flex:1; cursor:pointer; border:1px solid #e8edf6; background:#f8fafd;
    border-radius:11px; padding:9px 0; font-size:13.5px; font-weight:600;
    color:#7b879c; transition:all .16s ease;
  }
  .pri[data-on="1"] { color:#fff; border-color:transparent; }
  .pri.高[data-on="1"] { background:linear-gradient(135deg,#fb7185,#ef4444); box-shadow:0 6px 16px rgba(239,68,68,.28); }
  .pri.中[data-on="1"] { background:linear-gradient(135deg,#fbbf24,#f59e0b); box-shadow:0 6px 16px rgba(245,158,11,.28); }
  .pri.低[data-on="1"] { background:linear-gradient(135deg,#34d399,#10b981); box-shadow:0 6px 16px rgba(16,185,129,.28); }
  .sec-title { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
  .sec-title span { font-size:12px; font-weight:700; letter-spacing:.1em; color:#8a95a8; text-transform:uppercase; }
  #list { display:flex; flex-direction:column; gap:10px; }
  .card {
    display:flex; align-items:center; gap:13px;
    background:#fff; border:1px solid #e9eef7; border-radius:16px;
    padding:14px 15px;
    box-shadow:0 4px 14px rgba(28,35,51,.05);
    animation:pop .28s cubic-bezier(.2,.9,.3,1.2) both;
    transition:box-shadow .18s ease, transform .18s ease, opacity .18s ease;
  }
  .card:hover { transform:translateY(-1px); box-shadow:0 10px 26px rgba(28,35,51,.09); }
  .card.is-done { opacity:.62; }
  @keyframes pop { from { opacity:0; transform:translateY(8px) scale(.985); } to { opacity:1; transform:none; } }
  .check {
    flex-shrink:0; width:26px; height:26px; border-radius:50%;
    border:2px solid #d7dfec; background:#fff; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:all .18s ease; color:transparent; font-size:14px; font-weight:700;
  }
  .check:hover { border-color:#9db4e8; }
  .card.is-done .check { background:linear-gradient(135deg,#34d399,#0ea472); border-color:transparent; color:#fff; }
  .body { flex:1; min-width:0; }
  .name { font-size:15.5px; font-weight:600; line-height:1.4; word-break:break-word; transition:color .18s ease; }
  .card.is-done .name { color:#a8b2c4; text-decoration:line-through; text-decoration-thickness:1.5px; }
  .meta { display:flex; align-items:center; gap:8px; margin-top:6px; }
  .pill { font-size:11.5px; font-weight:700; letter-spacing:.04em; padding:3px 9px; border-radius:999px; }
  .p-高 { background:#fee9ec; color:#e11d48; }
  .p-中 { background:#fff2d6; color:#c27803; }
  .p-低 { background:#e2f8ef; color:#0f9f74; }
  .id { font-size:11.5px; color:#b3bccd; font-weight:600; }
  .del {
    flex-shrink:0; border:none; background:transparent; cursor:pointer;
    width:34px; height:34px; border-radius:10px; color:#c0c8d8;
    display:flex; align-items:center; justify-content:center;
    transition:all .16s ease; font-size:16px;
  }
  .del:hover { background:#fff0f2; color:#ef4444; }
  .empty { text-align:center; padding:52px 20px; color:#9aa6ba; background:#fff; border:1px dashed #dfe6f2; border-radius:18px; }
  .empty .big { font-size:34px; margin-bottom:10px; }
  .empty p { font-size:14px; }
  .foot { text-align:center; margin-top:34px; font-size:12px; color:#b1bac9; letter-spacing:.06em; }
  @media (max-width:430px) {
    body { padding:26px 14px 50px; }
    h1 { font-size:27px; }
    .stat { padding:12px 13px; }
    .stat .n { font-size:19px; }
  }
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div class="eyebrow"><span class="dot"></span>TaskFlow</div>
    <h1>任务清单</h1>
    <p class="sub">记录待办，掌握节奏，专注当下最重要的一件事。</p>
  </div>
  <div class="stats">
    <div class="stat"><div class="n n-blue" id="s-all">0</div><div class="l">全部任务</div></div>
    <div class="stat"><div class="n n-green" id="s-done">0</div><div class="l">已完成</div></div>
    <div class="stat"><div class="n" id="s-left">0</div><div class="l">待处理</div></div>
  </div>
  <div class="composer">
    <div class="row">
      <input id="title" placeholder="今天要做点什么？" autocomplete="off">
      <button class="submit" id="addBtn" title="添加">＋</button>
    </div>
    <div class="pri-row" id="priRow">
      <button class="pri 高" data-p="高">高优先</button>
      <button class="pri 中" data-p="中" data-on="1">中优先</button>
      <button class="pri 低" data-p="低">低优先</button>
    </div>
  </div>
  <div class="sec-title"><span>任务列表</span></div>
  <div id="list"></div>
  <div class="foot">Powered by Node.js · Supabase · Vercel</div>
</div>
<script>
var listEl = document.getElementById('list');
var inputEl = document.getElementById('title');
var currentPri = '中';

document.getElementById('priRow').addEventListener('click', function (e) {
  var btn = e.target.closest('.pri');
  if (!btn) return;
  currentPri = btn.dataset.p;
  Array.prototype.forEach.call(document.querySelectorAll('.pri'), function (b) {
    if (b === btn) b.dataset.on = '1'; else b.removeAttribute('data-on');
  });
});

function esc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

function render(arr) {
  var all = arr.length;
  var done = arr.filter(function (t) { return t.completed; }).length;
  document.getElementById('s-all').textContent = all;
  document.getElementById('s-done').textContent = done;
  document.getElementById('s-left').textContent = all - done;

  if (!all) {
    listEl.innerHTML = '<div class="empty"><div class="big">🗂️</div><p>还没有任务，写下第一件事吧</p></div>';
    return;
  }
  listEl.innerHTML = arr.map(function (t, i) {
    var p = (t.priority === '高' || t.priority === '低') ? t.priority : '中';
    return '<div class="card' + (t.completed ? ' is-done' : '') + '" style="animation-delay:' + (i * 28) + 'ms">' +
      '<button class="check" data-id="' + t.id + '" data-done="' + (t.completed ? '0' : '1') + '" title="切换状态">✓</button>' +
      '<div class="body">' +
        '<div class="name">' + esc(t.title) + '</div>' +
        '<div class="meta"><span class="pill p-' + p + '">' + p + '</span><span class="id">#' + t.id + '</span></div>' +
      '</div>' +
      '<button class="del" data-del="' + t.id + '" title="删除">✕</button>' +
    '</div>';
  }).join('');
}

async function load() {
  try {
    var res = await fetch('/api/tasks');
    var arr = await res.json();
    if (!Array.isArray(arr)) {
      listEl.innerHTML = '<div class="empty"><div class="big">⚠️</div><p>数据读取失败，请检查环境变量</p></div>';
      return;
    }
    render(arr);
  } catch (err) {
    listEl.innerHTML = '<div class="empty"><div class="big">⚠️</div><p>网络异常，稍后再试</p></div>';
  }
}

async function addTask() {
  var title = inputEl.value.trim();
  if (!title) { inputEl.focus(); return; }
  await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title, priority: currentPri })
  });
  inputEl.value = '';
  inputEl.focus();
  load();
}

document.getElementById('addBtn').addEventListener('click', addTask);
inputEl.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') addTask();
});

listEl.addEventListener('click', async function (e) {
  var chk = e.target.closest('.check');
  if (chk) {
    await fetch('/api/tasks/' + chk.dataset.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: chk.dataset.done === '1' })
    });
    load();
    return;
  }
  var del = e.target.closest('.del');
  if (del) {
    await fetch('/api/tasks/' + del.dataset.del, { method: 'DELETE' });
    load();
  }
});

load();
</script>
</body>
</html>`);
});

module.exports = app;
