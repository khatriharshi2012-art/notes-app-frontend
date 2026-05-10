import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../App.css";
import { useFeedback } from "../hooks/useFeedback";
import { buildApiUrl, getAuthHeaders, readJsonResponse } from "../utils/api";

const categories = [
  { value: "all", label: "All Tasks", icon: "All" },
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
  const { showToast, confirm } = useFeedback();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskData, setTaskData] = useState(initialTaskData);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState(
    () => localStorage.getItem("filter") || "all",
  );
  const [categoryFilter, setCategoryFilter] = useState(
    () => localStorage.getItem("categoryFilter") || "all",
  );
  const hasFetchedRef = useRef(false);
  const search = searchParams.get("q") || "";

  useEffect(() => {
    localStorage.setItem("filter", filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem("categoryFilter", categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", showModal);

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showModal]);

  const getTasks = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(buildApiUrl("/todo/get-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Could not load tasks",
          message: data?.message || "Please try again shortly.",
          type: "error",
        });
        setTasks([]);
        return;
      }

      setTasks(data?.data || []);
    } catch (error) {
      console.error(error);
      setTasks([]);
      showToast({
        title: "Request failed",
        message: "Tasks could not be loaded.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    getTasks();
  }, [getTasks]);

  useEffect(() => {
    if (!tasks.length) {
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
          const reminderKey = `reminder-${task._id}-${reminderTime}`;

          if (sessionStorage.getItem(reminderKey)) {
            return;
          }

          sessionStorage.setItem(reminderKey, "true");

          if ("Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Task Reminder", { body: task.title });
            } else if (Notification.permission !== "denied") {
              Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                  new Notification("Task Reminder", { body: task.title });
                }
              });
            }
          }

          showToast({
            title: "Task reminder",
            message: task.title,
            type: "info",
          });
        }
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [showToast, tasks]);

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
    if (isSaving) {
      return;
    }

    if (!taskData.title.trim()) {
      showToast({
        title: "Title required",
        message: "Add a task title before saving.",
        type: "error",
      });
      return;
    }

    const payload = {
      ...taskData,
      dueDate: taskData.dueDate || null,
      reminder: taskData.reminder || null,
      subtasks: taskData.subtasks.filter((subtask) => subtask.text.trim()),
    };

    const endpoint = editingTask ? "/todo/update-todo" : "/todo/create-todo";
    const body = editingTask
      ? JSON.stringify({ id: editingTask._id, ...payload })
      : JSON.stringify(payload);

    try {
      setIsSaving(true);

      const response = await fetch(buildApiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body,
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Save failed",
          message: data?.message || "Task changes could not be saved.",
          type: "error",
        });
        return;
      }

      if (editingTask) {
        setTasks((prev) =>
          prev.map((item) => (item._id === editingTask._id ? data.data : item)),
        );
      } else {
        setTasks((prev) => [data.data, ...prev]);
      }

      showToast({
        title: editingTask ? "Task updated" : "Task created",
        message: "Your task list is up to date.",
        type: "success",
      });
      closeModal();
    } catch (error) {
      console.error(error);
      showToast({
        title: "Request failed",
        message: "Task changes could not be saved.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (id) => {
    const shouldDelete = await confirm({
      title: "Delete this task?",
      message: "This task and its subtasks will be removed.",
      confirmLabel: "Delete task",
      cancelLabel: "Keep task",
      tone: "danger",
    });

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/todo/delete-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Delete failed",
          message: data?.message || "Task could not be removed.",
          type: "error",
        });
        return;
      }

      setTasks((prev) => prev.filter((task) => task._id !== id));
      showToast({
        title: "Task deleted",
        message: "The task has been removed.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      showToast({
        title: "Request failed",
        message: "Task could not be removed.",
        type: "error",
      });
    }
  };

  const updateTask = async (task, fields, successMessage) => {
    try {
      const response = await fetch(buildApiUrl("/todo/update-todo"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: task._id,
          ...fields,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showToast({
          title: "Update failed",
          message: data?.message || "The task could not be updated.",
          type: "error",
        });
        return;
      }

      setTasks((prev) =>
        prev.map((item) => (item._id === task._id ? data.data : item)),
      );

      if (successMessage) {
        showToast({
          title: successMessage,
          type: "success",
        });
      }
    } catch (error) {
      console.error(error);
      showToast({
        title: "Request failed",
        message: "The task could not be updated.",
        type: "error",
      });
    }
  };

  const filteredTasks = useMemo(() => {
    const today = new Date().toDateString();
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
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
      return tasks.length;
    }

    return tasks.filter((task) => task.category === category).length;
  };

  return (
    <section className="page-shell">
      <div className="page-color">
        <div className="page-header">
          <div>
            <span className="page-kicker">Task planner</span>
            <h1>Stay on top of work without clutter.</h1>
            <p>
              Track priorities, reminders, and categories in a layout tuned for
              every screen size.
            </p>
          </div>

          <div className="page-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateModal}
            >
              <i className="fa-solid fa-plus" />
              <span>Add task</span>
            </button>
          </div>
        </div>

        <div className="task-tabs">
          {["all", "today", "upcoming", "important"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={filter === tab ? "active" : ""}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="task-sidebar">
        <div className="section-header">
          <h3>Categories</h3>
          <p>Narrow the list fast</p>
        </div>

        <label className="field-group category-dropdown">
          <span>Choose category</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label} ({getCategoryCount(category.value)})
              </option>
            ))}
          </select>
        </label>

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

      {isLoading ? (
        <div className="empty-panel">
          <h3>Loading tasks...</h3>
          <p>Your planner is being prepared.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-panel">
          <h3>No tasks here yet</h3>
          <p>Create a task or change the filters to see more results.</p>
        </div>
      ) : (
        <div className="task-list">
          {filteredTasks.map((task) => (
            <article className="task-card" key={task._id}>
              <div className="task-left">
                <label className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={Boolean(task.isCompleted)}
                    onChange={() =>
                      updateTask(
                        task,
                        { isCompleted: !task.isCompleted },
                        "Task status updated",
                      )
                    }
                  />
                  <span />
                </label>

                <div className="task-body">
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

                    {task.reminder ? (
                      <span
                        className="reminder-pill"
                        title={new Date(task.reminder).toLocaleString()}
                      >
                        <i className="fa-solid fa-bell" />
                      </span>
                    ) : null}
                  </div>

                  {task.description ? <p>{task.description}</p> : null}

                  {task.subtasks?.length ? (
                    <div className="subtask-list">
                      {task.subtasks.map((subtask, index) => (
                        <label
                          key={`${task._id}-${index}`}
                          className="subtask-item"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(subtask.done)}
                            onChange={() => {
                              const updatedSubtasks = [...task.subtasks];
                              updatedSubtasks[index] = {
                                ...updatedSubtasks[index],
                                done: !updatedSubtasks[index].done,
                              };
                              updateTask(task, { subtasks: updatedSubtasks });
                            }}
                          />
                          <span className={subtask.done ? "completed" : ""}>
                            {subtask.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : null}

                  <div className="task-meta">
                    {task.dueDate ? (
                      <small>
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </small>
                    ) : null}
                    {task.reminder ? (
                      <small>
                        Reminder {new Date(task.reminder).toLocaleString()}
                      </small>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="task-right">
                <button
                  type="button"
                  className={`icon-button ${task.isImportant ? "is-active" : ""}`}
                  onClick={() =>
                    updateTask(
                      task,
                      { isImportant: !task.isImportant },
                      task.isImportant
                        ? "Removed from important"
                        : "Marked as important",
                    )
                  }
                  aria-label="Toggle important"
                >
                  <i
                    className={`${task.isImportant ? "fa-solid" : "fa-regular"} fa-star`}
                  />
                </button>

                <span className={`priority priority-${task.priority}`}>
                  {task.priority}
                </span>

                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => deleteTask(task._id)}
                  aria-label="Delete task"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal ? (
        <div className="overlay-shell" role="presentation">
          <div
            className="modal-card modal-card-wide"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div>
                <span className="page-kicker">
                  {editingTask ? "Edit task" : "New task"}
                </span>
                <h2>
                  {editingTask ? "Update task details" : "Plan the next task"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                aria-label="Close task modal"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modal-body">
              <label className="field-group task-modal-field task-modal-field-title">
                <span>Title</span>
                <input
                  className="task-modal-input"
                  placeholder="Task title"
                  value={taskData.title}
                  onChange={(event) =>
                    setTaskData({ ...taskData, title: event.target.value })
                  }
                />
              </label>

              <label className="field-group task-modal-field">
                <span>Description</span>
                <textarea
                  className="input-desc task-modal-input"
                  placeholder="Add a helpful description"
                  value={taskData.description}
                  onChange={(event) =>
                    setTaskData({
                      ...taskData,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <div className="subtasks-box task-modal-section">
                <div className="section-header">
                  <h4>Subtasks</h4>
                  <p>Break work into smaller steps</p>
                </div>

                {taskData.subtasks.map((subtask, index) => (
                  <div
                    key={`${subtask.text}-${index}`}
                    className="subtask-editor"
                  >
                    <input
                      type="text"
                      className="task-modal-input"
                      placeholder="Subtask"
                      value={subtask.text}
                      onChange={(event) => {
                        const updated = [...taskData.subtasks];
                        updated[index].text = event.target.value;
                        setTaskData({ ...taskData, subtasks: updated });
                      }}
                    />

                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() => {
                        const updated = taskData.subtasks.filter(
                          (_, idx) => idx !== index,
                        );
                        setTaskData({
                          ...taskData,
                          subtasks: updated.length
                            ? updated
                            : [{ text: "", done: false }],
                        });
                      }}
                      aria-label="Remove subtask"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="button button-ghost"
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
                  <i className="fa-solid fa-plus" />
                  <span>Add subtask</span>
                </button>
              </div>

              <div className="meta-grid task-modal-meta-grid">
                <label className="field-group task-modal-card">
                  <span className="task-modal-label">
                    <i className="fa-regular fa-calendar" />
                    Due date
                  </span>
                  <input
                    className="task-modal-input"
                    type="date"
                    value={taskData.dueDate}
                    onChange={(event) =>
                      setTaskData({ ...taskData, dueDate: event.target.value })
                    }
                  />
                </label>

                <label className="field-group task-modal-card">
                  <span className="task-modal-label">
                    <i className="fa-regular fa-bell" />
                    Reminder
                  </span>
                  <input
                    className="task-modal-input"
                    type="datetime-local"
                    value={taskData.reminder}
                    onChange={(event) =>
                      setTaskData({ ...taskData, reminder: event.target.value })
                    }
                  />
                </label>

                <label className="field-group task-modal-card">
                  <span className="task-modal-label">
                    <i className="fa-solid fa-layer-group" />
                    Category
                  </span>
                  <select
                    className="task-modal-input"
                    value={taskData.category}
                    onChange={(event) =>
                      setTaskData({ ...taskData, category: event.target.value })
                    }
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="personal">Personal</option>
                  </select>
                </label>
              </div>

              <div className="task-modal-section">
                <div className="section-header">
                  <h4>Priority</h4>
                  <p>Choose how urgent this task feels</p>
                </div>

                <div className="priority-modern task-modal-priority">
                  {["low", "medium", "high"].map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      className={`priority-pill ${priority} ${taskData.priority === priority ? "active" : ""}`}
                      onClick={() => setTaskData({ ...taskData, priority })}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={saveTask}
                disabled={isSaving}
              >
                {isSaving
                  ? editingTask
                    ? "Updating..."
                    : "Saving..."
                  : editingTask
                    ? "Update task"
                    : "Save task"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default Todo;
