<template>
  <div>
    <label><strong>Filtro:</strong></label>
    <select v-model="selected" @click="filtro(selected)" class="form-control mb-2">
      <option value="">Seleccione una opcion</option>
      <option>Imagenes</option>
      <option>Documentos</option>
    </select>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      selected: '',
    }
  },
  methods: {
    ...mapActions(['filtro']),
  },
}
</script>
