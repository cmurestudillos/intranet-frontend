<template>
  <div>
    <PageHeader :title="`Hola, ${primerNombre}`" :subtitle="`Resumen de tu actividad · ${hoy}`">
      <router-link :to="{ name: 'agregar' }" class="btn btn-primary">
        <i class="fas fa-plus"></i> Nueva tarea
      </router-link>
    </PageHeader>

    <div class="stats">
      <StatCard
        label="Tareas pendientes"
        :value="tareasPendientes.length"
        icon="fas fa-clock"
        tone="warning"
      />
      <StatCard
        label="Completadas"
        :value="tareasCompletadas.length"
        icon="fas fa-circle-check"
        tone="success"
      />
      <StatCard
        label="Horas pendientes"
        :value="horasPendientes"
        icon="fas fa-hourglass-half"
        tone="navy"
      />
      <StatCard label="Tasa de finalización" :value="`${porcentaje}%`" icon="fas fa-chart-line" />
    </div>

    <div class="grid-main-side">
      <AppPanel :title="`Tareas por mes · ${year}`">
        <Loading :carga="cargando" mensaje="Cargando datos…" />
        <Linea
          v-if="!cargando"
          :grafico-pendientes="graficoPendientes"
          :grafico-completadas="graficoCompletadas"
        />
      </AppPanel>

      <AppPanel title="Pendientes prioritarias" flush>
        <template #actions>
          <router-link :to="{ name: 'checklist' }" class="btn btn-ghost btn-sm"
            >Ver todas</router-link
          >
        </template>
        <EmptyState
          v-if="!cargando && !proximas.length"
          icon="fas fa-mug-hot"
          title="Nada pendiente"
          text="No tienes tareas pendientes."
        />
        <ul v-else class="proximas">
          <li v-for="t in proximas" :key="t.id">
            <span
              class="prio-dot"
              :class="'prio-' + t.prioridad"
              :title="'Prioridad ' + t.prioridad"
            ></span>
            <span class="truncate">{{ t.nombre }}</span>
            <span class="muted tabular">{{ t.horas }} h</span>
          </li>
        </ul>
      </AppPanel>
    </div>

    <ResumenTrabajo v-if="usuario && usuario.isAdmin" class="resumen-trabajo" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import moment from 'moment'
import Linea from './Linea.vue'
import ResumenTrabajo from './ResumenTrabajo.vue'
import Loading from '@/components/Loading.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const ORDEN_PRIORIDAD = { alta: 0, media: 1, relax: 2 }

export default {
  name: 'DashBoard',
  components: { Linea, ResumenTrabajo, Loading, PageHeader, AppPanel, StatCard, EmptyState },
  data() {
    return {
      year: new Date().getFullYear(),
      hoy: moment().format('dddd, D [de] MMMM'),
      cargando: true,
    }
  },
  computed: {
    ...mapState([
      'usuario',
      'graficoPendientes',
      'graficoCompletadas',
      'tareasPendientes',
      'tareasCompletadas',
    ]),
    primerNombre() {
      return (this.usuario.nombre || '').split(' ')[0]
    },
    horasPendientes() {
      return this.tareasPendientes.reduce((n, t) => n + (Number(t.horas) || 0), 0)
    },
    porcentaje() {
      const total = this.tareasPendientes.length + this.tareasCompletadas.length
      return total ? Math.round((this.tareasCompletadas.length / total) * 100) : 0
    },
    proximas() {
      return [...this.tareasPendientes]
        .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad])
        .slice(0, 6)
    },
  },
  async created() {
    await Promise.all([
      this.$store.dispatch('graficaTareasPendientes'),
      this.$store.dispatch('graficaTareasCompletadas'),
    ])
    this.cargando = false
  },
}
</script>

<style scoped>
.resumen-trabajo {
  margin-top: var(--sp-6);
}
.proximas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.proximas li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px var(--sp-5);
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-sm);
}
.proximas li:last-child {
  border-bottom: 0;
}
.proximas .truncate {
  flex: 1;
  min-width: 0;
}
.prio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.prio-alta {
  background: var(--danger);
}
.prio-media {
  background: #d97706;
}
.prio-relax {
  background: var(--success);
}
</style>
