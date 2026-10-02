<template>
  <div>
    <PageHeader title="Todoist" subtitle="Listas y tareas de todoist-manager-service">
      <button class="btn btn-secondary" :disabled="cargando" @click="cargar">
        <i class="fas fa-rotate" :class="{ 'fa-spin': cargando }"></i> Actualizar
      </button>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div class="todoist">
      <!-- Listas -->
      <AppPanel title="Listas" :count="lists.length" flush>
        <ul class="listas">
          <li :class="{ activa: !listaId }">
            <button type="button" class="lista-btn" @click="listaId = ''">
              <i class="fas fa-inbox"></i>
              <span class="truncate">Todas</span>
              <span class="count">{{ pendientesTotal }}</span>
            </button>
          </li>
          <li v-for="l in lists" :key="l.id" :class="{ activa: listaId === l.id }">
            <form v-if="renombrando === l.id" class="renombrar" @submit.prevent="renombrar(l)">
              <input
                ref="renombrarInput"
                v-model.trim="nombreLista"
                class="form-control form-control-sm"
                aria-label="Nombre de la lista"
                @keydown.esc="renombrando = null"
              />
              <button
                type="submit"
                class="btn btn-ghost btn-icon"
                title="Guardar"
                aria-label="Guardar"
              >
                <i class="fas fa-check"></i>
              </button>
            </form>
            <template v-else>
              <button type="button" class="lista-btn" @click="listaId = l.id">
                <i class="fas fa-list-ul"></i>
                <span class="truncate">{{ l.nombre }}</span>
                <span class="count">{{ l.pendientes }}</span>
              </button>
              <span class="lista-acciones">
                <button
                  class="btn btn-ghost btn-icon"
                  title="Renombrar"
                  aria-label="Renombrar"
                  @click="empezarRenombrar(l)"
                >
                  <i class="fas fa-pen"></i>
                </button>
                <button
                  class="btn btn-ghost btn-icon danger"
                  title="Eliminar"
                  aria-label="Eliminar"
                  @click="eliminarLista(l)"
                >
                  <i class="far fa-trash-can"></i>
                </button>
              </span>
            </template>
          </li>
        </ul>
        <template #footer>
          <form class="nueva" @submit.prevent="crearLista">
            <input
              v-model.trim="nuevaLista"
              class="form-control form-control-sm"
              placeholder="Nueva lista…"
              aria-label="Nueva lista"
            />
            <button
              type="submit"
              class="btn btn-secondary btn-sm"
              :disabled="!nuevaLista"
              aria-label="Crear lista"
            >
              <i class="fas fa-plus"></i>
            </button>
          </form>
        </template>
      </AppPanel>

      <!-- Tareas -->
      <AppPanel flush>
        <template #header>
          <h3 class="panel-title">
            {{ listaActual ? listaActual.nombre : 'Todas las tareas' }}
          </h3>
        </template>
        <template #actions>
          <div class="segmented">
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

        <form class="nueva nueva-tarea" @submit.prevent="crearTarea">
          <select
            v-if="!listaId"
            v-model="listaNueva"
            class="custom-select custom-select-sm lista-select"
            aria-label="Lista"
          >
            <option value="" disabled>Lista…</option>
            <option v-for="l in lists" :key="l.id" :value="l.id">{{ l.nombre }}</option>
          </select>
          <input
            v-model.trim="nuevaTarea"
            class="form-control form-control-sm"
            placeholder="Añadir tarea…"
            aria-label="Nueva tarea"
          />
          <button
            type="submit"
            class="btn btn-primary btn-sm"
            :disabled="!nuevaTarea || !(listaId || listaNueva)"
          >
            <i class="fas fa-plus"></i> Añadir
          </button>
        </form>

        <Loading :carga="cargando && !tasks.length" mensaje="Cargando tareas…" />
        <EmptyState
          v-if="!cargando && !error && !visibles.length"
          icon="fas fa-mug-hot"
          title="Sin tareas"
          :text="delaLista.length ? 'Ninguna tarea con este filtro.' : 'Añade la primera tarea.'"
        />
        <ul v-if="visibles.length" class="tareas">
          <li v-for="t in visibles" :key="t.id" :class="{ hecha: t.estado }">
            <button
              class="check"
              :class="{ on: t.estado }"
              :title="t.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
              :aria-label="t.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
              @click="actualizarTarea(t, { estado: !t.estado })"
            >
              <i v-if="t.estado" class="fas fa-check"></i>
            </button>
            <form v-if="editando === t.id" class="editar" @submit.prevent="guardarNombre(t)">
              <input
                ref="editarInput"
                v-model.trim="nombreTarea"
                class="form-control form-control-sm"
                aria-label="Nombre de la tarea"
                @keydown.esc="editando = null"
              />
            </form>
            <span v-else class="nombre" @dblclick="empezarEditar(t)">{{ t.nombre }}</span>
            <span v-if="!listaId && nombreDeLista(t.lista)" class="badge-soft">
              {{ nombreDeLista(t.lista) }}
            </span>
            <span class="tarea-acciones">
              <button
                class="btn btn-ghost btn-icon"
                title="Editar"
                aria-label="Editar"
                @click="empezarEditar(t)"
              >
                <i class="fas fa-pen"></i>
              </button>
              <button
                class="btn btn-ghost btn-icon danger"
                title="Eliminar"
                aria-label="Eliminar"
                @click="eliminarTarea(t)"
              >
                <i class="far fa-trash-can"></i>
              </button>
            </span>
          </li>
        </ul>
      </AppPanel>
    </div>
  </div>
