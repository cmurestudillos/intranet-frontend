<template>
  <div>
    <PageHeader title="Presupuestos" subtitle="Presupuestos y gastos de control-de-presupuesto">
      <button class="btn btn-secondary" :disabled="!visibles.length" @click="exportar">
        <i class="fas fa-file-excel"></i> Exportar
      </button>
      <button class="btn btn-secondary" :disabled="cargando" @click="cargar">
        <i class="fas fa-rotate" :class="{ 'fa-spin': cargando }"></i> Actualizar
      </button>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div class="stats">
      <StatCard label="Activos" :value="activos.length" icon="fas fa-wallet" tone="navy" />
      <StatCard label="Asignado" :value="euros(totales.inicial)" icon="fas fa-coins" />
      <StatCard
        label="Gastado"
        :value="euros(totales.gastado)"
        icon="fas fa-receipt"
        :tone="totales.inicial && totales.gastado / totales.inicial >= 0.9 ? 'warning' : ''"
      />
      <StatCard
        label="Disponible"
        :value="euros(totales.restante)"
        icon="fas fa-piggy-bank"
        tone="success"
      />
    </div>

    <div class="grid-main-side">
      <div class="lista">
        <div class="filtros">
          <div class="input-icon buscar">
            <i class="fas fa-search"></i>
            <input
              v-model="q"
              type="search"
              class="form-control"
              placeholder="Buscar por nombre…"
              aria-label="Buscar presupuestos"
            />
          </div>
          <select v-model="estado" class="custom-select auto" aria-label="Estado">
            <option value="activos">Activos ({{ activos.length }})</option>
            <option value="archivados">Archivados ({{ budgets.length - activos.length }})</option>
            <option value="todos">Todos ({{ budgets.length }})</option>
          </select>
          <select v-model="consumo" class="custom-select auto" aria-label="Consumo">
            <option value="">Cualquier consumo</option>
            <option value="bajo">Menos del 50 %</option>
            <option value="medio">Del 50 % al 90 %</option>
            <option value="alto">Más del 90 %</option>
            <option value="agotado">Agotados</option>
          </select>
          <select v-model="orden" class="custom-select auto" aria-label="Ordenar">
            <option value="recientes">Más recientes</option>
            <option value="nombre">Nombre</option>
            <option value="consumo">% gastado</option>
            <option value="restante">Disponible</option>
          </select>
        </div>

        <AppPanel title="Presupuestos" :count="visibles.length" flush>
          <Loading :carga="cargando && !budgets.length" mensaje="Cargando presupuestos…" />
          <EmptyState
            v-if="!cargando && !error && !visibles.length"
            icon="fas fa-wallet"
            title="Sin presupuestos"
            :text="budgets.length ? 'Ninguno coincide con los filtros.' : 'Crea el primero.'"
          />
          <div v-if="visibles.length" class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th class="num">Inicial</th>
                  <th class="num">Gastado</th>
                  <th class="num">Disponible</th>
                  <th>Consumo</th>
                  <th>Creado</th>
                  <th class="col-actions"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="b in visibles"
                  :key="b.id"
                  :class="{ seleccionado: seleccionado === b.id, archivado: b.archivado }"
                >
                  <td>
                    <div class="nombre">
                      <button type="button" class="link" @click="seleccionar(b)">
                        {{ b.nombre }}
                      </button>
                      <span v-if="b.archivado" class="badge-soft">Archivado</span>
                    </div>
                  </td>
                  <td class="num tabular">{{ euros(b.cantidadInicial) }}</td>
                  <td class="num tabular">{{ euros(b.cantidadGastada) }}</td>
                  <td class="num tabular">{{ euros(b.cantidadRestante) }}</td>
                  <td>
                    <div class="barra" :title="`${b.porcentajeGastado} %`">
                      <span
                        :class="tono(b)"
                        :style="{ width: Math.min(b.porcentajeGastado, 100) + '%' }"
                      ></span>
                    </div>
                    <small class="muted tabular">{{ b.porcentajeGastado }} %</small>
                  </td>
                  <td class="tabular nowrap">{{ b.createdAt | moment('D MMM YYYY') }}</td>
                  <td class="col-actions nowrap">
                    <button
                      class="btn btn-ghost btn-icon"
                      title="Editar"
                      aria-label="Editar"
                      @click="editar(b)"
                    >
                      <i class="fas fa-pen"></i>
                    </button>
                    <button
                      class="btn btn-ghost btn-icon"
                      :title="b.archivado ? 'Desarchivar' : 'Archivar'"
                      :aria-label="b.archivado ? 'Desarchivar' : 'Archivar'"
                      @click="archivar(b)"
                    >
                      <i class="fas" :class="b.archivado ? 'fa-box-open' : 'fa-box-archive'"></i>
                    </button>
                    <button
                      class="btn btn-ghost btn-icon danger"
                      title="Eliminar"
                      aria-label="Eliminar"
                      @click="eliminar(b)"
                    >
                      <i class="far fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppPanel>

        <AppPanel
          v-if="actual"
          :title="`Gastos · ${actual.nombre}`"
          :count="gastos.length"
          flush
          class="gastos"
        >
          <Loading :carga="cargandoGastos" mensaje="Cargando gastos…" />
          <EmptyState
            v-if="!cargandoGastos && !gastos.length"
            icon="fas fa-receipt"
            title="Sin gastos"
            text="Añade el primero abajo."
          />
          <div v-if="!cargandoGastos && gastos.length" class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th class="num">Cantidad</th>
                  <th>Fecha</th>
                  <th class="col-actions"><span class="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in gastos" :key="g.id">
                  <template v-if="gastoEditando === g.id">
                    <td>
                      <input
                        v-model.trim="formGasto.nombre"
                        class="form-control form-control-sm"
                        aria-label="Concepto"
                      />
                    </td>
                    <td class="num">
                      <input
                        v-model.number="formGasto.cantidad"
                        type="number"
                        min="0"
                        step="0.01"
                        class="form-control form-control-sm cantidad"
                        aria-label="Cantidad"
                        @keyup.enter="guardarGasto(g)"
                      />
                    </td>
                    <td class="tabular nowrap">{{ g.createdAt | moment('D MMM YYYY') }}</td>
                    <td class="col-actions nowrap">
                      <button
                        class="btn btn-ghost btn-icon"
                        title="Guardar"
                        aria-label="Guardar"
                        :disabled="!gastoValido(formGasto)"
                        @click="guardarGasto(g)"
                      >
                        <i class="fas fa-check"></i>
                      </button>
                      <button
                        class="btn btn-ghost btn-icon"
                        title="Cancelar"
                        aria-label="Cancelar"
                        @click="gastoEditando = null"
                      >
                        <i class="fas fa-xmark"></i>
                      </button>
                    </td>
                  </template>
                  <template v-else>
                    <td>{{ g.nombre }}</td>
                    <td class="num tabular">{{ euros(g.cantidad) }}</td>
                    <td class="tabular nowrap">{{ g.createdAt | moment('D MMM YYYY') }}</td>
                    <td class="col-actions nowrap">
                      <button
                        class="btn btn-ghost btn-icon"
                        title="Editar"
                        aria-label="Editar"
                        @click="editarGasto(g)"
                      >
                        <i class="fas fa-pen"></i>
                      </button>
                      <button
                        class="btn btn-ghost btn-icon danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        @click="eliminarGasto(g)"
                      >
                        <i class="far fa-trash-can"></i>
                      </button>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
          <template #footer>
            <form class="nuevo" novalidate @submit.prevent="crearGasto">
              <input
                v-model.trim="nuevoGasto.nombre"
                class="form-control form-control-sm"
                placeholder="Concepto"
                aria-label="Concepto"
              />
              <input
                v-model.number="nuevoGasto.cantidad"
                type="number"
                min="0"
                step="0.01"
                class="form-control form-control-sm cantidad"
                placeholder="0,00"
                aria-label="Cantidad"
              />
              <small class="muted tabular">Disponible: {{ euros(actual.cantidadRestante) }}</small>
              <button
                type="submit"
                class="btn btn-secondary btn-sm"
                :disabled="!gastoValido(nuevoGasto) || guardandoGasto"
              >
                <i class="fas fa-plus"></i> Añadir
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="!gastos.length"
                @click="exportarGastos"
              >
                <i class="fas fa-file-excel"></i> Exportar
              </button>
            </form>
          </template>
        </AppPanel>
      </div>

      <AppPanel :title="editando ? 'Editar presupuesto' : 'Nuevo presupuesto'" class="formulario">
        <form novalidate @submit.prevent="guardar">
          <div class="form-group">
            <label for="p-nombre">Nombre</label>
            <input
              id="p-nombre"
              v-model.trim="form.nombre"
              class="form-control"
              maxlength="100"
              required
            />
          </div>
          <div class="form-group">
            <label for="p-cantidad">Cantidad inicial (€)</label>
            <input
              id="p-cantidad"
              v-model.number="form.cantidadInicial"
              type="number"
              min="0"
              step="0.01"
              class="form-control"
              required
            />
            <small v-if="editando && editado" class="muted">
              Gastado: {{ euros(editado.cantidadGastada) }}. El disponible se ajusta por la
              diferencia.
            </small>
          </div>
          <p v-if="errorForm" class="form-error">{{ errorForm }}</p>
          <div class="botones">
            <button v-if="editando" type="button" class="btn btn-secondary" @click="cancelar">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!formValido || guardando">
              <i class="fas" :class="editando ? 'fa-floppy-disk' : 'fa-plus'"></i>
              {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear' }}
            </button>
          </div>
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
import { toast, confirmar, errorMsg } from '@/utils/ui'

const VACIO = () => ({ nombre: '', cantidadInicial: null })
const GASTO_VACIO = () => ({ nombre: '', cantidad: null })
const fmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: 'always',
})

