<template>
  <div>
    <b-row>
      <b-col cols="3">
        <h1>Lista de Tareas</h1>
      </b-col>
      <b-col cols="9">
        <router-link :to="{ name: 'agregar' }">
          <b-button variant="primary" alt="Agregar" title="Agregar">
            <i class="fas fa-plus"></i>
          </b-button>
        </router-link>
      </b-col>
    </b-row>
    <hr />

    <b-tabs card fill class="border">
      <b-tab title="Pendientes" @click="getTareasPendientes()">
        <!-- Componente de busqueda -->
        <Buscador />
        <!-- Componente de Mensajes -->
        <Mensaje
          v-if="tareasPendientes.length === 0 && !carga"
          :texto="'No hay tareas pendientes.'"
          :tipo="'info'"
        />
        <!-- Componente de Carga -->
        <Loading :carga="carga" :mensaje="'Cargando contenido...'" />
        <!-- Componente de Tarea -->
        <ListadoTareas v-if="!carga" :tareas="arrayFiltradoPendientes" />
      </b-tab>
      <b-tab title="Completadas" @click="getTareasCompletadas()">
        <!-- Componente de busqueda -->
        <Buscador />
        <!-- Componente de Mensajes -->
        <Mensaje
          v-if="tareasCompletadas.length === 0 && !carga"
          :texto="'No hay tareas completadas.'"
          :tipo="'info'"
        />
        <!-- Componente de Carga -->
        <Loading :carga="carga" :mensaje="'Cargando contenido...'" />
        <!-- Componente de Tarea -->
        <ListadoTareas v-if="!carga" :tareas="arrayFiltradoCompletadas" />
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapState, mapActions, mapGetters } from 'vuex'
// Componentes
import Loading from '../../components/Loading.vue'
import Mensaje from '../../components/Mensaje.vue'
import ListadoTareas from './ListadoTareas.vue'
import Buscador from '../../components/Buscador.vue'

export default {
  data() {
    return {
      texto: '',
    }
  },
  computed: {
    ...mapState(['usuario', 'tareasPendientes', 'tareasCompletadas', 'carga']),
    ...mapGetters(['arrayFiltradoPendientes', 'arrayFiltradoCompletadas']),
  },
  methods: {
    ...mapActions(['getTareasPendientes', 'getTareasCompletadas', 'agregarTarea']),
  },
  created() {
    this.getTareasPendientes()
    this.getTareasCompletadas()
  },
  components: {
    Loading,
    Mensaje,
    ListadoTareas,
    Buscador,
  },
}
</script>
