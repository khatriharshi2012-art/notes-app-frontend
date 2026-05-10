import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../App.css";
import {
  addAuthChangeListener,
  clearAuthSession,
  getStoredUser,
} from "../utils/api";
import { useFeedback } from "../hooks/useFeedback";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useFeedback();

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    return localStorage.getItem("theme") || "light";
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    syncUser();
    return addAuthChangeListener(syncUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", theme === "dark");
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const visitRoute = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setShowDropdown(false);
    showToast({
      title: "Signed out",
      message: "Your session has been cleared safely.",
      type: "info",
    });
    navigate("/");
  };

  const getInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const canSearchWorkspace =
    user && ["/home", "/tasks"].includes(location.pathname);
  const searchValue = canSearchWorkspace ? searchParams.get("q") || "" : "";

  const handleWorkspaceSearch = (value) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set("q", value);
    } else {
      nextParams.delete("q");
    }

    setSearchParams(nextParams);
  };

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button
          type="button"
          className="brand-lockup"
          onClick={() => visitRoute("/")}
        >
          <span className="brand-mark">N</span>
          <span className="brand-copy">
            <strong>NoteNest</strong>
            <small>Focused workspace</small>
          </span>
        </button>

        {canSearchWorkspace ? (
          <label className="search-field nav-search-field">
            <input
              placeholder={
                location.pathname === "/home"
                  ? "Search notes..."
                  : "Search tasks..."
              }
              value={searchValue}
              onChange={(event) => handleWorkspaceSearch(event.target.value)}
            />
            <i className="fa-solid fa-magnifying-glass" />
          </label>
        ) : null}

        <div className="nav-controls">
          {user ? (
            <div className="profile-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <span className="avatar">{getInitial()}</span>
                <span className="profile-copy">
                  <strong>{user?.name}</strong>
                  <small>Account</small>
                </span>
                <i className="fa-solid fa-chevron-down" />
              </button>

              {showDropdown ? (
                <div className="profile-menu">
                  <div className="profile-menu-head">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                  </div>
                  <button type="button" onClick={() => navigate("/home")}>
                    <i className="fa-regular fa-note-sticky" />
                    <span>Open notes</span>
                  </button>
                  <button type="button" onClick={() => navigate("/tasks")}>
                    <i className="fa-solid fa-list-check" />
                    <span>Open tasks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                    aria-label={
                      theme === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                    }
                  >
                    <i
                      className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}
                    />
                    <span>{theme === "dark" ? "Light" : "Dark"}</span>
                  </button>
                  <button type="button" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="nav-auth-actions">
              <button
                type="button"
                className={
                  location.pathname === "/login"
                    ? "button button-secondary active"
                    : "button button-secondary"
                }
                onClick={() => visitRoute("/login")}
              >
                Login
              </button>
              <button
                type="button"
                className={
                  location.pathname === "/register"
                    ? "button button-primary active"
                    : "button button-primary"
                }
                onClick={() => visitRoute("/register")}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
