import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../App.css";
import { buildApiUrl, readJsonResponse, setAuthSession } from "../utils/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("All fields are required");
      return;
    }

    try {
      const res = await fetch(buildApiUrl("/user/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJsonResponse(res);
      const user = data?.data?.user;
      const accessToken = data?.data?.accessToken;

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      if (!user || !accessToken) {
        alert("Invalid login response from server");
        return;
      }

      setAuthSession({ token: accessToken, user });
      navigate("/home", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="login-div">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <i className="fa-solid fa-eye-slash"></i>
            ) : (
              <i className="fa-solid fa-eye"></i>
            )}
          </span>
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        Don&apos;t have an account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}

export default Login;
