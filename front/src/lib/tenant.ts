export function detectTenant(): string | null {
  // host puede venir como "acme.localhost:5173" o "acme.tu-dominio.com:443"
  const host = window.location.host;               // e.g. "acme.localhost:5173"
  const [withoutPort] = host.split(":");           // "acme.localhost"
  const parts = withoutPort.split(".");            // ["acme","localhost"]

  // subdominio real (acme.tu-dominio.com → "acme")
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    if (sub !== "www") return sub;
  }

  // en dev con localhost no habrá subdominio → usa localStorage
  const saved = localStorage.getItem("tenant");
  if (saved) return saved;

  // fallback .env
  const envDefault = import.meta.env.VITE_DEFAULT_TENANT as string | undefined;
  return envDefault ?? null;
}

export function getTenant(): string | null {
  return localStorage.getItem('tenant') || import.meta.env.VITE_DEFAULT_TENANT || null;
}
export function setTenant(slug: string) {
  localStorage.setItem('tenant', slug.trim().toLowerCase());
}
export function clearTenant() {
  localStorage.removeItem('tenant');
}
