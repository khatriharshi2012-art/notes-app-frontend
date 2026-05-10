import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Todo from "./pages/Todo";
import Notes from "./pages/Notes";
import Dashboard from "./pages/Dashboard";
import { useFeedback } from "./hooks/useFeedback";
import {
  addAuthChangeListener,
  clearAuthSession,
  getSessionTimeoutMs,
  hasSessionExpired,
  isAuthenticated,
  touchAuthSession,
} from "./utils/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());
  const { showToast } = useFeedback();

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(isAuthenticated());
    };

    return addAuthChangeListener(syncAuthState);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    let hasExpiredSession = false;

    const expireSession = () => {
      if (hasExpiredSession) {
        return;
      }

      hasExpiredSession = true;
      clearAuthSession();
      showToast({
        title: "Session expired",
        message: "You were signed out automatically after inactivity.",
        type: "info",
      });
    };

    const handleActivity = () => {
      if (hasSessionExpired()) {
        expireSession();
        return;
      }

      touchAuthSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };

    const interval = window.setInterval(() => {
      if (hasSessionExpired()) {
        expireSession();
      }
    }, Math.min(getSessionTimeoutMs(), 60000));

    const activityEvents = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    touchAuthSession();

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, showToast]);

  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* PUBLIC */}
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/home" replace /> : <Landing />}
        />

        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/home" replace /> : <Login />}
        />

        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/home" replace /> : <Register />}
        />

        {/* PROTECTED WITH SIDEBAR */}
        <Route element={isLoggedIn ? <Home /> : <Navigate to="/" replace />}>
          <Route path="/home" element={<Notes />} />
          <Route path="/tasks" element={<Todo />} />
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
