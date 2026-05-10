import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../App.css";

const navigationItems = [
  { path: "/home", label: "Notes", icon: "fa-regular fa-note-sticky" },
  { path: "/tasks", label: "Tasks", icon: "fa-solid fa-list-check" },
  { path: "/dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line" },
];

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visitRoute = (path) => {
    navigate(path);
  };

  return (
    <div className="workspace-shell">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle workspace navigation"
      >
        <i className={`fa-solid ${sidebarOpen ? "fa-xmark" : "fa-bars"}`} />
      </button>

      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside className={`workspace-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="workspace-brand">
          <span className="workspace-brand-mark">NN</span>
          <div>
            <p className="workspace-eyebrow">Workspace</p>
            <h2>NoteNest</h2>
          </div>
        </div>

        <nav className="workspace-nav">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={location.pathname === item.path ? "active" : ""}
              onClick={() => {
                setSidebarOpen(false);
                visitRoute(item.path);
              }}
            >
              <i className={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Home;
