<template>
  <div>
    <PageHeader title="Horas" subtitle="Registro de control-de-horas-service">
      <div class="segmented">
        <button
          type="button"
          title="Semana anterior"
          aria-label="Semana anterior"
          @click="mover(-1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button type="button" :class="{ active: esSemanaActual }" @click="semana = inicioSemana()">
          {{ etiquetaSemana }}
        </button>
        <button
          type="button"
          title="Semana siguiente"
          aria-label="Semana siguiente"
          @click="mover(1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div class="stats">
      <StatCard
        label="Esta semana"
        :value="formatMinutos(totalSemana)"
        icon="fas fa-calendar-week"
        tone="navy"
      />
      <StatCard label="Hoy" :value="formatMinutos(minutosHoy)" icon="fas fa-business-time" />
      <StatCard
        label="Disponible hoy"
        :value="disponibleHoy === null ? '—' : formatMinutos(disponibleHoy)"
        icon="fas fa-hourglass-half"
        :tone="disponibleHoy === 0 ? 'success' : 'warning'"
      />
      <StatCard label="Registros" :value="entries.length" icon="fas fa-list" />
    </div>

    <div class="grid-main-side">
      <div class="stack">
        <AppPanel title="Reparto semanal">
          <div class="dias">
            <div v-for="d in dias" :key="d.fecha" class="dia" :class="{ hoy: d.esHoy }">
              <span class="dia-nombre">{{ d.nombre }}</span>
              <div class="barra" :title="formatMinutos(d.minutos)">
                <span :style="{ width: Math.min(100, (d.minutos / LIMITE) * 100) + '%' }"></span>
              </div>
              <span class="dia-total tabular">{{
                d.minutos ? formatMinutos(d.minutos) : '—'
              }}</span>
            </div>
          </div>
        </AppPanel>

        <AppPanel title="Registros de la semana" :count="entries.length" flush>
          <Loading :carga="cargando" mensaje="Cargando horas…" />
          <EmptyState
            v-if="!cargando && !entries.length"
            icon="fas fa-business-time"
            title="Sin registros"
            text="No hay horas imputadas esta semana."
          />
          <div v-if="!cargando && entries.length" class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente / Proyecto</th>
                  <th>Acción</th>
                  <th class="num">Tiempo</th>
                  <th class="col-actions"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in entriesOrdenadas" :key="e.id">
                  <td class="tabular nowrap">{{ diaDe(e) | moment('ddd D MMM') }}</td>
                  <td>
                    <span class="nombre">{{ e.proyecto ? e.proyecto.nombre : '—' }}</span>
                    <small class="muted desc">
                      {{ e.cliente ? e.cliente.nombre : ''
                      }}{{ e.descripcion ? ' · ' + e.descripcion : '' }}
                    </small>
                  </td>
                  <td>
                    <span v-if="e.accion" class="badge-soft">{{ e.accion.nombre }}</span>
                  </td>
                  <td class="num nowrap">{{ formatMinutos(e.minutos) }}</td>
                  <td class="col-actions">
                    <button
                      class="btn btn-ghost btn-icon danger"
                      title="Eliminar"
                      aria-label="Eliminar"
                      @click="eliminar(e)"
                    >
                      <i class="far fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppPanel>
      </div>

      <AppPanel title="Imputar horas">
        <form novalidate @submit.prevent="guardar">
          <div class="form-group">
            <label for="h-fecha">Fecha</label>
            <input id="h-fecha" v-model="form.fecha" type="date" class="form-control" required />
            <p v-if="disponibleFecha !== null" class="form-hint">
              Disponible ese día: {{ formatMinutos(disponibleFecha) }}
            </p>
          </div>
          <div class="form-group">
            <label for="h-cliente">Cliente</label>
            <select id="h-cliente" v-model="form.cliente" class="custom-select" required>
              <option value="" disabled>Selecciona…</option>
              <option v-for="c in catalogo.clientes" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="h-proyecto">Proyecto</label>
            <select
              id="h-proyecto"
              v-model="form.proyecto"
              class="custom-select"
              :disabled="!form.cliente"
              required
            >
              <option value="" disabled>Selecciona…</option>
              <option v-for="p in proyectosCliente" :key="p.id" :value="p.id">
                {{ p.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="h-accion">Acción</label>
            <select id="h-accion" v-model="form.accion" class="custom-select" required>
              <option value="" disabled>Selecciona…</option>
              <option v-for="a in catalogo.acciones" :key="a.id" :value="a.id">
                {{ a.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="h-horas">Tiempo (horas)</label>
            <input
              id="h-horas"
              v-model.number="form.horas"
              type="number"
              min="0.25"
              max="8"
              step="0.25"
              class="form-control"
              required
            />
            <p class="form-hint">{{ formatMinutos(minutosForm) }} · máximo 8 h por día</p>
          </div>
          <div class="form-group">
            <label for="h-desc">Descripción <span class="muted">(opcional)</span></label>
            <textarea
              id="h-desc"
              v-model="form.descripcion"
              class="form-control"
              rows="2"
              maxlength="500"
            ></textarea>
          </div>
          <p v-if="errorForm" class="form-error">{{ errorForm }}</p>
          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="!formValido || guardando"
          >
            <i class="fas fa-plus"></i> {{ guardando ? 'Guardando…' : 'Imputar' }}
          </button>
        </form>
      </AppPanel>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import api from '@/api'
import Loading from '@/components/Loading.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { toast, confirmar, errorMsg, formatMinutos } from '@/utils/ui'

const ISO = 'YYYY-MM-DD'
const hoy = () => moment().format(ISO)

export default {
  name: 'Horas',
  components: { Loading, PageHeader, AppPanel, StatCard, EmptyState },
  data() {
    return {
      LIMITE: 480,
      semana: this.inicioSemana(),
      entries: [],
      catalogo: { clientes: [], proyectos: [], acciones: [] },
      disponibleHoy: null,
      disponibleFecha: null,
      cargando: false,
      guardando: false,
      error: '',
      errorForm: '',
      form: { fecha: hoy(), cliente: '', proyecto: '', accion: '', horas: 1, descripcion: '' },
    }
  },
  computed: {
    esSemanaActual() {
      return this.semana === this.inicioSemana()
    },
    etiquetaSemana() {
      const ini = moment(this.semana)
      return `${ini.format('D MMM')} – ${ini.clone().add(6, 'days').format('D MMM')}`
    },
    dias() {
      return Array.from({ length: 7 }, (_, i) => {
        const fecha = moment(this.semana).add(i, 'days')
        const f = fecha.format(ISO)
        return {
          fecha: f,
          nombre: fecha.format('ddd D'),
          esHoy: f === hoy(),
          minutos: this.entries
            .filter((e) => this.diaDe(e) === f)
            .reduce((n, e) => n + e.minutos, 0),
        }
      })
    },
    totalSemana() {
      return this.entries.reduce((n, e) => n + e.minutos, 0)
    },
    minutosHoy() {
      return this.entries.filter((e) => this.diaDe(e) === hoy()).reduce((n, e) => n + e.minutos, 0)
    },
    entriesOrdenadas() {
      return [...this.entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    },
    proyectosCliente() {
      return this.catalogo.proyectos.filter((p) => p.cliente === this.form.cliente)
    },
    minutosForm() {
      return Math.round((Number(this.form.horas) || 0) * 60)
    },
    formValido() {
      const f = this.form
      return (
        f.fecha &&
        f.cliente &&
        f.proyecto &&
        f.accion &&
        this.minutosForm > 0 &&
        this.minutosForm <= 480
      )
    },
  },
  watch: {
    semana() {
      this.cargarEntries()
    },
    'form.fecha': {
      immediate: true,
      handler(fecha) {
        this.cargarDisponible(fecha)
      },
    },
    'form.cliente'() {
      if (!this.proyectosCliente.some((p) => p.id === this.form.proyecto)) this.form.proyecto = ''
    },
  },
  methods: {
    formatMinutos,
    inicioSemana() {
      return moment().startOf('isoWeek').format(ISO)
    },
    mover(n) {
      this.semana = moment(this.semana).add(n, 'weeks').format(ISO)
    },
    // Día del registro tal como lo guarda el servicio (fecha en UTC)
    diaDe(e) {
      return moment.utc(e.fecha).format(ISO)
    },
    async cargarEntries() {
      this.cargando = true
      this.error = ''
      try {
        const { data } = await api.get('/hours/entries', {
          params: { desde: this.semana, hasta: moment(this.semana).add(6, 'days').format(ISO) },
        })
        this.entries = data.entries
      } catch (error) {
        this.error = errorMsg(error, 'No se pudieron cargar las horas')
      } finally {
        this.cargando = false
      }
    },
    async cargarDisponible(fecha) {
      if (!fecha) return
      try {
        const { data } = await api.get(`/hours/available/${fecha}`)
        if (fecha === this.form.fecha) this.disponibleFecha = data.tiempoDisponible
        if (fecha === hoy()) this.disponibleHoy = data.tiempoDisponible
      } catch {
        this.disponibleFecha = null
      }
    },
    async cargarCatalogo() {
      try {
        const { data } = await api.get('/hours/catalog')
        this.catalogo = data
      } catch (error) {
        this.error = errorMsg(error, 'No se pudo cargar el catálogo de clientes y proyectos')
      }
    },
    async guardar() {
      if (!this.formValido) return
      this.guardando = true
      this.errorForm = ''
      const { fecha, cliente, proyecto, accion, descripcion } = this.form
      try {
        await api.post('/hours/entries', {
          fecha,
          cliente,
          proyecto,
          accion,
          descripcion,
          minutos: this.minutosForm,
        })
        toast.fire({ icon: 'success', title: `${formatMinutos(this.minutosForm)} imputadas` })
        this.form.descripcion = ''
        await Promise.all([this.cargarEntries(), this.cargarDisponible(fecha)])
        if (fecha !== hoy()) this.cargarDisponible(hoy())
      } catch (error) {
        this.errorForm = errorMsg(error, 'No se pudo imputar el tiempo')
      } finally {
        this.guardando = false
      }
    },
    async eliminar(e) {
      if (!(await confirmar('¿Eliminar este registro de horas?'))) return
      try {
        await api.delete(`/hours/entries/${e.id}`)
        this.entries = this.entries.filter((x) => x.id !== e.id)
        toast.fire({ icon: 'success', title: 'Registro eliminado' })
        this.cargarDisponible(this.diaDe(e))
        if (this.diaDe(e) !== hoy()) this.cargarDisponible(hoy())
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar') })
      }
    },
  },
  created() {
    this.cargarEntries()
    this.cargarCatalogo()
    this.cargarDisponible(hoy())
  },
}
</script>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  min-width: 0;
}
.dias {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.dia {
  display: grid;
  grid-template-columns: 70px 1fr 90px;
  align-items: center;
  gap: var(--sp-3);
  font-size: var(--fs-sm);
}
.dia-nombre {
  color: var(--text-2);
  text-transform: capitalize;
}
.dia.hoy .dia-nombre {
  color: var(--accent);
  font-weight: 600;
}
.barra {
  height: 10px;
  background: var(--bg-hover);
  border-radius: 999px;
  overflow: hidden;
}
.barra span {
  display: block;
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
}
.dia-total {
  text-align: right;
  color: var(--text-2);
}
.nombre {
  font-weight: 500;
}
.desc {
  display: block;
  font-size: var(--fs-xs);
  margin-top: 2px;
}
.nowrap {
  white-space: nowrap;
  text-transform: capitalize;
}
</style>
