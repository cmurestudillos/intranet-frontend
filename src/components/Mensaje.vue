<template>
  <div class="alert-inline" :class="tone ? 'tone-' + tone : ''" role="status">
    <i :class="icono" aria-hidden="true"></i>
    <span>{{ texto }}</span>
  </div>
</template>

<script>
const TIPOS = {
  info: { tone: '', icono: 'fas fa-circle-info' },
  success: { tone: 'success', icono: 'fas fa-circle-check' },
  warning: { tone: 'warning', icono: 'fas fa-triangle-exclamation' },
  error: { tone: 'danger', icono: 'fas fa-circle-exclamation' },
  danger: { tone: 'danger', icono: 'fas fa-circle-exclamation' },
}

export default {
  name: 'Mensaje',
  props: {
    texto: { type: String, required: true },
    tipo: { type: String, default: 'info' },
  },
  computed: {
    tone() {
      return (TIPOS[this.tipo] || TIPOS.info).tone
    },
    icono() {
      return (TIPOS[this.tipo] || TIPOS.info).icono
    },
  },
}
</script>
