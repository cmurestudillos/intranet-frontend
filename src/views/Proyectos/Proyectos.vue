<template>
  <div class="proyectos">
    <div class="pr-header">
      <div>
        <h2 class="page-title">Proyectos</h2>
        <p class="pr-sub">
          <i class="fas fa-gem mr-1"></i>
          Vault de Obsidian · solo lectura
          <span v-if="ultimaSync"> · último cambio {{ ultimaSync | moment('from') }}</span>
        </p>
      </div>
      <div class="pr-search">
        <i class="fas fa-search"></i>
        <input
          v-model="q"
          type="search"
          placeholder="Buscar en todas las notas…"
          aria-label="Buscar en las notas"
        />
      </div>
    </div>

    <!-- Resultados de búsqueda -->
    <section v-if="q.trim().length >= 2" class="pr-results">
      <p class="pr-muted">
        <span v-if="buscando">Buscando…</span>
        <span v-else>{{ resultados.length }} resultado(s) para «{{ q.trim() }}»</span>
      </p>
      <router-link v-for="r in resultados" :key="r.path" class="pr-result" :to="rutaNota(r)">
        <div class="pr-result-title">
          {{ r.title }}
          <span class="pr-path">{{ r.path }}</span>
        </div>
        <p class="pr-snippet">{{ r.snippet }}</p>
      </router-link>
    </section>

    <template v-else>
      <!-- KPIs -->
      <div class="pr-kpis">
        <div class="pr-kpi">
          <strong>{{ proyectos.length }}</strong>
          <span>proyectos</span>
        </div>
        <div class="pr-kpi">
          <strong>{{ totalNotas }}</strong>
          <span>notas</span>
        </div>
        <div class="pr-kpi">
          <strong>{{ totalPendientes }}</strong>
          <span>pendientes en el vault</span>
        </div>
        <div class="pr-kpi">
          <strong>{{ totalTareas }}</strong>
          <span>tareas vinculadas abiertas</span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="pr-filters">
        <div class="pr-chips">
          <button
            v-for="e in estados"
            :key="e.value"
            type="button"
            class="pr-chip"
            :class="{ active: estado === e.value }"
            @click="estado = e.value"
          >
            {{ e.text }} <small>{{ e.count }}</small>
          </button>
        </div>
        <div class="pr-selects">
          <b-form-select v-model="area" :options="areas" size="sm" aria-label="Área" />
          <b-form-select v-model="orden" :options="ordenes" size="sm" aria-label="Orden" />
        </div>
      </div>

      <b-row>
        <b-col lg="9">
          <Loading :carga="cargando" :mensaje="'Cargando proyectos...'" />
          <Mensaje
            v-if="!cargando && !filtrados.length"
            :texto="
              proyectos.length
                ? 'Ningún proyecto coincide con los filtros.'
                : 'No hay proyectos. Ejecuta «pnpm sync:obsidian» en el backend.'
            "
            :tipo="'info'"
          />
          <div class="pr-grid">
            <router-link
              v-for="p in filtrados"
              :key="p.slug"
              :to="{ name: 'proyecto', params: { slug: p.slug } }"
              class="pr-card"
            >
              <div class="pr-card-head">
                <h3>{{ p.nombre }}</h3>
                <span class="pr-estado" :class="'estado-' + p.estadoTipo" :title="p.estado">
                  {{ etiquetaEstado(p) }}
                </span>
              </div>
              <p class="pr-area">{{ p.area || 'Sin área' }}</p>
              <p class="pr-resumen">{{ p.resumen || p.descripcion }}</p>
              <div class="pr-card-foot">
                <span title="Última actualización">
                  <i class="far fa-calendar"></i> {{ p.actualizacion || '—' }}
                </span>
                <span title="Notas"> <i class="far fa-file-alt"></i> {{ p.numNotas }} </span>
                <span title="Pendientes en el vault" :class="{ dim: !p.pendientes }">
                  <i class="far fa-square"></i> {{ p.pendientes }}
                </span>
                <span
                  v-if="p.tareas.total"
                  title="Tareas vinculadas abiertas / total"
                  class="pr-tareas"
                >
                  <i class="fas fa-check-square"></i> {{ p.tareas.pendientes }}/{{ p.tareas.total }}
                </span>
              </div>
            </router-link>
          </div>
        </b-col>

        <!-- Actividad reciente -->
        <b-col lg="3">
          <aside class="pr-activity">
            <h4><i class="fas fa-history mr-1"></i> Cambios recientes</h4>
            <p v-if="!actividad.length" class="pr-muted">Sin cambios registrados.</p>
            <ul>
              <li v-for="a in actividad" :key="a.id">
                <span class="pr-act-tipo" :class="'act-' + a.tipo">{{ a.tipo }}</span>
                <router-link v-if="a.path && a.tipo !== 'eliminada'" :to="rutaNota(a)">
                  {{ a.title || a.path }}
                </router-link>
                <span v-else>{{ a.title || a.path }}</span>
                <small>
                  {{ a.project ? a.project + ' · ' : '' }}{{ a.detalle ? a.detalle + ' · ' : ''
                  }}{{ a.fecha | moment('from') }}
                </small>
              </li>
            </ul>
          </aside>
        </b-col>
      </b-row>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import api from '@/api'
