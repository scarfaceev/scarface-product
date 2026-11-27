const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";

export function authApiUrl(path) {
  return `${apiBaseUrl}/api/auth/${path.replace(/^\/+/, "")}`;
}
