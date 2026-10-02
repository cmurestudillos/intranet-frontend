<template>
  <div>
    <PageHeader title="Project Manager" subtitle="Proyectos y tareas de project-manager-service">
      <button class="btn btn-secondary" :disabled="cargando" @click="cargar">
        <i class="fas fa-rotate" :class="{ 'fa-spin': cargando }"></i> Actualizar
      </button>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div class="stats">
      <StatCard label="Proyectos" :value="projects.length" icon="fas fa-diagram-project" />
      <StatCard label="Pendientes" :value="pendientes.length" icon="fas fa-clock" tone="warning" />
      <StatCard
        label="Vencidas"
        :value="vencidas"
        icon="fas fa-calendar-xmark"
        :tone="vencidas ? 'danger' : ''"
      />
      <StatCard
        label="Completadas"
        :value="tasks.length - pendientes.length"
        icon="fas fa-circle-check"
        tone="success"
      />
    </div>

    <AppPanel flush>
      <template #header>
        <div class="segmented" role="tablist">
          <button
            v-for="f in filtros"
            :key="f.value"
            type="button"
            :class="{ active: filtro === f.value }"
            @click="filtro = f.value"
          >
            {{ f.text }}<span class="count">{{ f.count }}</span>
          </button>
        </div>
      </template>
      <template #actions>
        <select v-model="proyecto" class="custom-select custom-select-sm" aria-label="Proyecto">
          <option value="">Todos los proyectos</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">
            {{ p.nombre }} ({{ p.pendientes }}/{{ p.total }})
          </option>
        </select>
      </template>

      <Loading :carga="cargando && !tasks.length" mensaje="Cargando tareas…" />
      <EmptyState
        v-if="!cargando && !error && !visibles.length"
        icon="fas fa-mug-hot"
        title="Sin tareas"
        :text="
          tasks.length ? 'Ninguna tarea coincide con el filtro.' : 'No hay tareas en tus proyectos.'
        "
      />
      <div v-if="visibles.length" class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-check"><span class="sr-only">Estado</span></th>
              <th>Tarea</th>
              <th>Proyecto</th>
              <th>Prioridad</th>
              <th>Entrega</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in visibles" :key="t.id" :class="{ hecha: t.estado }">
              <td class="col-check">
                <button
                  class="check"
                  :class="{ on: t.estado }"
                  :disabled="cambiando === t.id"
                  :title="t.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
                  :aria-label="t.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
                  @click="alternar(t)"
                >
                  <i v-if="t.estado" class="fas fa-check"></i>
                </button>
              </td>
              <td class="col-nombre">
                <span class="nombre">{{ t.nombre }}</span>
                <small v-if="t.descripcion" class="muted desc">{{ t.descripcion }}</small>
                <small v-if="t.estado && t.completadoPor" class="muted desc">
                  Completada por {{ t.completadoPor }}
                </small>
              </td>
              <td>
                <span v-if="t.proyecto" class="badge-soft tone-accent">{{
                  t.proyecto.nombre
                }}</span>
              </td>
              <td>
                <span class="badge-soft" :class="tonoPrioridad[t.prioridad]">{{
                  t.prioridad
                }}</span>
              </td>
              <td class="tabular" :class="{ vencida: esVencida(t) }">
                {{ t.fechaEntrega | moment('D MMM YYYY') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppPanel>
  </div>
</template>

<script>
import api from '@/api'
import Loading from '@/components/Loading.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { toast, errorMsg } from '@/utils/ui'

const ORDEN_PRIORIDAD = { Alta: 0, Media: 1, Baja: 2 }

export default {
  name: 'TareasExternas',
  components: { Loading, PageHeader, AppPanel, StatCard, EmptyState },
  data() {
    return {
      projects: [],
      tasks: [],
      cargando: false,
      error: '',
      filtro: 'pendientes',
      proyecto: '',
      cambiando: null,
      tonoPrioridad: { Alta: 'tone-danger', Media: 'tone-warning', Baja: 'tone-success' },
    }
  },
  computed: {
    pendientes() {
      return this.tasks.filter((t) => !t.estado)
    },
    vencidas() {
      return this.pendientes.filter(this.esVencida).length
    },
    delProyecto() {
      return this.proyecto
        ? this.tasks.filter((t) => t.proyecto && t.proyecto.id === this.proyecto)
        : this.tasks
    },
    filtros() {
      const pend = this.delProyecto.filter((t) => !t.estado).length
      return [
        { value: 'pendientes', text: 'Pendientes', count: pend },
        { value: 'completadas', text: 'Completadas', count: this.delProyecto.length - pend },
        { value: 'todas', text: 'Todas', count: this.delProyecto.length },
      ]
    },
    visibles() {
      const list = this.delProyecto.filter(
        (t) => this.filtro === 'todas' || (this.filtro === 'pendientes' ? !t.estado : t.estado)
      )
      return [...list].sort(
        (a, b) =>
          a.estado - b.estado ||
          ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] ||
          new Date(a.fechaEntrega) - new Date(b.fechaEntrega)
      )
    },
  },
  methods: {
    esVencida(t) {
      return (
        !t.estado && t.fechaEntrega && new Date(t.fechaEntrega) < new Date().setHours(0, 0, 0, 0)
      )
    },
    async cargar() {
      this.cargando = true
      this.error = ''
      try {
        const { data } = await api.get('/pm/tasks')
        this.projects = data.projects
        this.tasks = data.tasks
      } catch (error) {
        this.error = errorMsg(error, 'No se pudieron cargar las tareas de project-manager')
      } finally {
        this.cargando = false
      }
    },
    async alternar(t) {
      this.cambiando = t.id
      try {
        const { data } = await api.post(`/pm/tasks/${t.id}/toggle`)
        Object.assign(t, { estado: data.task.estado, completadoPor: data.task.completadoPor })
        const p = this.projects.find((x) => t.proyecto && x.id === t.proyecto.id)
        if (p) p.pendientes += t.estado ? -1 : 1
        toast.fire({ icon: 'success', title: t.estado ? 'Tarea completada' : 'Tarea reabierta' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo cambiar el estado') })
      } finally {
        this.cambiando = null
      }
    },
  },
  created() {
    this.cargar()
  },
}
</script>

<style scoped>
.col-check {
  width: 1%;
}
.col-nombre {
  min-width: 240px;
}
.nombre {
  font-weight: 500;
}
.desc {
  display: block;
  font-size: var(--fs-xs);
  margin-top: 2px;
}
.hecha .nombre {
  text-decoration: line-through;
  color: var(--text-3);
}
.vencida {
  color: var(--danger);
  font-weight: 500;
}
</style>
