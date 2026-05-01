import { useEffect, useRef, useState } from "react";
import "../App.css";
import {
  buildApiUrl,
  getAuthHeaders,
  readJsonResponse,
} from "../utils/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const getData = async () => {
    setIsLoading(true);

    try {
      const [notesRes, tasksRes] = await Promise.all([
        fetch(buildApiUrl("/notes/get-note"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }),
        fetch(buildApiUrl("/todo/get-todo"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        }),
      ]);

      const notesData = await readJsonResponse(notesRes);
      const tasksData = await readJsonResponse(tasksRes);

      const notes = notesData?.data || [];
      const tasks = tasksData?.data || [];

      setStats({
        notes: notes.length,
        tasks: tasks.length,
        completed: tasks.filter((t) => t.isCompleted).length,
        important: tasks.filter((t) => t.isImportant).length,
      });
    } catch {
      setStats({
        notes: 0,
        tasks: 0,
        completed: 0,
        important: 0,
      });
      alert("Error loading dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    getData();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <h1> Dashboard</h1>

        <div className="dashboard-grid">
          <div className="card">
            <h2>...</h2>
            <p>Notes</p>
          </div>

          <div className="card">
            <h2>...</h2>
            <p>Total Tasks</p>
          </div>

          <div className="card">
            <h2>...</h2>
            <p>Completed</p>
          </div>

          <div className="card">
            <h2>...</h2>
            <p>Important</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      <div className="dashboard-grid">
        <div className="card">
          <h2>{stats.notes}</h2>
          <p>Notes</p>
        </div>

        <div className="card">
          <h2>{stats.tasks}</h2>
          <p>Total Tasks</p>
        </div>

        <div className="card">
          <h2>{stats.completed}</h2>
          <p>Completed</p>
        </div>

        <div className="card">
          <h2>{stats.important}</h2>
          <p>Important</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