// Descarga un .xlsx con las filas dadas (xlsx se carga solo al exportar)
async function descargarExcel(filas, hoja, archivo) {
  const XLSX = await import(/* webpackChunkName: "xlsx" */ 'xlsx')
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filas), hoja)
  XLSX.writeFile(libro, `${archivo}-${moment().format('YYYY-MM-DD')}.xlsx`)
}

export default {
  name: 'Presupuestos',
  components: { Loading, PageHeader, AppPanel, StatCard, EmptyState },
  data() {
    return {
      budgets: [],
      cargando: false,
      guardando: false,
      error: '',
      errorForm: '',
      q: '',
      estado: 'activos',
      consumo: '',
      orden: 'recientes',
      editando: null,
      form: VACIO(),
      seleccionado: null,
      gastos: [],
      cargandoGastos: false,
      guardandoGasto: false,
      nuevoGasto: GASTO_VACIO(),
      gastoEditando: null,
      formGasto: GASTO_VACIO(),
    }
  },
  computed: {
    activos() {
      return this.budgets.filter((b) => !b.archivado)
    },
    totales() {
      const t = { inicial: 0, gastado: 0, restante: 0 }
      for (const b of this.activos) {
        t.inicial += b.cantidadInicial
        t.gastado += b.cantidadGastada
        t.restante += b.cantidadRestante
      }
      return t
    },
    visibles() {
      const q = this.q.trim().toLowerCase()
      const enConsumo = {
        bajo: (p) => p < 50,
        medio: (p) => p >= 50 && p <= 90,
        alto: (p) => p > 90,
        agotado: (p, b) => b.cantidadRestante <= 0,
      }[this.consumo]
      const ordenar = {
        recientes: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
        consumo: (a, b) => b.porcentajeGastado - a.porcentajeGastado,
        restante: (a, b) => b.cantidadRestante - a.cantidadRestante,
      }[this.orden]
      return this.budgets
        .filter(
          (b) =>
            (this.estado === 'todos' || b.archivado === (this.estado === 'archivados')) &&
            (!q || b.nombre.toLowerCase().includes(q)) &&
            (!enConsumo || enConsumo(b.porcentajeGastado, b))
        )
        .sort(ordenar)
    },
    actual() {
      return this.budgets.find((b) => b.id === this.seleccionado) || null
    },
    editado() {
      return this.budgets.find((b) => b.id === this.editando) || null
    },
    formValido() {
      const n = this.form.nombre.length
      return (
        n >= 3 && n <= 100 && this.form.cantidadInicial >= 0 && this.form.cantidadInicial !== ''
      )
    },
  },
  methods: {
    euros(n) {
      return fmt.format(n || 0)
    },
    tono(b) {
      if (b.porcentajeGastado >= 90) return 'tone-danger'
      if (b.porcentajeGastado >= 50) return 'tone-warning'
      return 'tone-success'
    },
    gastoValido(g) {
      return g.nombre.length >= 2 && typeof g.cantidad === 'number' && g.cantidad >= 0
    },
    async cargar() {
      this.cargando = true
      this.error = ''
      try {
        const { data } = await api.get('/budgets')
        this.budgets = data.budgets
        if (this.seleccionado && !this.actual) this.seleccionado = null
        else if (this.seleccionado) this.cargarGastos()
      } catch (error) {
        this.error = errorMsg(error, 'No se pudieron cargar los presupuestos')
      } finally {
        this.cargando = false
      }
    },
    reemplazar(budget) {
      const i = this.budgets.findIndex((b) => b.id === budget.id)
      if (i >= 0) this.budgets.splice(i, 1, budget)
    },
    // Recalcula el presupuesto en local con el restante que devuelve el servicio
    actualizarRestante(cantidadRestante) {
      const b = this.actual
      if (!b || typeof cantidadRestante !== 'number') return
      const gastado = Math.round((b.cantidadInicial - cantidadRestante) * 100) / 100
      this.reemplazar({
        ...b,
        cantidadRestante,
        cantidadGastada: gastado,
        porcentajeGastado: b.cantidadInicial
          ? Math.round((gastado / b.cantidadInicial) * 1000) / 10
          : 0,
      })
    },
    editar(b) {
      this.editando = b.id
      this.form = { nombre: b.nombre, cantidadInicial: b.cantidadInicial }
      this.errorForm = ''
    },
    cancelar() {
      this.editando = null
      this.form = VACIO()
      this.errorForm = ''
    },
    async guardar() {
      if (!this.formValido) return
      this.guardando = true
      this.errorForm = ''
      try {
        if (this.editando) {
          const { data } = await api.put(`/budgets/${this.editando}`, this.form)
          this.reemplazar(data.budget)
          toast.fire({ icon: 'success', title: 'Presupuesto actualizado' })
        } else {
          const { data } = await api.post('/budgets', this.form)
          this.budgets.unshift(data.budget)
          if (this.estado === 'archivados') this.estado = 'activos'
          toast.fire({ icon: 'success', title: 'Presupuesto creado' })
        }
        this.cancelar()
      } catch (error) {
        this.errorForm = errorMsg(error, 'No se pudo guardar el presupuesto')
      } finally {
        this.guardando = false
      }
    },
    async archivar(b) {
      try {
        const { data } = await api.put(`/budgets/${b.id}`, { archivado: !b.archivado })
        this.reemplazar(data.budget)
        toast.fire({
          icon: 'success',
          title: data.budget.archivado ? 'Presupuesto archivado' : 'Presupuesto restaurado',
        })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo archivar') })
      }
    },
    async eliminar(b) {
      const ok = await confirmar(
        `¿Eliminar «${b.nombre}»?`,
        'Se borrarán también todos sus gastos. Esta acción no se puede deshacer.'
      )
      if (!ok) return
      try {
        await api.delete(`/budgets/${b.id}`)
        this.budgets = this.budgets.filter((x) => x.id !== b.id)
        if (this.editando === b.id) this.cancelar()
        if (this.seleccionado === b.id) this.seleccionado = null
        toast.fire({ icon: 'success', title: 'Presupuesto eliminado' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar') })
      }
    },
    seleccionar(b) {
      if (this.seleccionado === b.id) return
      this.seleccionado = b.id
      this.nuevoGasto = GASTO_VACIO()
      this.gastoEditando = null
      this.cargarGastos()
    },
    async cargarGastos() {
      const id = this.seleccionado
      this.cargandoGastos = true
      this.gastos = []
      try {
        const { data } = await api.get(`/budgets/${id}/expenses`)
        if (this.seleccionado === id) this.gastos = data.expenses
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudieron cargar los gastos') })
      } finally {
        if (this.seleccionado === id) this.cargandoGastos = false
      }
    },
    async crearGasto() {
      if (!this.gastoValido(this.nuevoGasto)) return
      this.guardandoGasto = true
      try {
        const { data } = await api.post(`/budgets/${this.seleccionado}/expenses`, this.nuevoGasto)
        this.gastos.unshift(data.expense)
        this.actualizarRestante(data.cantidadRestante)
        this.nuevoGasto = GASTO_VACIO()
        toast.fire({ icon: 'success', title: 'Gasto añadido' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo añadir el gasto') })
      } finally {
        this.guardandoGasto = false
      }
    },
    editarGasto(g) {
      this.gastoEditando = g.id
      this.formGasto = { nombre: g.nombre, cantidad: g.cantidad }
    },
    async guardarGasto(g) {
      if (!this.gastoValido(this.formGasto)) return
      try {
        const { data } = await api.put(
          `/budgets/${this.seleccionado}/expenses/${g.id}`,
          this.formGasto
        )
        const i = this.gastos.findIndex((x) => x.id === g.id)
        if (i >= 0) this.gastos.splice(i, 1, data.expense)
        this.actualizarRestante(data.cantidadRestante)
        this.gastoEditando = null
        toast.fire({ icon: 'success', title: 'Gasto actualizado' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo guardar el gasto') })
      }
    },
    async eliminarGasto(g) {
      if (!(await confirmar(`¿Eliminar el gasto «${g.nombre}»?`))) return
      try {
        const { data } = await api.delete(`/budgets/${this.seleccionado}/expenses/${g.id}`)
        this.gastos = this.gastos.filter((x) => x.id !== g.id)
        this.actualizarRestante(data.cantidadRestante)
        toast.fire({ icon: 'success', title: 'Gasto eliminado' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar el gasto') })
      }
    },
    async exportar() {
      const filas = this.visibles.map((b) => ({
        Nombre: b.nombre,
        'Cantidad inicial': b.cantidadInicial,
        Gastado: b.cantidadGastada,
        Disponible: b.cantidadRestante,
        '% gastado': b.porcentajeGastado,
        Estado: b.archivado ? 'Archivado' : 'Activo',
        Creado: moment(b.createdAt).format('YYYY-MM-DD'),
      }))
      try {
        await descargarExcel(filas, 'Presupuestos', 'presupuestos')
      } catch {
        toast.fire({ icon: 'error', title: 'No se pudo exportar' })
      }
    },
    async exportarGastos() {
      const filas = this.gastos.map((g) => ({
        Concepto: g.nombre,
        Cantidad: g.cantidad,
        Fecha: moment(g.createdAt).format('YYYY-MM-DD'),
      }))
      try {
        await descargarExcel(filas, 'Gastos', `gastos-${this.actual.nombre}`)
      } catch {
        toast.fire({ icon: 'error', title: 'No se pudo exportar' })
      }
    },
  },
  created() {
    this.cargar()
  },
}
</script>

<style scoped>
.lista {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}
.filtros {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.buscar {
  flex: 1;
  min-width: 200px;
}
.auto {
  width: auto;
}
.nombre {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.link {
  background: none;
  border: 0;
  padding: 0;
  font-weight: 500;
  color: var(--text);
  text-align: left;
}
.link:hover {
  color: var(--accent);
  text-decoration: underline;
}
tr.seleccionado td {
  background: var(--accent-soft);
}
tr.archivado td {
  color: var(--text-3);
}
.nowrap {
  white-space: nowrap;
}
.barra {
  width: 70px;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-subtle);
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-right: var(--sp-2);
}
.barra span {
  display: block;
  height: 100%;
}
.barra .tone-success {
  background: var(--success);
}
.barra .tone-warning {
  background: var(--warning);
}
.barra .tone-danger {
  background: var(--danger);
}
.nuevo {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.nuevo input:first-child {
  flex: 1;
  min-width: 160px;
}
.cantidad {
  width: 110px;
  text-align: right;
}
.formulario {
  position: sticky;
  top: calc(var(--topbar-h) + var(--sp-4));
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
}
</style>
