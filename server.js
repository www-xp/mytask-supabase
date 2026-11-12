import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

app.get('/api/tasks', async (req, res) => {
  if (!supabase) return res.status(500).send('缺少 Supabase 环境变量');
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.post('/api/tasks', async (req, res) => {
  if (!supabase) return res.status(500).send('缺少 Supabase 环境变量');
  const { title, priority } = req.body;
  const { data, error } = await supabase.from('tasks').insert([{ title, priority, completed: false }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.patch('/api/tasks/:id', async (req, res) => {
  if (!supabase) return res.status(500).send('缺少 Supabase 环境变量');
  const { id } = req.params;
  const { completed } = req.body;
  const { data, error } = await supabase.from('tasks').update({ completed }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.delete('/api/tasks/:id', async (req, res) => {
  if (!supabase) return res.status(500).send('缺少 Supabase 环境变量');
  const { id } = req.params;
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  if (!supabase) {
    return res.send(`
      <h2>环境变量读取失败</h2>
      <p>检查 SUPABASE_URL、SUPABASE_ANON_KEY</p>
    `);
  }
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>任务清单</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Microsoft Yahei}
body{background:#f4f7fa;padding:40px 20px}
.box{max-width:640px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,0.08)}
h3{text-align:center;margin-bottom:24px;color:#1f2937;font-size:22px}
.bar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
input{flex:1;min-width:180px;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:16px}
select{padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:16px}
button.add{padding:12px 22px;background:#3b82f6;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:16px}
.item{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px}
.title{font-size:16px;color:#111}
.done{text-decoration:line-through;color:#9ca3af}
.tag{padding:4px 10px;border-radius:999px;font-size:13px}
.tag-高{background:#fee2e2;color:#dc2626}
.tag-中{background:#fef3c7;color:#d97706}
.tag-低{background:#dcfce7;color:#16a34a}
.btns{display:flex;gap:8px}
.btns button{padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-size:14px}
.ok{background:#10b981;color:#fff}
.del{background:#ef4444;color:#fff}
</style>
</head>
<body>
<div class="box">
  <h3>任务清单</h3>
  <div class="bar">
    <input id="inp" placeholder="输入任务">
    <select id="sel">
      <option value="高">高</option>
      <option value="中" selected>中</option>
      <option value="低">低</option>
    </select>
    <button class="add" id="addBtn">新增</button>
  </div>
  <div id="list"></div>
</div>
<script>
const inp=document.getElementById('inp');
const sel=document.getElementById('sel');
const addBtn=document.getElementById('addBtn');
const list=document.getElementById('list');

async function refresh(){
  const res=await fetch('/api/tasks');
  const {data}=await res.json();
  list.innerHTML='';
  if(!data) return;
  data.forEach(t=>{
    const div=document.createElement('div');
    div.className='item';
    div.innerHTML=`
      <div>
        <div class="title ${t.completed?'done':''}">${t.title}</div>
        <span class="tag tag-${t.priority}">${t.priority}</span>
      </div>
      <div class="btns">
        <button class="ok">${t.completed?'未完成':'完成'}</button>
        <button class="del">删除</button>
      </div>
    `;
    div.querySelector('.ok').onclick=async ()=>{
      await fetch(\`/api/tasks/\${t.id}\`,{method:'PATCH',body:JSON.stringify({completed:!t.completed}),headers:{'Content-Type':'application/json'}});
      refresh();
    };
    div.querySelector('.del').onclick=async ()=>{
      await fetch(\`/api/tasks/\${t.id}\`,{method:'DELETE'});
      refresh();
    };
    list.appendChild(div);
  })
}
addBtn.onclick=async ()=>{
  const title=inp.value.trim();
  if(!title) return;
  await fetch('/api/tasks',{method:'POST',body:JSON.stringify({title,priority:sel.value}),headers:{'Content-Type':'application/json'}});
  inp.value='';
  refresh();
};
refresh();
</script>
</body>
</html>
    `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`running on port ${port}`);
});
