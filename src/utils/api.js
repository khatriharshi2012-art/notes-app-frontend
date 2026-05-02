const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

if (!API_BASE_URL) {
  console.error("❌ Missing VITE_API_BASE_URL");
}

const AUTH_CHANGE_EVENT = "authchange";

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  console.log("API_BASE_URL:", API_BASE_URL);
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

export const isAuthenticated = () => Boolean(localStorage.getItem("token"));

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  notifyAuthChange();
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
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
