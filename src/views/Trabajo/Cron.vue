<template>
  <div>
    <PageHeader
      title="Cron"
      subtitle="Peticiones a los servicios desplegados para mantenerlos activos · solo ejecución manual"
    >
      <button class="btn btn-primary" :disabled="ejecutando" @click="ejecutar()">
        <i class="fas" :class="ejecutando && !ejecutandoId ? 'fa-spinner fa-spin' : 'fa-play'"></i>
        {{ ejecutando && !ejecutandoId ? 'Ejecutando…' : 'Ejecutar ahora' }}
      </button>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div v-if="status" class="stats">
      <StatCard label="Modo" value="Solo manual" icon="fas fa-hand-pointer" tone="navy" />
      <StatCard
        label="Última ejecución"
        :value="status.ultima ? desde(status.ultima.inicio) : 'Nunca'"
        icon="fas fa-clock-rotate-left"
      />
      <StatCard
        label="Resultado último"
        :value="
          status.ultima
            ? `${status.ultima.total - status.ultima.fallos}/${status.ultima.total} OK`
            : '—'
        "
        icon="fas fa-heart-pulse"
        :tone="status.ultima ? (status.ultima.fallos ? 'danger' : 'success') : ''"
      />
      <StatCard
        label="Endpoints activos"
        :value="`${status.endpoints.activos}/${status.endpoints.total}`"
        icon="fas fa-plug"
      />
    </div>

    <AppPanel title="Endpoints" :count="endpoints.length" flush>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Nombre</th>
              <th>URL</th>
              <th>Auth</th>
              <th>Último resultado</th>
              <th class="col-actions"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ep in endpoints" :key="ep.id" :class="{ inactivo: !ep.activo }">
              <td>
                <b-form-checkbox
                  :checked="ep.activo"
                  switch
                  :aria-label="ep.activo ? 'Desactivar' : 'Activar'"
                  @change="actualizar(ep, { activo: $event })"
                />
              </td>
              <td class="nombre">{{ ep.nombre }}</td>
              <td class="mono url truncate" :title="ep.url">
                <span class="metodo">{{ ep.metodo }}</span> {{ ep.url }}
              </td>
              <td>
                <span v-if="ep.auth !== 'none'" class="badge-soft tone-accent">
                  <i class="fas fa-key"></i> {{ ep.auth }}
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td>
                <template v-if="ultimoResultado[ep.id]">
                  <span
                    class="badge-soft"
                    :class="ultimoResultado[ep.id].ok ? 'tone-success' : 'tone-danger'"
                    :title="ultimoResultado[ep.id].error || ''"
                  >
                    {{ ultimoResultado[ep.id].statusCode || 'ERR' }}
                  </span>
                  <small class="muted tabular"> {{ ultimoResultado[ep.id].ms }} ms</small>
                </template>
                <span v-else class="muted">—</span>
              </td>
              <td class="col-actions">
                <button
                  class="btn btn-ghost btn-icon"
                  title="Ejecutar solo este"
                  aria-label="Ejecutar solo este"
                  :disabled="ejecutando"
                  @click="ejecutar(ep.id)"
                >
                  <i
                    class="fas"
                    :class="ejecutandoId === ep.id ? 'fa-spinner fa-spin' : 'fa-play'"
                  ></i>
                </button>
                <button
                  class="btn btn-ghost btn-icon danger"
                  title="Eliminar"
                  aria-label="Eliminar"
                  @click="eliminar(ep)"
                >
                  <i class="far fa-trash-can"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #footer>
        <form class="nuevo" novalidate @submit.prevent="crear">
          <input
            v-model.trim="nuevo.nombre"
            class="form-control form-control-sm"
            placeholder="Nombre"
            aria-label="Nombre"
          />
          <select v-model="nuevo.metodo" class="custom-select custom-select-sm" aria-label="Método">
            <option>GET</option>
            <option>POST</option>
            <option>HEAD</option>
          </select>
          <input
            v-model.trim="nuevo.url"
            class="form-control form-control-sm url-input"
            placeholder="https://mi-servicio.vercel.app/api/health"
            aria-label="URL"
          />
          <select
            v-model="nuevo.auth"
            class="custom-select custom-select-sm"
            aria-label="Autenticación"
          >
            <option value="none">Sin auth</option>
            <option value="project-manager">project-manager</option>
            <option value="control-horas">control-horas</option>
          </select>
          <button
            type="submit"
            class="btn btn-secondary btn-sm"
            :disabled="!nuevo.nombre || !nuevo.url"
          >
            <i class="fas fa-plus"></i> Añadir
          </button>
        </form>
      </template>
    </AppPanel>

    <AppPanel title="Historial" :count="runs.length" flush class="historial">
      <EmptyState
        v-if="!runs.length"
        icon="fas fa-clock"
        title="Sin ejecuciones"
        text="Todavía no se ha ejecutado el cron."
      />
      <ul v-else class="runs">
        <li v-for="run in runs" :key="run.id">
          <button
            type="button"
            class="run-head"
            @click="abierto = abierto === run.id ? null : run.id"
          >
            <i
              class="fas fa-fw"
              :class="abierto === run.id ? 'fa-chevron-down' : 'fa-chevron-right'"
            ></i>
            <span class="badge-soft" :class="run.fallos ? 'tone-danger' : 'tone-success'">
              {{ run.total - run.fallos }}/{{ run.total }} OK
            </span>
            <span>{{ run.inicio | moment('ddd D MMM YYYY, HH:mm') }}</span>
            <span class="muted">
              {{
                run.origen === 'manual'
                  ? 'Manual' + (run.usuario ? ' · ' + run.usuario : '')
                  : 'Programada'
              }}
            </span>
            <span class="muted tabular ml-auto">{{ (run.duracionMs / 1000).toFixed(1) }} s</span>
          </button>
          <table v-if="abierto === run.id" class="data-table detalle">
            <tbody>
              <tr v-for="(r, i) in run.resultados" :key="i">
                <td>
                  <span class="badge-soft" :class="r.ok ? 'tone-success' : 'tone-danger'">
                    {{ r.statusCode || 'ERR' }}
                  </span>
                </td>
                <td class="nombre">{{ r.nombre }}</td>
                <td class="mono url truncate" :title="r.url">{{ r.metodo }} {{ r.url }}</td>
                <td class="num">{{ r.ms }} ms</td>
                <td class="error">{{ r.error }}</td>
              </tr>
            </tbody>
          </table>
        </li>
      </ul>
    </AppPanel>
  </div>
