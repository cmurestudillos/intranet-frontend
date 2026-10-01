<template>
  <b-form-select
    v-if="esAdmin"
    :value="value"
    :options="opciones"
    :size="size"
    aria-label="Proyecto"
    @change="$emit('input', $event)"
  />
</template>

<script>
import { mapState } from 'vuex'

// Selector de proyecto del vault de Obsidian. Solo se muestra al administrador.
export default {
  name: 'SelectorProyecto',
  props: {
    value: { type: String, default: '' },
    textoVacio: { type: String, default: 'Sin proyecto' },
    size: { type: String, default: 'md' },
  },
  computed: {
    ...mapState(['usuario', 'proyectos']),
    esAdmin() {
      return !!(this.usuario && this.usuario.isAdmin)
    },
    opciones() {
      const lista = [...this.proyectos]
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
        .map((p) => ({ value: p.slug, text: p.nombre }))
      // Proyecto asignado que ya no existe en el vault: se conserva visible
      if (this.value && !lista.some((o) => o.value === this.value)) {
        lista.unshift({ value: this.value, text: `${this.value} (no está en el vault)` })
      }
      return [{ value: '', text: this.textoVacio }, ...lista]
    },
  },
  created() {
    if (this.esAdmin) this.$store.dispatch('getProyectos')
  },
}
</script>
