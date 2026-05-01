import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  

  return (
    <div className="app-layout">
      <div className="sidebar">
        <h2>NoteNest</h2>

        <ul>
          <li
            className={location.pathname === "/home" ? "active" : ""}
            onClick={() => navigate("/home")}
          >
            Notes
          </li>

          <li
            className={location.pathname === "/tasks" ? "active" : ""}
            onClick={() => navigate("/tasks")}
          >
            Tasks
          </li>

          <li
            className={location.pathname === "/dashboard" ? "active" : ""}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </li>
        </ul>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Home;
