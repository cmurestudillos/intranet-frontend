<template>
  <div>
    <PageHeader title="Editar tarea" />
    <Loading :carga="cargando" mensaje="Cargando tarea…" />
    <TareaForm
      v-if="!cargando && tarea.id"
      titulo="Datos de la tarea"
      :inicial="inicial"
      :guardando="guardando"
      @submit="guardar"
    />
    <EmptyState
      v-else-if="!cargando"
      icon="far fa-circle-question"
      title="Tarea no encontrada"
      text="Puede que se haya eliminado."
    >
      <router-link :to="{ name: 'checklist' }" class="btn btn-secondary"
        >Volver a tareas</router-link
      >
    </EmptyState>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Loading from '@/components/Loading.vue'
import TareaForm from './TareaForm.vue'

export default {
  name: 'Editar',
  components: { PageHeader, EmptyState, Loading, TareaForm },
  data() {
    return { cargando: true, guardando: false }
  },
  computed: {
    ...mapState(['tarea']),
    inicial() {
      const { nombre, horas, prioridad, proyecto } = this.tarea
      return { nombre, horas, prioridad, proyecto: proyecto || '' }
    },
  },
  methods: {
    async guardar(datos) {
      this.guardando = true
      await this.$store.dispatch('editarTarea', { ...datos, id: this.tarea.id })
      this.guardando = false
    },
  },
  async created() {
    this.$store.commit('setTarea', { nombre: '', horas: 0, prioridad: '', id: '', uid: '' })
    await this.$store.dispatch('getTarea', this.$route.params.id)
    this.cargando = false
  },
}
</script>
