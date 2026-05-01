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
import { addAuthChangeListener, isAuthenticated } from "./utils/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isAuthenticated());

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(isAuthenticated());
    };

    return addAuthChangeListener(syncAuthState);
  }, []);

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
