import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// Electron 渲染进程 API
const { ipcRenderer } = window.require ? window.require('electron') : {};

// 标签颜色映射
const statusColors = {
  todo: "#ff4d4f",
  ing: "#faad14",
  done: "#52c41a",
  stuck: "#595959",
};

const priorityColors = {
  "紧急且重要": "#a8071a",
  "紧急": "#fa541c",
  "重要": "#1890ff",
  "日常": "#d9d9d9",
};

const priorityOrder = {
  "紧急且重要": 1,
  "紧急": 2,
  "重要": 3,
  "日常": 4,
};

// MM-DD格式化
function formatDateMMDD(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

function getQuickDDL(type) {
  const now = new Date();
  let target = new Date(now);
  if (type === "明天") {
    target.setDate(now.getDate() + 1);
  } else if (type === "周五") {
    const day = now.getDay();
    const diff = day <= 5 ? 5 - day : 5 + 7 - day;
    target.setDate(now.getDate() + diff);
  } else if (type === "下周一") {
    const day = now.getDay();
    const diff = day === 1 ? 7 : (8 - day) % 7;
    target.setDate(now.getDate() + diff);
  }
  return target.toISOString().slice(0, 10);
}

const initialTasks = [
  {
    id: uuidv4(),
    created_at: "2024-06-10T09:00:00",
    priority: "紧急且重要",
    summary: "修复生产环境bug",
    status: "todo",
    assignee: "",
    deadline: "",
    remark: "修复生产环境中的bug，导致系统崩溃，需要在今天之内完成。", // Sample remark for testing
    completed_at: "",
  },
  {
    id: uuidv4(),
    created_at: "2024-06-09T14:00:00",
    priority: "重要",
    summary: "撰写周报",
    status: "ing",
    assignee: "李华",
    deadline: "",
    remark: "",
    completed_at: "",
  },
];

function TaskForm({ onAdd }) {
  const [form, setForm] = useState({
    summary: "",
    assignee: "",
    priority: "紧急且重要",
    status: "todo",
    deadline: "",
    remark: "",
  });

  // 处理表单输入
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 处理快捷DDL
  function handleQuickDDL(type) {
    setForm({ ...form, deadline: getQuickDDL(type) });
  }

  // 表单提交
  function handleSubmit(e) {
    e.preventDefault();
    if (!form.summary) {
      alert("请填写任务描述");
      return;
    }
    onAdd({
      ...form,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      completed_at: "",  // 新任务没有完成日期
    });
    setForm({
      summary: "",
      assignee: "",
      priority: "紧急且重要",
      status: "todo",
      deadline: "",
      remark: "",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: 24,
        background: "#fcfcfc",
        padding: "18px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px #eee",
      }}
    >
      <textarea
        name="summary"
        placeholder="任务描述*"
        value={form.summary}
        onChange={handleChange}
        required
        className="input"
        style={{ flexGrow: 2, resize: "vertical", minHeight: "25px" }}
      />
      <input
        name="assignee"
        placeholder="对接人"
        value={form.assignee}
        onChange={handleChange}
        className="input"
        style={{ flexGrow: 2 }}
      />
      <select
        name="priority"
        value={form.priority}
        onChange={handleChange}
        className="select"
        required
      >
        <option>紧急且重要</option>
        <option>紧急</option>
        <option>重要</option>
        <option>日常</option>
      </select>
      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="select"
        required
      >
        <option value="todo">todo</option>
        <option value="ing">ing</option>
        <option value="stuck">stuck</option>
        <option value="done">done</option>
      </select>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <input
          name="deadline"
          type="date"
          value={form.deadline}
          onChange={handleChange}
          className="input"
          style={{ minWidth: 120 }}
        />
        <button
          type="button"
          className="btn-quick"
          onClick={() => handleQuickDDL("明天")}
        >
          明天
        </button>
        <button
          type="button"
          className="btn-quick"
          onClick={() => handleQuickDDL("周五")}
        >
          周五
        </button>
        <button
          type="button"
          className="btn-quick"
          onClick={() => handleQuickDDL("下周一")}
        >
          下周一
        </button>
      </div>
      <textarea
        name="remark"
        placeholder="备注"
        value={form.remark}
        onChange={handleChange}
        className="input"
        style={{ flexGrow: 2, resize: "vertical", minHeight: "50px" }}
      />
      <button type="submit" className="btn-primary">
        添加任务
      </button>
    </form>
  );
}

function EditableCell({ value, type, options, onSave }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isExpanded, setIsExpanded] = useState(false); // State for expanding the remark

  function handleBlur() {
    setEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  }

  function handleKeyDown(e) {
      if (e.key === "Enter" && e.shiftKey) {
      setEditValue(prev => prev);
    } else if (e.key === "Enter") {
      setEditing(false);
      if (editValue !== value) {
        onSave(editValue);
      }
    } else if (e.key === "Escape") {
      setEditValue(value);
      setEditing(false);
    }
  }

  function handleClick(e) {
    e.stopPropagation();  // Prevent editing when clicking on the cell itself
    setEditing(true);
  }

  // Remark specific logic for expansion/collapse
  function toggleRemarkExpansion(e) {
    e.stopPropagation();  // Prevent editing when toggling expand/collapse
    setIsExpanded((prev) => !prev);
  }

  if (editing) {
    if (type === "select") {
      return (
        <select
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="select"
          style={{ position: "absolute", zIndex: 10 }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    } else if (type === "date") {
      return (
        <input
          type="date"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="input"
          style={{ zIndex: 10 }}
        />
      );
    } else {
      return (
        <textarea
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="input"
          style={{
            resize: "none",
            lineHeight: "1.5",
            minHeight: "50px",
            zIndex: 10,
          }}
        />
      );
    }
  }

  const style = {
    display: "inline-block",
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    cursor: "pointer",
    padding: "3px 8px",
    borderRadius: 6,
    fontWeight: 500,
    textAlign: type === "text" ? "left" : "center",
    boxSizing: "border-box",
    background: "#fff",
    color: "#000",
  };

  // Apply color for priority or status if necessary
  if (type === "select" && options && options.length === 4 && options[0] === "紧急且重要") {
    style.background = priorityColors[value];
    style.color = "#fff";
    style.whiteSpace = "nowrap";
  } else if (type === "select" && options && options.length === 4) {
    style.background = statusColors[value];
    style.color = "#fff";
    style.whiteSpace = "nowrap";
  }

  // Limit content to three lines when collapsed
  const isLongRemark = value && value.length > 100; // If the content is long, we will collapse it
  const displayRemark = isExpanded || !isLongRemark ? value : value.split("\n").slice(0, 2).join("\n"); // Show full or truncated content

  return (
    <span style={style} onClick={handleClick}>
      {type === "date" && value ? formatDateMMDD(value) : displayRemark}
      
      {isLongRemark && !isExpanded && (
        <span
          onClick={toggleRemarkExpansion}
          style={{
            color: "#40a9ff",
            cursor: "pointer",
            fontSize: "12px",
            marginLeft: "8px",
            whiteSpace: "nowrap",
          }}
        >
          展开
        </span>
      )}
      
      {isExpanded && type === "text" && (
        <span
          onClick={toggleRemarkExpansion}
          style={{
            color: "#40a9ff",
            cursor: "pointer",
            fontSize: "12px",
            marginLeft: "8px",
            whiteSpace: "nowrap",
          }}
        >
          收起
        </span>
      )}
    </span>
  );
}



function TaskRow({ task, onUpdate, onDelete }) {
  function saveField(field, newValue) {
    if (field === "summary" && !newValue) {
      alert("任务描述不能为空");
      return;
    }

    if (field === "status" && newValue === "done" && !task.completed_at) {
      // 如果任务状态是 "done" 且没有完成日期，自动设置完成日期
      onUpdate(task.id, { ...task, [field]: newValue, completed_at: new Date().toISOString() });
    } else {
      onUpdate(task.id, { ...task, [field]: newValue });
    }
  }

  return (
    <tr className="task-row">
      <td style={{ width: 65 }}>{formatDateMMDD(task.created_at)}</td>
      <td style={{ width: 90 }}>
        <EditableCell
          value={task.priority}
          type="select"
          options={["紧急且重要", "紧急", "重要", "日常"]}
          onSave={(v) => saveField("priority", v)}
        />
      </td>
      <td style={{ width: 250 }}>
        <EditableCell
          value={task.summary}
          type="text"
          onSave={(v) => saveField("summary", v)}
        />
      </td>
      <td style={{ width: 65 }}>
        <EditableCell
          value={task.status}
          type="select"
          options={["todo", "ing", "stuck", "done"]}
          onSave={(v) => saveField("status", v)}
        />
      </td>
      <td style={{ width: 80 }}>
        <EditableCell
          value={task.assignee}
          type="text"
          onSave={(v) => saveField("assignee", v)}
        />
      </td>
      <td style={{ width: 55 }}>
        <EditableCell
          value={task.deadline ? task.deadline : ""}
          type="date"
          onSave={(v) => saveField("deadline", v)}
        />
      </td>
      <td style={{ width: 210 }}>
        <EditableCell
          value={task.remark}
          type="text"
          onSave={(v) => saveField("remark", v)}
        />
      </td>
      {task.status === "done" && (
        <td style={{ width: 100 }}>
          {/* 显示完成日期 */}
          <span>{formatDateMMDD(task.completed_at)}</span>
        </td>
      )}
      <td style={{ width: 60 }}>
        <button onClick={() => onDelete(task.id)} className="btn-delete">
          删除
        </button>
      </td>
    </tr>
  );
}

function TaskList({ tasks, onUpdate, onDelete }) {
  const nonDoneTasks = tasks.filter((task) => task.status !== "done");
  const doneTasks = tasks.filter((task) => task.status === "done").sort((a, b) => {
    // 对已完成任务按完成日期降序排序，空值排最后
    const completedAtA = a.completed_at ? new Date(a.completed_at) : -Infinity;
    const completedAtB = b.completed_at ? new Date(b.completed_at) : -Infinity;

    return completedAtB - completedAtA; // 降序排列
  });

  // 对未完成任务按照优先级和DDL进行排序
  const sortedNonDoneTasks = [...nonDoneTasks].sort((a, b) => {
    // 排序优先级
    const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityComparison !== 0) return priorityComparison;

    // 如果优先级相同，则按照DDL升序排序（空值排最后）
    const deadlineA = a.deadline ? new Date(a.deadline) : Infinity;
    const deadlineB = b.deadline ? new Date(b.deadline) : Infinity;

    return deadlineA - deadlineB;
  });

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 2px 16px #eee",
          padding: "18px",
          overflowX: "auto",
          marginBottom: 24,
          position: "relative",
          zIndex: 1,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "16px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ width: 65 }}>提出日期</th>
              <th style={{ width: 90 }}>任务优先级</th>
              <th style={{ width: 250 }}>任务描述</th>
              <th style={{ width: 65 }}>当前进展</th>
              <th style={{ width: 80 }}>对接人</th>
              <th style={{ width: 55 }}>DDL</th>
              <th style={{ width: 210 }}>备注</th>
              <th style={{ width: 60 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedNonDoneTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ textAlign: "center", color: "#2b2d42", marginBottom: 12 }}>
        已完成任务
      </h3>

      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 2px 16px #eee",
          padding: "18px",
          overflowX: "auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "16px",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ width: 65 }}>提出日期</th>
              <th style={{ width: 90 }}>任务优先级</th>
              <th style={{ width: 250 }}>任务描述</th>
              <th style={{ width: 65 }}>当前进展</th>
              <th style={{ width: 80 }}>对接人</th>
              <th style={{ width: 65 }}>DDL</th>
              <th style={{ width: 210 }}>备注</th>
              <th style={{ width: 65 }}>完成日期</th>
              <th style={{ width: 65 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.invoke('load-tasks').then((data) => {
        if (data && Array.isArray(data)) {
          setTasks(data);
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded && ipcRenderer) {
      ipcRenderer.invoke('save-tasks', tasks);
    }
  }, [tasks, loaded]);

  function pushHistory(newTasks) {
    setUndoHistory((prev) => [...prev, tasks]);
    setRedoHistory([]);
    setTasks(newTasks);
  }

  function addTask(task) {
    pushHistory([...tasks, task]);
  }

  function updateTask(id, newTask) {
    // 如果任务状态变为 "done"，自动填充完成日期
    if (newTask.status === "done" && !newTask.completed_at) {
      newTask.completed_at = new Date().toISOString();
    }
    
    pushHistory(tasks.map((t) => (t.id === id ? newTask : t)));
  }

  function deleteTask(id) {
    pushHistory(tasks.filter((t) => t.id !== id));
  }

  function undoGlobal() {
    if (undoHistory.length === 0) return;
    setRedoHistory((prev) => [...prev, tasks]);
    setTasks(undoHistory[undoHistory.length - 1]);
    setUndoHistory(undoHistory.slice(0, undoHistory.length - 1));
  }

  function redoGlobal() {
    if (redoHistory.length === 0) return;
    setUndoHistory((prev) => [...prev, tasks]);
    setTasks(redoHistory[redoHistory.length - 1]);
    setRedoHistory(redoHistory.slice(0, redoHistory.length - 1));
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "20px auto",
        fontFamily: "Segoe UI, Arial",
        background: "#f4f4f4",
        borderRadius: "18px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
        padding: "32px 24px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#2b2d42", marginBottom: 30 }}>
        工作任务 ToDoList
      </h2>
      <TaskForm onAdd={addTask} />
      <div style={{ textAlign: "right", marginBottom: 12 }}>
        <button
          onClick={undoGlobal}
          className="btn-undo"
          disabled={undoHistory.length === 0}
        >
          撤销
        </button>
        <button
          onClick={redoGlobal}
          className="btn-undo"
          style={{ marginLeft: 8 }}
          disabled={redoHistory.length === 0}
        >
          回退
        </button>
      </div>
      <TaskList tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />
      <style>{`
        .input, .select {
          padding: 7px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          outline: none;
          font-size: 16px;
          transition: border-color 0.2s;
          margin-right: 0;
        }
        .input:focus, .select:focus {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
        }
        .btn-primary {
          background: #40a9ff;
          color: #fff;
          border: none;
          padding: 8px 22px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #1890ff;
        }
        .btn-delete {
          background: #ffffff;
          color: #505050;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          margin-bottom: 4px;
          box-shadow: none;
        }
        .btn-delete:hover {
          background: #f0f0f0;
        }
        .btn-undo {
          background: #fafafa;
          color: #40a9ff;
          border: 1px solid #40a9ff;
          padding: 6px 22px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-undo:hover:enabled {
          background: #e6f7ff;
        }
        .btn-undo:disabled {
          color: #aaaaaa;
          border-color: #eeeeee;
          cursor: not-allowed;
        }
        .btn-quick {
          background: #fafafa;
          color: #40a9ff;
          border: 1px solid #40a9ff;
          padding: 4px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        .btn-quick:hover {
          background: #e6f7ff;
        }
        .task-row:hover {
          background: #f0f5ff;
          transition: background 0.2s;
        }
        th, td {
          border-bottom: 1px solid #f0f0f0;
          padding: 10px;
          vertical-align: top;
        }
        th {
          font-weight: 600;
          background: #fafafa;
          text-align: center;
        }
        td:nth-child(3),
        td:nth-child(7) {
          text-align: left;
          white-space: normal;
        }
        td {
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default App;