</template>

<script>
import moment from 'moment'
import api from '@/api'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { toast, confirmar, errorMsg } from '@/utils/ui'

const NUEVO = () => ({ nombre: '', url: '', metodo: 'GET', auth: 'none' })

export default {
  name: 'Cron',
  components: { PageHeader, AppPanel, StatCard, EmptyState },
  data() {
    return {
      status: null,
      endpoints: [],
      runs: [],
      error: '',
      ejecutando: false,
      ejecutandoId: null,
      abierto: null,
      nuevo: NUEVO(),
    }
  },
  computed: {
    // Resultado más reciente de cada endpoint en el historial cargado
    ultimoResultado() {
      const map = {}
      for (const run of this.runs) {
        for (const r of run.resultados) {
          if (r.endpoint && !map[r.endpoint]) map[r.endpoint] = r
        }
      }
      return map
    },
  },
  methods: {
    desde(d) {
      return moment(d).fromNow()
    },
    async cargar() {
      this.error = ''
      try {
        const [s, e, r] = await Promise.all([
          api.get('/cron/status'),
          api.get('/cron/endpoints'),
          api.get('/cron/runs', { params: { limit: 20 } }),
        ])
        this.status = s.data
        this.endpoints = e.data.endpoints
        this.runs = r.data.runs
      } catch (error) {
        this.error = errorMsg(error, 'No se pudo cargar el estado del cron')
      }
    },
    async ejecutar(endpointId = null) {
      this.ejecutando = true
      this.ejecutandoId = endpointId
      try {
        const { data } = await api.post('/cron/run', endpointId ? { endpointId } : {}, {
          timeout: 120000,
        })
        const { total, fallos } = data.run
        toast.fire({
          icon: fallos ? 'warning' : 'success',
          title: fallos ? `${fallos} de ${total} endpoints con error` : `${total} endpoints OK`,
        })
        this.abierto = data.run.id
        await this.cargar()
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'Error al ejecutar el cron') })
      } finally {
        this.ejecutando = false
        this.ejecutandoId = null
      }
    },
    async actualizar(ep, cambios) {
      try {
        const { data } = await api.put(`/cron/endpoints/${ep.id}`, cambios)
        Object.assign(ep, data.endpoint)
        this.status.endpoints.activos = this.endpoints.filter((x) => x.activo).length
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo actualizar') })
      }
    },
    async crear() {
      try {
        const { data } = await api.post('/cron/endpoints', this.nuevo)
        this.endpoints.push(data.endpoint)
        this.nuevo = NUEVO()
        this.status.endpoints.total++
        if (data.endpoint.activo) this.status.endpoints.activos++
        toast.fire({ icon: 'success', title: 'Endpoint añadido' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo añadir') })
      }
    },
    async eliminar(ep) {
      if (!(await confirmar(`¿Eliminar «${ep.nombre}» del cron?`))) return
      try {
        await api.delete(`/cron/endpoints/${ep.id}`)
        this.endpoints = this.endpoints.filter((x) => x.id !== ep.id)
        this.status.endpoints.total--
        if (ep.activo) this.status.endpoints.activos--
        toast.fire({ icon: 'success', title: 'Endpoint eliminado' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar') })
      }
    },
  },
  created() {
    this.cargar()
  },
}
</script>

<style scoped>
.nombre {
  font-weight: 500;
  white-space: nowrap;
}
.url {
  max-width: 360px;
  font-size: var(--fs-xs);
  color: var(--text-2);
}
.metodo {
  color: var(--accent);
  font-weight: 600;
}
.inactivo td {
  opacity: 0.55;
}
.nuevo {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.nuevo > * {
  width: auto;
}
.nuevo .url-input {
  flex: 1;
  min-width: 220px;
}
.historial {
  margin-top: var(--sp-6);
}
.runs {
  list-style: none;
  margin: 0;
  padding: 0;
}
.runs > li {
  border-bottom: 1px solid var(--border);
}
.runs > li:last-child {
  border-bottom: 0;
}
.run-head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 10px var(--sp-4);
  background: none;
  border: 0;
  text-align: left;
  font-size: var(--fs-sm);
  color: var(--text);
}
.run-head:hover {
  background: var(--bg-subtle);
}
.run-head .fa-fw {
  color: var(--text-3);
  font-size: 11px;
}
.detalle {
  background: var(--bg-subtle);
}
.detalle .error {
  color: var(--danger);
  font-size: var(--fs-xs);
}
</style>
