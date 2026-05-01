import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../App.css";
import {
  addAuthChangeListener,
  clearAuthSession,
  getStoredUser,
} from "../utils/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light",
  );

  const dropdownRef = useRef();

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    syncUser();

    return addAuthChangeListener(syncUser);
  }, []);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const logout = () => {
    clearAuthSession();
    setUser(null);
    setShowDropdown(false);
    navigate("/", { replace: true });
  };

  const getInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="navbar">
      <div className="navbar-inner">
        {/* LOGO */}
        <h1 className="logo" onClick={() => navigate("/")}>
          📝 NoteNest
        </h1>

        {/* ACTIONS */}
        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>

          {user ? (
            <div className="profile-wrapper" ref={dropdownRef}>
              <div
                className="profile"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="avatar">{getInitial()}</div>

                <p className="p-tag">{user?.name}</p>
              </div>

              {showDropdown && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <div className="avatar big">{getInitial()}</div>
                    <div>
                      <p className="dropdown-name">{user?.name}</p>
                      <p className="dropdown-email">{user?.email}</p>
                    </div>
                  </div>

                  <hr />

                  <button onClick={() => navigate("/home")}>Dashboard</button>

                  <button onClick={logout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                className={location.pathname === "/login" ? "active" : ""}
                onClick={() => navigate("/login")}
              >
                Login
              </button>

              <button
                className={location.pathname === "/register" ? "active" : ""}
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
