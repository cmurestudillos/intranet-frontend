import Swal from 'sweetalert2'

export const toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
})

// Diálogo de confirmación para acciones destructivas. Devuelve true si se confirma.
export async function confirmar(title, text = 'Esta acción no se puede deshacer.') {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    customClass: { confirmButton: 'btn-confirm-danger' },
  })
  return result.isConfirmed
}

// Mensaje legible de un error de axios
export function errorMsg(error, fallback = 'Ha ocurrido un error') {
  return error?.response?.data?.message || fallback
}

// Minutos → "7 h 30 min"
export function formatMinutos(min) {
  const m = Math.round(Number(min) || 0)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (!h) return `${r} min`
  return r ? `${h} h ${r} min` : `${h} h`
}
