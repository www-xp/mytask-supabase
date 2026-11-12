require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors())
app.use(express.json())

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

app.get('/api/tasks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, priority, completed: false }])
      .select()
    if (error) throw error
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { completed } = req.body
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select()
    if (error) throw error
    res.json({ data })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    if (error) throw error
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>任务清单</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: "Microsoft Yahei", sans-serif;
    }
    body {
      background-color: #f4f7fa;
      padding: 40px 20px;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    }
    h3 {
      text-align: center;
      color: #1f2937;
      margin-bottom: 24px;
      font-size: 26px;
    }
    .add-area {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 24px;
    }
    #taskInput {
      flex: 1;
      min-width: 200px;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 16px;
      outline: none;
    }
    #prioritySelect {
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 16px;
      background: white;
    }
    #addBtn {
      padding: 12px 22px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      cursor: pointer;
    }
    .task-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      margin-bottom: 12px;
      background: #fafafa;
    }
    .task-title {
      font-size: 16px;
      color: #111827;
    }
    .task-title.done {
      text-decoration: line-through;
      color: #9ca3af;
    }
    .priority-tag {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 13px;
    }
    .priority-高 { background: #fee2e2; color: #dc2626; }
    .priority-中 { background: #fef3c7; color: #d97706; }
    .priority-低 { background: #dcfce7; color: #16a34a; }
    .task-actions {
      display: flex;
      gap: 8px;
    }
    .toggle-btn {
      padding: 8px 14px;
      background-color: #10b981;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    .delete-btn {
      padding: 8px 14px;
      background-color: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h3>任务清单</h3>
    <div class="add-area">
      <input id="taskInput" placeholder="输入任务">
      <select id="prioritySelect">
        <option value="高">高</option>
        <option value="中" selected>中</option>
        <option value="低">低</option>
      </select>
      <button id="addBtn">新增</button>
    </div>
    <div id="taskList"></div>
  </div>

  <script>
    const taskInput = document.getElementById('taskInput')
    const prioritySelect = document.getElementById('prioritySelect')
    const addBtn = document.getElementById('addBtn')
    const taskList = document.getElementById('taskList')

    async function loadTasks() {
      const res = await fetch('/api/tasks')
      const { data } = await res.json()
      render(data)
    }

    function render(list) {
      taskList.innerHTML = ''
      if (!list) return
      list.forEach(item => {
        const div = document.createElement('div')
        div.className = 'task-item'
        div.innerHTML = `
          <div class="task-content">
            <div class="task-title ${item.completed ? 'done' : ''}">${item.title}</div>
            <span class="priority-tag priority-${item.priority}">${item.priority}</span>
          </div>
          <div class="task-actions">
            <button class="toggle-btn">${item.completed ? '未完成' : '完成'}</button>
            <button class="delete-btn">删除</button>
          </div>
        `
        div.querySelector('.toggle-btn').onclick = async () => {
          await fetch(`/api/tasks/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !item.completed })
          })
          loadTasks()
        }
        div.querySelector('.delete-btn').onclick = async () => {
          await fetch(`/api/tasks/${item.id}`, { method: 'DELETE' })
          loadTasks()
        }
        taskList.appendChild(div)
      })
    }

    addBtn.onclick = async () => {
      const title = taskInput.value.trim()
      if (!title) return
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority: prioritySelect.value })
      })
      taskInput.value = ''
      loadTasks()
    }
    loadTasks()
  </script>
</body>
</html>
  `)
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`服务启动成功`)
})
