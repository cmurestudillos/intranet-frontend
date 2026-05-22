<template>
  <b-row>
    <b-col>
      <form @submit.prevent="buscador(texto)">
        <label><strong>Buscador:</strong></label>
        <input
          type="text"
          placeholder="Introduzca el elemento a buscar ..."
          class="form-control mb-2"
          v-model="texto"
          v-on:keyup="buscador(texto)"
        />
      </form>
    </b-col>
  </b-row>
</template>

<script>
// Propiedades de Vuex
import { mapActions } from 'vuex'

export default {
  data() {
    return {
      texto: '',
    }
  },
  methods: {
    ...mapActions(['buscador']),
  },
}
</script>
