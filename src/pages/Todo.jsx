import { useEffect, useMemo, useRef, useState } from "react";
import "../App.css";
import { buildApiUrl, getAuthHeaders, readJsonResponse } from "../utils/api";

const categories = [
  { value: "all", label: "All Tasks", icon: "List" },
  { value: "work", label: "Work", icon: "Work" },
  { value: "study", label: "Study", icon: "Study" },
  { value: "personal", label: "Personal", icon: "Personal" },
  { value: "general", label: "General", icon: "General" },
];

const initialTaskData = {
  title: "",
  description: "",
  priority: "low",
  dueDate: "",
  reminder: "",
  isCompleted: false,
  isImportant: false,
  category: "general",
  subtasks: [{ text: "", done: false }],
};

function Todo() {
  const [tasks, setTasks] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskData, setTaskData] = useState(initialTaskData);
  const [filter, setFilter] = useState(() => {
    return localStorage.getItem("filter") || "all";
  });

  const [categoryFilter, setCategoryFilter] = useState(() => {
    return localStorage.getItem("categoryFilter") || "all";
  });
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const hasFetchedRef = useRef(false);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    localStorage.setItem("filter", filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem("categoryFilter", categoryFilter);
  }, [categoryFilter]);

  const getTasks = async () => {
    setIsLoading(true);

    try {
      const res = await fetch(buildApiUrl("/todo/get-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(data?.message || "Error loading tasks", "error");
        setTasks([]);
        return;
      }

      setTasks(data?.data || []);
    } catch (error) {
      console.error(error);
      setTasks([]);
      showToast("Error loading tasks", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    getTasks();
  }, []);

  useEffect(() => {
    if (!tasks?.length) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      tasks.forEach((task) => {
        if (task.isCompleted) {
          return;
        }

        const reminderSource = task.reminder || task.dueDate;
        if (!reminderSource) {
          return;
        }

        const reminderTime = new Date(reminderSource).getTime();
        const diff = reminderTime - now;

        if (diff > 0 && diff <= 60000) {
          showReminder(task, reminderSource);
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [tasks]);

  const showReminder = (task, reminderSource) => {
    const reminderKey = `reminder-${task._id}-${new Date(reminderSource).getTime()}`;
    const shown = sessionStorage.getItem(reminderKey);

    if (shown) {
      return;
    }

    sessionStorage.setItem(reminderKey, "true");

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Task Reminder", {
          body: task.title,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Task Reminder", {
              body: task.title,
            });
          }
        });
      }
    }

    showToast(`Reminder: ${task.title}`, "info");
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTaskData(initialTaskData);
    setShowModal(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskData({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "low",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      reminder: task.reminder
        ? new Date(
            new Date(task.reminder).getTime() -
              new Date(task.reminder).getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
      isCompleted: Boolean(task.isCompleted),
      isImportant: Boolean(task.isImportant),
      category: task.category || "general",
      subtasks:
        task.subtasks?.length > 0
          ? task.subtasks.map((subtask) => ({
              text: subtask.text || "",
              done: Boolean(subtask.done),
            }))
          : [{ text: "", done: false }],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setTaskData(initialTaskData);
  };

  const saveTask = async () => {
    if (!taskData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    const payload = {
      ...taskData,
      dueDate: taskData.dueDate || null,
      reminder: taskData.reminder || null,
      subtasks: taskData.subtasks.filter((subtask) => subtask.text.trim()),
    };

    const url = editingTask ? "/todo/update-todo" : "/todo/create-todo";
    const body = editingTask
      ? JSON.stringify({ id: editingTask._id, ...payload })
      : JSON.stringify(payload);

    try {
      const res = await fetch(buildApiUrl(url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body,
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(data?.message || "Error saving task", "error");
        return;
      }

      if (editingTask) {
        setTasks((prev) =>
          prev.map((item) => (item._id === editingTask._id ? data.data : item)),
        );
        showToast("Task updated", "success");
      } else {
        setTasks((prev) => [data.data, ...prev]);
        showToast("Task created", "success");
      }

      closeModal();
    } catch (error) {
      console.error(error);
      showToast("Error saving task", "error");
    }
  };

  const deleteTask = async (id) => {
    try {
      const res = await fetch(buildApiUrl("/todo/delete-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(data?.message || "Failed to delete task", "error");
        return;
      }

      setTasks((prev) => prev.filter((task) => task._id !== id));
      setPendingDeleteId(null);
      showToast("Task deleted", "success");
    } catch (error) {
      console.error(error);
      showToast("Error deleting task", "error");
    }
  };

  const toggleComplete = async (task) => {
    try {
      const res = await fetch(buildApiUrl("/todo/update-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: task._id,
          isCompleted: !task.isCompleted,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(data?.message || "Failed to update task", "error");
        return;
      }

      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? data.data : item)),
      );
    } catch (error) {
      console.error(error);
      showToast("Error updating task", "error");
    }
  };

  const toggleImportant = async (task) => {
    try {
      const res = await fetch(buildApiUrl("/todo/update-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: task._id,
          isImportant: !task.isImportant,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(
          data?.message || "Failed to update important status",
          "error",
        );
        return;
      }

      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? data.data : item)),
      );
      showToast(
        data.data?.isImportant
          ? "Marked as important"
          : "Removed from important",
        "success",
      );
    } catch (error) {
      console.error(error);
      showToast("Error updating important status", "error");
    }
  };

  const toggleSubtask = async (task, index) => {
    try {
      const updatedSubtasks = [...(task.subtasks || [])];
      updatedSubtasks[index] = {
        ...updatedSubtasks[index],
        done: !updatedSubtasks[index].done,
      };

      const res = await fetch(buildApiUrl("/todo/update-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: task._id,
          subtasks: updatedSubtasks,
        }),
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        showToast(data?.message || "Failed to update subtask", "error");
        return;
      }

      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? data.data : item)),
      );
    } catch (error) {
      console.error(error);
      showToast("Error updating subtask", "error");
    }
  };

  const filteredTasks = useMemo(() => {
    const today = new Date().toDateString();
    const query = search.trim().toLowerCase();

    return (tasks || []).filter((task) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "today" &&
          task.dueDate &&
          new Date(task.dueDate).toDateString() === today) ||
        (filter === "upcoming" &&
          task.dueDate &&
          new Date(task.dueDate) > new Date()) ||
        (filter === "important" && task.isImportant);

      const matchesCategory =
        categoryFilter === "all" || task.category === categoryFilter;

      const matchesSearch =
        !query ||
        (task.title || "").toLowerCase().includes(query) ||
        (task.description || "").toLowerCase().includes(query) ||
        (task.category || "").toLowerCase().includes(query);

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [tasks, filter, categoryFilter, search]);

  const getCategoryCount = (category) => {
    if (category === "all") {
      return tasks?.length || 0;
    }

    return (tasks || []).filter((task) => task.category === category).length;
  };

  if (isLoading) {
    return (
      <div className="todo-page">
        <div className="todo-header">
          <div className="todo-header-copy">
            <h1>Tasks</h1>
            <p className="sub-text">Organize your work like a pro</p>
          </div>

          <div className="todo-header-actions">
            <input
              className="todo-search"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button className="primary-btn" onClick={openCreateModal}>
              Add Task
            </button>
          </div>
        </div>

        <div className="task-tabs">
          {["all", "today", "upcoming", "important"].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? "active" : ""}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="task-sidebar">
          <h3>Categories</h3>

          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`cat-item ${categoryFilter === category.value ? "active" : ""}`}
                onClick={() => setCategoryFilter(category.value)}
              >
                <span className="cat-icon">{category.icon}</span>
                <span className="cat-label">{category.label}</span>
                <span className="count">
                  {getCategoryCount(category.value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="task-list">
          <div className="empty-state">
            <h3>Loading tasks...</h3>
            <p>Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-page">
      <div className="todo-header">
        <div className="todo-header-copy">
          <h1>Tasks</h1>
          <p className="sub-text">Organize your work like a pro</p>
        </div>

        <div className="todo-header-actions">
          <input
            className="todo-search"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="primary-btn" onClick={openCreateModal}>
            <i class="fa-solid fa-plus"></i> Add Task
          </button>
        </div>
      </div>

      <div className="task-tabs">
        {["all", "today", "upcoming", "important"].map((tab) => (
          <button
            key={tab}
            className={filter === tab ? "active" : ""}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="task-sidebar">
        <h3>Categories</h3>

        <div className="category-grid">
          {categories.map((category) => (
            <button
              key={category.value}
              type="button"
              className={`cat-item ${categoryFilter === category.value ? "active" : ""}`}
              onClick={() => setCategoryFilter(category.value)}
            >
              <span className="cat-icon">{category.icon}</span>
              <span className="cat-label">{category.label}</span>
              <span className="count">{getCategoryCount(category.value)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks here</h3>
            <p>Create your first task to get started</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div className="task-card" key={task._id}>
              <div className="task-left">
                <input
                  type="checkbox"
                  checked={Boolean(task.isCompleted)}
                  onChange={() => toggleComplete(task)}
                />

                <div>
                  <div className="task-top-row">
                    <button
                      type="button"
                      className={`task-title-button ${task.isCompleted ? "completed" : ""}`}
                      onClick={() => openEditModal(task)}
                    >
                      {task.title}
                    </button>

                    <span
                      className={`category-tag ${task.category || "general"}`}
                    >
                      {task.category || "general"}
                    </span>

                    {task.reminder && (
                      <span
                        className="reminder-pill"
                        title={new Date(task.reminder).toLocaleString()}
                      >
                        <i className="fa-solid fa-bell"></i>
                      </span>
                    )}
                  </div>

                  {task.description && <p>{task.description}</p>}

                  {task.subtasks?.length > 0 && (
                    <div className="subtask-list">
                      {task.subtasks.map((subtask, index) => (
                        <div
                          key={`${task._id}-${index}`}
                          className="subtask-item"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(subtask.done)}
                            onChange={() => toggleSubtask(task, index)}
                          />
                          <span className={subtask.done ? "completed" : ""}>
                            {subtask.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="task-meta">
                    {task.dueDate && (
                      <small>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </small>
                    )}
                    {task.reminder && (
                      <small>
                        Reminder: {new Date(task.reminder).toLocaleString()}
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="task-right">
                <button type="button" onClick={() => toggleImportant(task)}>
                  {task.isImportant ? (
                    <i class="fa-solid fa-star"></i>
                  ) : (
                    <i class="fa-regular fa-star"></i>
                  )}
                </button>

                <span className={`priority ${task.priority}`}>
                  {task.priority}
                </span>

                <button
                  type="button"
                  onClick={() => setPendingDeleteId(task._id)}
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modern-modal">
            {/* HEADER */}
            <div className="modal-header">
              <h2>{editingTask ? "Update Task" : "New Task"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ✖
              </button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              {/* TITLE */}
              <input
                className="input-title"
                placeholder="Task title..."
                value={taskData.title}
                onChange={(e) =>
                  setTaskData({ ...taskData, title: e.target.value })
                }
              />

              {/* DESCRIPTION */}
              <textarea
                className="input-desc"
                placeholder="Add description..."
                value={taskData.description}
                onChange={(e) =>
                  setTaskData({ ...taskData, description: e.target.value })
                }
              />

              {/* SUBTASKS */}
              <div className="subtasks-box">
                <h4>Subtasks</h4>

                {taskData.subtasks.map((sub, i) => (
                  <div key={i} className="subtask-item">
                    <input
                      type="text"
                      placeholder="Subtask..."
                      value={sub.text}
                      onChange={(e) => {
                        const updated = [...taskData.subtasks];
                        updated[i].text = e.target.value;
                        setTaskData({ ...taskData, subtasks: updated });
                      }}
                    />

                    <button
                      className="remove-btn"
                      onClick={() => {
                        const updated = taskData.subtasks.filter(
                          (_, index) => index !== i,
                        );
                        setTaskData({
                          ...taskData,
                          subtasks: updated.length
                            ? updated
                            : [{ text: "", done: false }],
                        });
                      }}
                    >
                      ✖
                    </button>
                  </div>
                ))}

                <button
                  className="add-subtask"
                  onClick={() =>
                    setTaskData({
                      ...taskData,
                      subtasks: [
                        ...taskData.subtasks,
                        { text: "", done: false },
                      ],
                    })
                  }
                >
                  + Add Subtask
                </button>
              </div>

              {/* META ROW */}
              <div className="meta-row">
                <div className="field-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) =>
                      setTaskData({ ...taskData, dueDate: e.target.value })
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Reminder</label>
                  <input
                    type="datetime-local"
                    value={taskData.reminder}
                    onChange={(e) =>
                      setTaskData({ ...taskData, reminder: e.target.value })
                    }
                  />
                </div>

                <div className="field-group">
                  <label>Categories</label>
                  <select
                    value={taskData.category}
                    onChange={(e) =>
                      setTaskData({ ...taskData, category: e.target.value })
                    }
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>

              {/* PRIORITY */}
              <div className="priority-modern">
                {["low", "medium", "high"].map((p) => (
                  <span
                    key={p}
                    className={`priority-pill ${p} ${taskData.priority === p ? "active" : ""}`}
                    onClick={() => setTaskData({ ...taskData, priority: p })}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveTask}>
                {editingTask ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId && (
        <div className="modal">
          <div className="confirm-box">
            <h3>Delete task?</h3>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => deleteTask(pendingDeleteId)}>
                Delete
              </button>
              <button onClick={() => setPendingDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}

export default Todo;
