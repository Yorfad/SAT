import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { resolveTenant  } from "./tenant";

// URL del servidor para app móvil
// En desarrollo local: usar IP local del WiFi (ej: http://192.168.1.100:3001/api)
// En producción: usar la URL de Railway
const MOBILE_API_URL_DEV = "http://172.20.10.4:3001/api";
const MOBILE_API_URL_PROD = "https://sat-production-2745.up.railway.app/api";

// Determina si estamos en modo desarrollo o producción
const IS_PRODUCTION = import.meta.env.PROD;

// Detecta si estamos en plataforma nativa (iOS/Android)
function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Normaliza la baseURL y evita errores si alguien configuró /api/admin o /api/client
function computeBaseUrl(): string {
  // En plataforma nativa, usar la URL móvil según el entorno
  if (isNativePlatform()) {
    return IS_PRODUCTION ? MOBILE_API_URL_PROD : MOBILE_API_URL_DEV;
  }

  // En web, usar ruta relativa para aprovechar el proxy de nginx
  // Esto permite acceder desde cualquier IP/dominio
  const raw = (import.meta as any).env?.VITE_API_URL ?? "/api";
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

const baseURL = computeBaseUrl();
console.log("API baseURL:", baseURL);
console.log("isNativePlatform:", isNativePlatform());

const api = axios.create({
  baseURL,
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
    // Solo redirigir a login si es 401 Y no estamos ya en una página de login
    const isLoginPage = window.location.pathname.includes('/login') ||
                        window.location.pathname.includes('/register');

    if (err?.response?.status === 401 && !isLoginPage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // En móvil, redirigir al login de clientes
      const redirectTo = isNativePlatform() ? "/client/login" : "/login";
      window.location.href = redirectTo;
    }
    return Promise.reject(err);
  }
);

export default api;
