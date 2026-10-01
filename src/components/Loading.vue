<template>
  <div v-if="visible" class="loading-block" role="status">
    <span class="spinner"></span>
    <span>{{ mensaje }}</span>
  </div>
</template>

<script>
// Indicador de carga. Sin la prop `carga` usa el estado global del store.
export default {
  name: 'Loading',
  props: {
    carga: { type: Boolean, default: undefined },
    mensaje: { type: String, default: 'Cargando…' },
  },
  computed: {
    visible() {
      return this.carga === undefined ? this.$store.state.carga : this.carga
    },
  },
}
</script>
