<template>
  <AppPanel title="Trabajo" flush>
    <ul class="fuentes">
      <li v-for="f in fuentes" :key="f.to">
        <span class="stat-icon" :class="f.tone ? 'tone-' + f.tone : ''"
          ><i :class="f.icon"></i
        ></span>
        <div class="texto">
          <span class="titulo">{{ f.titulo }}</span>
          <span class="muted" :class="{ error: f.error }">{{
            f.error || f.detalle || 'Cargando…'
          }}</span>
        </div>
        <router-link :to="{ name: f.to }" class="btn btn-ghost btn-sm">Abrir</router-link>
      </li>
    </ul>
  </AppPanel>
</template>

<script>
import moment from 'moment'
import api from '@/api'
import AppPanel from '@/components/ui/AppPanel.vue'
import { errorMsg, formatMinutos } from '@/utils/ui'

// Resumen de las fuentes externas (solo admin). Cada una carga por separado
// para que un servicio caído no bloquee a los demás.
export default {
  name: 'ResumenTrabajo',
  components: { AppPanel },
  data() {
    return {
      pm: { titulo: 'Project Manager', icon: 'fas fa-diagram-project', to: 'pm-tareas' },
      todoist: { titulo: 'Todoist', icon: 'fas fa-square-check', to: 'todoist' },
      horas: {
        titulo: 'Horas esta semana',
        icon: 'fas fa-business-time',
        to: 'horas',
        tone: 'navy',
      },
      cron: { titulo: 'Cron', icon: 'fas fa-clock-rotate-left', to: 'cron' },
    }
  },
  computed: {
    fuentes() {
      return [this.pm, this.todoist, this.horas, this.cron]
    },
  },
  methods: {
    async cargar(fuente, fn) {
      try {
        Object.assign(fuente, await fn())
      } catch (error) {
        this.$set(fuente, 'error', errorMsg(error, 'No disponible'))
        this.$set(fuente, 'tone', 'danger')
      }
    },
  },
  created() {
    this.cargar(this.pm, async () => {
      const { data } = await api.get('/pm/tasks')
      const pendientes = data.tasks.filter((t) => !t.estado)
      const hoy = new Date().setHours(0, 0, 0, 0)
      const vencidas = pendientes.filter(
        (t) => t.fechaEntrega && new Date(t.fechaEntrega) < hoy
      ).length
      return {
        detalle: `${pendientes.length} pendientes${vencidas ? ` · ${vencidas} vencidas` : ''} en ${data.projects.length} proyectos`,
        tone: vencidas ? 'danger' : pendientes.length ? 'warning' : 'success',
      }
    })
    this.cargar(this.todoist, async () => {
      const { data } = await api.get('/todoist')
      const pendientes = data.tasks.filter((t) => !t.estado).length
      return {
        detalle: `${pendientes} pendientes en ${data.lists.length} listas`,
        tone: pendientes ? 'warning' : 'success',
      }
    })
    this.cargar(this.horas, async () => {
      const desde = moment().startOf('isoWeek')
      const { data } = await api.get('/hours/entries', {
        params: {
          desde: desde.format('YYYY-MM-DD'),
          hasta: desde.clone().add(6, 'days').format('YYYY-MM-DD'),
        },
      })
      const total = data.entries.reduce((n, e) => n + e.minutos, 0)
      return { detalle: `${formatMinutos(total)} en ${data.entries.length} registros` }
    })
    this.cargar(this.cron, async () => {
      const { data } = await api.get('/cron/status')
      if (!data.ultima) return { detalle: 'Sin ejecuciones todavía' }
      const { total, fallos, inicio } = data.ultima
      return {
        detalle: `${total - fallos}/${total} OK · ${moment(inicio).fromNow()}`,
        tone: fallos ? 'danger' : 'success',
      }
    })
  },
}
</script>

<style scoped>
.fuentes {
  list-style: none;
  margin: 0;
  padding: 0;
}
.fuentes li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 12px var(--sp-5);
  border-bottom: 1px solid var(--border);
}
.fuentes li:last-child {
  border-bottom: 0;
}
.texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: var(--fs-sm);
}
.titulo {
  font-weight: 500;
}
.error {
  color: var(--danger);
}
</style>
