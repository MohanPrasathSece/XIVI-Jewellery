const DEFAULT_API_URL = "";

export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  return DEFAULT_API_URL;
};

export const getFrontendUrl = () => {
  const envUrl = import.meta.env.VITE_FRONTEND_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5173";
};
