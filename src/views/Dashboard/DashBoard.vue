<template>
  <div>
    <h3>
      Bienvenido <u>{{ usuario.nombre }}</u>
    </h3>
    <hr />
    <v-layout>
      <v-flex xs10 class="mx-auto">
        <v-card class="text-xs-center">
          <h2>Informe CheckList - {{ year }}</h2>
          <hr />
          <!-- Componente de Carga -->
          <Loading :carga="carga" :mensaje="'Cargando contenido...'" />
          <!-- Grafico de Tareas -->
          <Linea
            v-if="!carga"
            :graficoPendientes="graficoPendientes"
            :graficoCompletadas="graficoCompletadas"
          />
        </v-card>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
// Propieades de Vuex
import { mapState, mapActions } from 'vuex'
// Componentes
import Linea from './Linea.vue'
import Loading from '../../components/Loading.vue'

export default {
  data() {
    return {
      year: new Date().getFullYear(),
    }
  },
  components: {
    Linea,
    Loading,
  },
  computed: {
    ...mapState(['usuario', 'carga', 'graficoPendientes', 'graficoCompletadas']),
  },
  methods: {
    ...mapActions(['graficaTareasPendientes', 'graficaTareasCompletadas']),
  },
  created() {
    this.graficaTareasPendientes()
    this.graficaTareasCompletadas()
  },
}
</script>
