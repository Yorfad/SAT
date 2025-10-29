export function detectTenant(): string | null {
  // 1) subdominio: acme.tu-dominio.com
  const host = window.location.host;
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0]; // acme

  // 2) localStorage
  const saved = localStorage.getItem("tenant");
  if (saved) return saved;

  // 3) .env
  return import.meta.env.VITE_DEFAULT_TENANT ?? null;
}