import Loading from '@/components/Loading.vue'
import Mensaje from '@/components/Mensaje.vue'

const ESTADOS = [
  { value: 'activo', text: 'Activo' },
  { value: 'progreso', text: 'En progreso' },
  { value: 'bloqueado', text: 'Bloqueado' },
  { value: 'archivado', text: 'Archivado' },
  { value: 'otro', text: 'Otro' },
]

export default {
  name: 'Proyectos',
  components: { Loading, Mensaje },
  data() {
    return {
      cargando: false,
      actividad: [],
      q: '',
      resultados: [],
      buscando: false,
      timer: null,
      estado: '',
      area: '',
      orden: 'actualizacion',
      ordenes: [
        { value: 'actualizacion', text: 'Actualización reciente' },
        { value: 'nombre', text: 'Nombre' },
        { value: 'pendientes', text: 'Más pendientes' },
      ],
    }
  },
  computed: {
    ...mapState(['proyectos', 'ultimaActividadNotas']),
    totalNotas() {
      return this.proyectos.reduce((n, p) => n + p.numNotas, 0)
    },
    totalPendientes() {
      return this.proyectos.reduce((n, p) => n + p.pendientes, 0)
    },
    totalTareas() {
      return this.proyectos.reduce((n, p) => n + p.tareas.pendientes, 0)
    },
    ultimaSync() {
      return this.actividad.length ? this.actividad[0].fecha : null
    },
    estados() {
      const counts = this.proyectos.reduce((acc, p) => {
        acc[p.estadoTipo] = (acc[p.estadoTipo] || 0) + 1
        return acc
      }, {})
      return [
        { value: '', text: 'Todos', count: this.proyectos.length },
        ...ESTADOS.filter((e) => counts[e.value]).map((e) => ({ ...e, count: counts[e.value] })),
      ]
    },
    areas() {
      const set = new Set(this.proyectos.map((p) => this.areaPrincipal(p)).filter(Boolean))
      return [{ value: '', text: 'Todas las áreas' }, ...[...set].sort()]
    },
    filtrados() {
      const list = this.proyectos.filter(
        (p) =>
          (!this.estado || p.estadoTipo === this.estado) &&
          (!this.area || this.areaPrincipal(p) === this.area)
      )
      const by = {
        nombre: (a, b) => a.nombre.localeCompare(b.nombre),
        actualizacion: (a, b) => (b.actualizacion || '').localeCompare(a.actualizacion || ''),
        pendientes: (a, b) => b.pendientes - a.pendientes,
      }
      return [...list].sort(by[this.orden])
    },
  },
  watch: {
    q(value) {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.buscar(value), 300)
    },
    ultimaActividadNotas() {
      this.cargarActividad()
    },
  },
  methods: {
    areaPrincipal(p) {
      return (p.area || '').split('/')[0].trim()
    },
    etiquetaEstado(p) {
      const e = ESTADOS.find((x) => x.value === p.estadoTipo)
      return p.estadoTipo === 'otro' ? p.estado || 'Sin estado' : e.text
    },
    rutaNota(item) {
      if (!item.project) return { name: 'proyectos' }
      return { name: 'proyecto', params: { slug: item.project }, query: { nota: item.path } }
    },
    async buscar(value) {
      const q = value.trim()
      if (q.length < 2) {
        this.resultados = []
        return
      }
      this.buscando = true
      try {
        const { data } = await api.get('/notes/search', { params: { q } })
        if (q === this.q.trim()) this.resultados = data.results
      } catch (error) {
        console.error('Error en búsqueda:', error.message)
      } finally {
        this.buscando = false
      }
    },
    async cargarActividad() {
      try {
        const { data } = await api.get('/notes/activity', { params: { limit: 15 } })
        this.actividad = data.activity
      } catch (error) {
        console.error('Error al obtener actividad:', error.message)
      }
    },
  },
  async created() {
    this.cargando = !this.proyectos.length
    await Promise.all([
      this.$store.dispatch('getProyectos', { force: true }),
      this.cargarActividad(),
    ])
    this.cargando = false
  },
  beforeDestroy() {
    clearTimeout(this.timer)
  },
}
</script>