</template>

<script>
import api from '@/api'
import Loading from '@/components/Loading.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { toast, confirmar, errorMsg } from '@/utils/ui'

export default {
  name: 'Todoist',
  components: { Loading, PageHeader, AppPanel, EmptyState },
  data() {
    return {
      lists: [],
      tasks: [],
      cargando: false,
      error: '',
      listaId: '',
      filtro: 'pendientes',
      nuevaLista: '',
      nuevaTarea: '',
      listaNueva: '',
      renombrando: null,
      nombreLista: '',
      editando: null,
      nombreTarea: '',
    }
  },
  computed: {
    listaActual() {
      return this.lists.find((l) => l.id === this.listaId) || null
    },
    pendientesTotal() {
      return this.tasks.filter((t) => !t.estado).length
    },
    delaLista() {
      return this.listaId ? this.tasks.filter((t) => t.lista === this.listaId) : this.tasks
    },
    filtros() {
      const pend = this.delaLista.filter((t) => !t.estado).length
      return [
        { value: 'pendientes', text: 'Pendientes', count: pend },
        { value: 'completadas', text: 'Hechas', count: this.delaLista.length - pend },
        { value: 'todas', text: 'Todas', count: this.delaLista.length },
      ]
    },
    visibles() {
      return this.delaLista
        .filter(
          (t) => this.filtro === 'todas' || (this.filtro === 'pendientes' ? !t.estado : t.estado)
        )
        .sort((a, b) => a.estado - b.estado || new Date(b.creado) - new Date(a.creado))
    },
  },
  methods: {
    nombreDeLista(id) {
      const l = this.lists.find((x) => x.id === id)
      return l ? l.nombre : ''
    },
    // Recalcula los contadores de las listas a partir de las tareas cargadas
    recontar() {
      for (const l of this.lists) {
        const tareas = this.tasks.filter((t) => t.lista === l.id)
        l.total = tareas.length
        l.pendientes = tareas.filter((t) => !t.estado).length
      }
    },
    async cargar() {
      this.cargando = true
      this.error = ''
      try {
        const { data } = await api.get('/todoist')
        this.lists = data.lists
        this.tasks = data.tasks
        if (this.listaId && !this.listaActual) this.listaId = ''
      } catch (error) {
        this.error = errorMsg(error, 'No se pudieron cargar las listas de Todoist')
      } finally {
        this.cargando = false
      }
    },
    async crearLista() {
      try {
        const { data } = await api.post('/todoist/lists', { nombre: this.nuevaLista })
        this.lists.unshift(data.list)
        this.listaId = data.list.id
        this.nuevaLista = ''
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo crear la lista') })
      }
    },
    empezarRenombrar(l) {
      this.renombrando = l.id
      this.nombreLista = l.nombre
      this.$nextTick(() => this.$refs.renombrarInput?.[0]?.focus())
    },
    async renombrar(l) {
      if (!this.nombreLista || this.nombreLista === l.nombre) {
        this.renombrando = null
        return
      }
      try {
        const { data } = await api.put(`/todoist/lists/${l.id}`, { nombre: this.nombreLista })
        l.nombre = data.list.nombre
        this.renombrando = null
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo renombrar') })
      }
    },
    async eliminarLista(l) {
      const tareas = this.tasks.filter((t) => t.lista === l.id).length
      const aviso = tareas ? `Tiene ${tareas} tarea(s).` : undefined
      if (!(await confirmar(`¿Eliminar la lista «${l.nombre}»?`, aviso))) return
      try {
        await api.delete(`/todoist/lists/${l.id}`)
        this.lists = this.lists.filter((x) => x.id !== l.id)
        this.tasks = this.tasks.filter((t) => t.lista !== l.id)
        if (this.listaId === l.id) this.listaId = ''
        toast.fire({ icon: 'success', title: 'Lista eliminada' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar') })
      }
    },
    async crearTarea() {
      const lista = this.listaId || this.listaNueva
      try {
        const { data } = await api.post('/todoist/tasks', { nombre: this.nuevaTarea, lista })
        this.tasks.unshift(data.task)
        this.nuevaTarea = ''
        this.recontar()
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo añadir la tarea') })
      }
    },
    async actualizarTarea(t, cambios) {
      try {
        const { data } = await api.put(`/todoist/tasks/${t.id}`, {
          nombre: t.nombre,
          estado: t.estado,
          lista: t.lista,
          ...cambios,
        })
        Object.assign(t, data.task)
        this.recontar()
        return true
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo actualizar la tarea') })
        return false
      }
    },
    empezarEditar(t) {
      this.editando = t.id
      this.nombreTarea = t.nombre
      this.$nextTick(() => this.$refs.editarInput?.[0]?.focus())
    },
    async guardarNombre(t) {
      if (this.nombreTarea && this.nombreTarea !== t.nombre) {
        if (!(await this.actualizarTarea(t, { nombre: this.nombreTarea }))) return
      }
      this.editando = null
    },
    async eliminarTarea(t) {
      if (!(await confirmar(`¿Eliminar «${t.nombre}»?`))) return
      try {
        await api.delete(`/todoist/tasks/${t.id}`, { params: { lista: t.lista } })
        this.tasks = this.tasks.filter((x) => x.id !== t.id)
        this.recontar()
        toast.fire({ icon: 'success', title: 'Tarea eliminada' })
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
.todoist {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--sp-6);
  align-items: start;
}
@media (max-width: 860px) {
  .todoist {
    grid-template-columns: minmax(0, 1fr);
  }
}
.listas,
.tareas {
  list-style: none;
  margin: 0;
  padding: 0;
}
.listas li {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-right: var(--sp-2);
}
.listas li.activa {
  background: var(--accent-soft);
  box-shadow: inset 3px 0 0 var(--accent);
}
.lista-btn {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 10px var(--sp-4);
  background: none;
  border: 0;
  text-align: left;
  font-size: var(--fs-sm);
  color: var(--text);
}
.lista-btn i {
  color: var(--text-3);
  width: 14px;
}
.lista-btn .count {
  margin-left: auto;
  color: var(--text-3);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
}
.lista-acciones,
.tarea-acciones {
  display: none;
}
.listas li:hover .lista-acciones,
.tareas li:hover .tarea-acciones {
  display: inline-flex;
}
.renombrar,
.editar {
  flex: 1;
  display: flex;
  gap: var(--sp-1);
  padding: 6px var(--sp-2);
}
.nueva {
  display: flex;
  gap: var(--sp-2);
}
.nueva-tarea {
  padding: var(--sp-3) var(--sp-4);
  border-bottom: 1px solid var(--border);
  background: var(--bg-subtle);
}
.lista-select {
  width: 160px;
  flex-shrink: 0;
}
.tareas li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 8px var(--sp-4);
  min-height: 46px;
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-sm);
}
.tareas li:last-child {
  border-bottom: 0;
}
.tareas .nombre {
  flex: 1;
  min-width: 0;
  cursor: text;
}
.tareas .editar {
  padding: 0;
}
.hecha .nombre {
  text-decoration: line-through;
  color: var(--text-3);
}
.tarea-acciones {
  margin-left: auto;
}
</style>
