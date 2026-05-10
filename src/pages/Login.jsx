import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { useFeedback } from "../hooks/useFeedback";
import { buildApiUrl, readJsonResponse, setAuthSession } from "../utils/api";

function Login() {
  const navigate = useNavigate();
  const { showToast } = useFeedback();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      showToast({
        title: "Missing details",
        message: "Please enter both email and password.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/user/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJsonResponse(response);
      const user = data?.data?.user;
      const accessToken = data?.data?.accessToken;

      if (!response.ok) {
        showToast({
          title: "Login failed",
          message: data?.message || "Please check your credentials and try again.",
          type: "error",
        });
        return;
      }

      if (!user || !accessToken) {
        showToast({
          title: "Unexpected response",
          message: "The server did not return a valid session.",
          type: "error",
        });
        return;
      }

      setAuthSession({ token: accessToken, user });
      showToast({
        title: `Welcome back, ${user.name || "there"}`,
        message: "You are now signed in.",
        type: "success",
      });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      showToast({
        title: "Something went wrong",
        message: "We could not reach the server right now.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <div className="auth-copy">
          <span className="landing-badge">Login</span>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="field-group">
            <span>Email</span>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </label>

          <button type="submit" className="button button-primary button-block" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="auth-footnote">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
