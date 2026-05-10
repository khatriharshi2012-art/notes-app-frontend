import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import { useFeedback } from "../hooks/useFeedback";
import { buildApiUrl, readJsonResponse, setAuthSession } from "../utils/api";

function Register() {
  const navigate = useNavigate();
  const { showToast } = useFeedback();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!name || !email || !password) {
      showToast({
        title: "Missing details",
        message: "Name, email, and password are all required.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(buildApiUrl("/user/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await readJsonResponse(response);
      const user = data?.data?.user;
      const token = data?.data?.token;

      if (!response.ok) {
        showToast({
          title: "Signup failed",
          message: data?.message || "Please review your details and try again.",
          type: "error",
        });
        return;
      }

      if (!user || !token) {
        showToast({
          title: "Unexpected response",
          message: "The account was created but the session is incomplete.",
          type: "error",
        });
        return;
      }

      setAuthSession({ token, user });
      showToast({
        title: `Welcome, ${user.name || "there"}`,
        message: "Your workspace is ready.",
        type: "success",
      });
      navigate("/home", { replace: true });
    } catch (error) {
      console.error(error);
      showToast({
        title: "Something went wrong",
        message: "We could not complete signup right now.",
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
          <span className="landing-badge">Create account</span>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          <label className="field-group">
            <span>Name</span>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

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
                placeholder="Choose a secure password"
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
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="auth-footnote">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
