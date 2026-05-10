const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
const AUTH_CHANGE_EVENT = "authchange";
const AUTH_ACTIVITY_KEY = "authLastActivityAt";
const AUTH_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

if (!API_BASE_URL) {
  console.error("Missing VITE_API_BASE_URL");
}

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const touchAuthSession = () => {
  localStorage.setItem(AUTH_ACTIVITY_KEY, Date.now().toString());
};

export const hasSessionExpired = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  const lastActivityAt = Number(localStorage.getItem(AUTH_ACTIVITY_KEY));

  if (!lastActivityAt) {
    return true;
  }

  return Date.now() - lastActivityAt > AUTH_SESSION_TIMEOUT_MS;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return false;
  }

  if (hasSessionExpired()) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(AUTH_ACTIVITY_KEY);
    return false;
  }

  return true;
};

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  touchAuthSession();
  notifyAuthChange();
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(AUTH_ACTIVITY_KEY);
  notifyAuthChange();
};

export const addAuthChangeListener = (callback) => {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export const getSessionTimeoutMs = () => AUTH_SESSION_TIMEOUT_MS;

export const readJsonResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJsonResponse = contentType.includes("application/json");

  if (isJsonResponse) {
    return response.json();
  }

  const text = await response.text();

  return {
    status: false,
    message: text || "Unexpected server response",
  };
};

export default API_BASE_URL;
