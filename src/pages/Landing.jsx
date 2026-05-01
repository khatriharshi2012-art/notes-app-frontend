import { useNavigate } from "react-router-dom";
import "../App.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <h1>NoteNest</h1>
      <p>Organize your thoughts effortlessly</p>

      <div className="landing-buttons">
        <button onClick={() => navigate("/register")}>Get Started</button>
        <button onClick={() => navigate("/login")}>Login</button>
      </div>
    </div>
  );
}

export default Landing;
