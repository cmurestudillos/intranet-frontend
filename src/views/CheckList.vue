<template>
  <div>
    <b-row>
      <b-col cols="3">
        <h1>Lista de Tareas</h1>
      </b-col>
      <b-col cols="9">
        <router-link :to="{ name: 'agregar' }">
          <b-button pill lg="4" variant="primary">
            <v-icon center class="fas fa-plus text-white"></v-icon>
          </b-button>
        </router-link>
      </b-col>
    </b-row>
    <hr />

    <div v-if="carga" class="text-center mt-5">
      <h3>Cargando contenido...</h3>
      <pulse-loader :loading="carga"></pulse-loader>
    </div>

    <ul class="list-group mt-5" v-if="!carga">
      <li class="list-group-item" v-for="item of tareas" :key="item.id">
        <span :class="{ tachado: item.estado }" class="fonts">
          <strong>{{ item.nombre }}</strong>
        </span>
        <div class="float-right">
          <b-button
            @click="cambiarEstado(item)"
            class="btn btn-success btn-sm mr-2"
            v-if="item.estado"
          >
            <v-icon center class="fas fa-check text-white"></v-icon>
          </b-button>
          <b-button @click="cambiarEstado(item)" class="btn btn-info btn-sm mr-2" v-else>
            <v-icon center class="fas fa-clock text-white"></v-icon>
          </b-button>
          <router-link
            class="btn btn-warning btn-sm mr-2"
            :to="{ name: 'editar', params: { id: item.id } }"
          >
            <v-icon center class="fas fa-pen text-white"></v-icon>
          </router-link>
          <b-button @click="eliminarTarea(item.id)" class="btn btn-danger btn-sm">
            <v-icon center class="fas fa-trash text-white"></v-icon>
          </b-button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

export default {
  data() {
    return {
      nombre: '',
    }
  },
  computed: {
    ...mapState(['usuario', 'tareas', 'carga']),
  },
  methods: {
    ...mapActions(['getTareas', 'eliminarTarea', 'agregarTarea', 'cambiarEstado']),
  },
  created() {
    this.getTareas()
  },
  components: {
    PulseLoader,
  },
}
</script>
