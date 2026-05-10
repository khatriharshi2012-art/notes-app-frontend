import { useNavigate } from "react-router-dom";
import "../App.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <section className="landing-shell">
      <div className="landing-panel">
        <div className="landing-copy">
          <span className="landing-badge">Notes and tasks, together</span>
          <h1>Capture ideas, plan tasks, and stay organized in one simple workspace.</h1>
          <p>
            NoteNest helps you write quick notes, manage daily tasks, track
            reminders, and keep important work easy to find without jumping
            between different apps.
          </p>

          <div className="landing-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={() => navigate("/register")}
            >
              Create account
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>

        <div className="landing-preview">
          <div className="preview-card preview-card-main">
            <div className="preview-card-header">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
            </div>
            <h3>Your daily workspace</h3>
            <div className="preview-row">
              <strong>Notes</strong>
              <span>save ideas, meetings, and quick drafts</span>
            </div>
            <div className="preview-row">
              <strong>Tasks</strong>
              <span>organize priorities, dates, and subtasks</span>
            </div>
            <div className="preview-pill-row">
              <span>Fast search</span>
              <span>Reminders</span>
              <span>Responsive layout</span>
            </div>
          </div>

          <div className="preview-card preview-card-accent">
            <p>Task planner</p>
            <strong>Track important work with categories and due dates</strong>
          </div>

          <div className="preview-card preview-card-soft">
            <p>Notes space</p>
            <strong>Keep personal ideas, study points, and work notes in one place</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Landing;