<style scoped>
.pr-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.pr-header h1 {
  margin: 0;
}
.pr-sub,
.pr-muted {
  color: var(--text-3);
  font-size: var(--fs-sm);
  margin: 4px 0 0;
}

.pr-search {
  position: relative;
  flex: 0 1 380px;
}
.pr-search i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  font-size: var(--fs-sm);
}
.pr-search input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: var(--fs-sm);
  outline: none;
  transition: border-color var(--transition);
}
.pr-search input:focus {
  border-color: var(--accent);
}

.pr-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.pr-kpi {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
}
.pr-kpi strong {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.pr-kpi span {
  font-size: var(--fs-xs);
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.pr-filters {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.pr-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pr-chip {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: var(--fs-xs);
  transition: all var(--transition);
}
.pr-chip small {
  color: var(--text-3);
  margin-left: 4px;
}
.pr-chip:hover,
.pr-chip.active {
  background: var(--accent-soft);
  border-color: var(--accent-border);
  color: var(--text);
}
.pr-selects {
  display: flex;
  gap: 8px;
}
.pr-selects select {
  min-width: 170px;
}

.pr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.pr-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  color: var(--text);
  text-decoration: none !important;
  transition:
    border-color var(--transition),
    transform var(--transition);
}
.pr-card:hover {
  border-color: var(--accent-border);
  transform: translateY(-2px);
}
.pr-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.pr-card-head h3 {
  font-size: var(--fs-md);
  font-weight: 600;
  margin: 0;
  color: var(--text);
}
.pr-estado {
  flex-shrink: 0;
  font-size: var(--fs-xs);
  padding: 2px 8px;
  border-radius: 999px;
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.estado-activo {
  background: var(--success-bg);
  color: var(--success);
}
.estado-progreso {
  background: var(--warning-bg);
  color: var(--warning);
}
.estado-bloqueado {
  background: var(--danger-bg);
  color: var(--danger);
}
.estado-archivado,
.estado-otro {
  background: var(--bg-hover);
  color: var(--text-2);
}
.pr-area {
  font-size: var(--fs-xs);
  color: var(--accent);
  margin: 4px 0 8px;
}
.pr-resumen {
  font-size: var(--fs-sm);
  color: var(--text-2);
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}
.pr-card-foot {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: var(--fs-xs);
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
.pr-card-foot .dim {
  opacity: 0.5;
}
.pr-tareas {
  color: var(--accent);
}

.pr-activity {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}
.pr-activity h4 {
  font-size: var(--fs-sm);
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text);
}
.pr-activity ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.pr-activity li {
  padding: 8px 0;
  border-top: 1px solid var(--border);
  font-size: var(--fs-sm);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pr-activity li:first-child {
  border-top: 0;
}
.pr-activity li small {
  color: var(--text-3);
  font-size: var(--fs-xs);
}
.pr-act-tipo {
  font-size: var(--fs-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-3);
}
.act-creada {
  color: var(--success);
}
.act-modificada {
  color: var(--accent);
}
.act-eliminada {
  color: var(--danger);
}

.pr-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pr-result {
  display: block;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  text-decoration: none !important;
  transition: border-color var(--transition);
}
.pr-result:hover {
  border-color: var(--accent-border);
}
.pr-result-title {
  color: var(--text);
  font-weight: 600;
  font-size: var(--fs-base);
}
.pr-path {
  color: var(--text-3);
  font-weight: 400;
  font-size: var(--fs-xs);
  margin-left: 8px;
  font-family: var(--font-mono);
}
.pr-snippet {
  color: var(--text-2);
  font-size: var(--fs-sm);
  margin: 4px 0 0;
}
</style>
