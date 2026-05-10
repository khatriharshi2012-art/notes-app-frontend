import { useCallback, useEffect, useRef, useState } from "react";
import "../App.css";
import { useFeedback } from "../hooks/useFeedback";
import { buildApiUrl, getAuthHeaders, readJsonResponse } from "../utils/api";

function Dashboard() {
  const { showToast } = useFeedback();
  const [stats, setStats] = useState({
    notes: 0,
    tasks: 0,
    completed: 0,
    important: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [notesResponse, tasksResponse] = await Promise.all([
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

      const notesData = await readJsonResponse(notesResponse);
      const tasksData = await readJsonResponse(tasksResponse);
      const notes = notesData?.data || [];
      const tasks = tasksData?.data || [];

      setStats({
        notes: notes.length,
        tasks: tasks.length,
        completed: tasks.filter((task) => task.isCompleted).length,
        important: tasks.filter((task) => task.isImportant).length,
      });
    } catch (error) {
      console.error(error);
      setStats({
        notes: 0,
        tasks: 0,
        completed: 0,
        important: 0,
      });
      showToast({
        title: "Dashboard unavailable",
        message: "We could not load the latest totals.",
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
    loadData();
  }, [loadData]);

  const cards = [
    {
      label: "Notes",
      value: stats.notes,
      icon: "fa-regular fa-note-sticky",
      accent: "sky",
    },
    {
      label: "Total Tasks",
      value: stats.tasks,
      icon: "fa-solid fa-list-check",
      accent: "amber",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "fa-solid fa-circle-check",
      accent: "green",
    },
    {
      label: "Important",
      value: stats.important,
      icon: "fa-solid fa-star",
      accent: "rose",
    },
  ];

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-kicker">Overview</span>
          <h1>Your productivity snapshot.</h1>
          <p>Use this dashboard to quickly understand what needs attention across notes and tasks.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <article key={card.label} className={`metric-card ${card.accent}`}>
            <div className="metric-icon">
              <i className={card.icon} />
            </div>
            <div>
              <p>{card.label}</p>
              <h2>{isLoading ? "..." : card.value}</h2>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Dashboard;
