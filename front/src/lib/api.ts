import axios from "axios";
import { resolveTenant  } from "./tenant";

// Normaliza la baseURL y evita errores si alguien configuró /api/admin o /api/client
function computeBaseUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000/api";
  // quita espacios y barras finales
  let url = String(raw).trim().replace(/\/$/, "");
  // si accidentalmente pusieron /api/admin o /api/client, normaliza de nuevo a /api
  url = url.replace(/(\/api)\/(admin|client|employee)(?=\/|$)/, "$1");
  return url;
}

// Función para obtener el workspace actual del localStorage
function getCurrentWorkspace(): string | null {
  const consolidated = localStorage.getItem('consolidatedView');
  if (consolidated === 'true') return 'all';
  return localStorage.getItem('currentWorkspace');
}

const api = axios.create({
  baseURL: computeBaseUrl(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const tenant = resolveTenant();
  if (tenant) config.headers['X-Tenant'] = tenant;

  // Agregar header de workspace
  const workspace = getCurrentWorkspace();
  if (workspace) config.headers['X-Workspace'] = workspace;

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
