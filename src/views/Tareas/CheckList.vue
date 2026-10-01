<template>
  <div>
    <PageHeader title="Tareas" subtitle="Gestiona tus tareas pendientes y completadas.">
      <SelectorProyecto
        v-if="usuario && usuario.isAdmin"
        :value="proyectoFiltro"
        texto-vacio="Todos los proyectos"
        size="sm"
        class="filtro-proyecto"
        @input="setProyectoFiltro"
      />
      <router-link
        :to="{ name: 'agregar', query: proyectoFiltro ? { proyecto: proyectoFiltro } : {} }"
        class="btn btn-primary"
      >
        <i class="fas fa-plus"></i> Nueva tarea
      </router-link>
    </PageHeader>

    <AppPanel flush>
      <template #header>
        <div class="segmented" role="tablist">
          <button
            role="tab"
            :aria-selected="vista === 'pendientes' ? 'true' : 'false'"
            :class="{ active: vista === 'pendientes' }"
            @click="vista = 'pendientes'"
          >
            Pendientes<span class="count">{{ filtrar(tareasPendientes).length }}</span>
          </button>
          <button
            role="tab"
            :aria-selected="vista === 'completadas' ? 'true' : 'false'"
            :class="{ active: vista === 'completadas' }"
            @click="vista = 'completadas'"
          >
            Completadas<span class="count">{{ filtrar(tareasCompletadas).length }}</span>
          </button>
        </div>
      </template>
      <template #actions>
        <div class="input-icon buscador">
          <i class="fas fa-magnifying-glass"></i>
          <input
            v-model="texto"
            type="search"
            class="form-control form-control-sm"
            placeholder="Buscar tareas…"
            aria-label="Buscar tareas"
          />
        </div>
      </template>

      <Loading :carga="cargando" mensaje="Cargando tareas…" />
      <template v-if="!cargando">
        <EmptyState
          v-if="!lista.length"
          :icon="vista === 'pendientes' ? 'fas fa-mug-hot' : 'far fa-circle-check'"
          :title="mensajeVacio"
          :text="texto || proyectoFiltro ? 'Prueba a cambiar la búsqueda o el filtro.' : ''"
        />
        <ListadoTareas v-else :tareas="lista" />
      </template>
    </AppPanel>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import ListadoTareas from './ListadoTareas.vue'
import Loading from '@/components/Loading.vue'
import SelectorProyecto from '@/components/SelectorProyecto.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

export default {
  name: 'CheckList',
  components: { ListadoTareas, Loading, SelectorProyecto, PageHeader, AppPanel, EmptyState },
  data() {
    return {
      vista: 'pendientes',
      texto: '',
      cargando: true,
    }
  },
  computed: {
    ...mapState(['usuario', 'tareasPendientes', 'tareasCompletadas', 'proyectoFiltro']),
    lista() {
      return this.filtrar(
        this.vista === 'pendientes' ? this.tareasPendientes : this.tareasCompletadas
      )
    },
    mensajeVacio() {
      if (this.texto || this.proyectoFiltro) return 'Ninguna tarea coincide'
      return this.vista === 'pendientes'
        ? 'No tienes tareas pendientes'
        : 'Aún no hay tareas completadas'
    },
  },
  methods: {
    ...mapMutations(['setProyectoFiltro']),
    filtrar(tareas) {
      const q = this.texto.trim().toLowerCase()
      return tareas.filter(
        (t) =>
          (!q || t.nombre.toLowerCase().includes(q)) &&
          (!this.proyectoFiltro || t.proyecto === this.proyectoFiltro)
      )
    },
  },
  async created() {
    await Promise.all([
      this.$store.dispatch('getTareasPendientes'),
      this.$store.dispatch('getTareasCompletadas'),
    ])
    this.cargando = false
  },
}
</script>

<style scoped>
.filtro-proyecto {
  width: 220px;
}
.buscador {
  width: 240px;
}
@media (max-width: 575px) {
  .buscador,
  .filtro-proyecto {
    width: 100%;
  }
}
</style>
