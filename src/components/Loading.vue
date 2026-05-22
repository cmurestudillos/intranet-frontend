<template>
  <div v-if="carga" class="text-center mt-5">
    <h3>{{ mensaje }}</h3>
    <pulse-loader :loading="carga"></pulse-loader>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapState } from 'vuex'
// Spinner de carga
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

export default {
  props: {
    mensaje: {
      type: String,
    },
  },
  computed: {
    ...mapState(['carga']),
  },
  components: {
    PulseLoader,
  },
}
</script>
