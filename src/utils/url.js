// Origen del backend (sin "/api" ni barra final), p. ej. "http://localhost:3000"
export const API_ORIGIN = (process.env.VUE_APP_API_URL || 'http://localhost:3000/api')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

export const NO_IMAGE = '/assets/img/no_image.png'

// URL absoluta de un archivo servido por el backend (los enlaces firmados
// "/api/files?…" son relativos al backend, no al frontend)
export function fileUrl(url, fallback = NO_IMAGE) {
  if (!url) return fallback
  if (/^(https?:|data:|blob:)/.test(url)) return url
  return API_ORIGIN + (url.startsWith('/') ? url : `/${url}`)
}

// Igual que fileUrl pero forzando la descarga con el nombre original
export function downloadUrl(url, nombre) {
  const base = fileUrl(url, '')
  if (!base) return ''
  return `${base}&dl=1&name=${encodeURIComponent(nombre || '')}`
}
