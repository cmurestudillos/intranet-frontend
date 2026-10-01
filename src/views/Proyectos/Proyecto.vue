<template>
  <div class="proyecto">
    <router-link :to="{ name: 'proyectos' }" class="pj-back">
      <i class="fas fa-arrow-left"></i> Proyectos
    </router-link>

    <Loading :carga="cargando && !proyecto" :mensaje="'Cargando proyecto...'" />
    <Mensaje v-if="error" :texto="error" :tipo="'danger'" />

    <template v-if="proyecto">
      <header class="pj-header">
        <div class="pj-title">
          <h2 class="page-title">{{ proyecto.nombre }}</h2>
          <span class="pj-estado" :class="'estado-' + proyecto.estadoTipo">{{
            proyecto.estado || 'Sin estado'
          }}</span>
        </div>
        <p class="pj-meta">
          <span v-if="proyecto.area"><i class="fas fa-layer-group"></i> {{ proyecto.area }}</span>
          <span v-if="proyecto.inicio"
            ><i class="fas fa-flag"></i> Inicio {{ proyecto.inicio }}</span
          >
          <span v-if="proyecto.actualizacion">
            <i class="far fa-calendar"></i> Actualizado {{ proyecto.actualizacion }}
          </span>
          <span><i class="fas fa-folder"></i> {{ proyecto.slug }}/</span>
        </p>
        <p v-if="proyecto.resumen" class="pj-resumen">{{ proyecto.resumen }}</p>
      </header>

      <b-row>
        <!-- Notas del proyecto + índice de la nota actual -->
        <b-col lg="3" class="mb-3">
          <nav class="pj-panel pj-notes" aria-label="Notas del proyecto">
            <h4>Notas</h4>
            <div v-for="grupo in grupos" :key="grupo.carpeta">
              <p v-if="grupo.carpeta" class="pj-folder">
                <i class="far fa-folder-open"></i> {{ grupo.carpeta }}
              </p>
              <router-link
                v-for="n in grupo.notas"
                :key="n.path"
                :to="{ query: { nota: n.path } }"
                class="pj-note-link"
                :class="{ active: n.path === notaPath, indent: grupo.carpeta }"
              >
                {{ n.name }}
              </router-link>
            </div>
          </nav>
          <nav v-if="indice.length" class="pj-panel pj-toc" aria-label="Secciones">
            <h4>En esta nota</h4>
            <a
              v-for="(h, i) in indice"
              :key="i + '-' + h.slug"
              :href="'#' + h.slug"
              :class="'toc-' + h.level"
              @click.prevent="irA(h.slug)"
            >
              {{ h.text }}
            </a>
          </nav>
        </b-col>

        <!-- Visor -->
        <b-col lg="6" class="mb-3">
          <article class="pj-panel pj-viewer">
            <Loading :carga="cargandoNota" :mensaje="'Cargando nota...'" />
            <template v-if="nota && !cargandoNota">
              <div class="pj-note-head">
                <span class="pj-path">{{ nota.path }}</span>
                <span class="pj-mtime" v-if="nota.mtime"
                  >modificada {{ nota.mtime | moment('from') }}</span
                >
              </div>
              <div class="markdown-body" v-html="html" @click="onClickNota"></div>
              <footer v-if="backlinks.length" class="pj-backlinks">
                <h5><i class="fas fa-link"></i> Enlazada desde</h5>
                <router-link v-for="b in backlinks" :key="b.path" :to="rutaNota(b.path)">
                  {{ b.title }} <small>{{ b.path }}</small>
                </router-link>
              </footer>
            </template>
          </article>
        </b-col>

        <!-- Pendientes del vault y tareas vinculadas -->
        <b-col lg="3" class="mb-3">
          <section class="pj-panel">
            <h4>
              Pendientes del vault
              <small>{{ todosAbiertos.length }}</small>
            </h4>
            <p v-if="!todos.length" class="pj-muted">No hay casillas «- [ ]» abiertas.</p>
            <template v-else>
              <label class="pj-todo pj-todo-all" v-if="todosAbiertos.length">
                <input type="checkbox" :checked="todosSeleccionados" @change="toggleTodos" />
                Seleccionar todos
              </label>
              <label
                v-for="t in todos"
                :key="t.key"
                class="pj-todo"
                :class="{ importada: t.importada }"
              >
                <input type="checkbox" v-model="seleccion" :value="t.key" :disabled="t.importada" />
                <span>
                  {{ t.texto }}
                  <small
                    >{{ t.nota }}<template v-if="t.seccion"> · {{ t.seccion }}</template
                    ><template v-if="t.importada"> · ya importada</template></small
                  >
                </span>
              </label>
              <b-button
                block
                size="sm"
                variant="primary"
                class="mt-2"
                :disabled="!seleccion.length || importando"
                @click="importar"
              >
                <i class="fas fa-file-import mr-1"></i>
                Importar {{ seleccion.length || '' }} como tareas
              </b-button>
              <p class="pj-muted mt-2">
                Se crean con 1 h y prioridad media. El vault no se modifica.
              </p>
            </template>
          </section>

          <section class="pj-panel">
            <h4>
              Tareas vinculadas
              <small>{{ tareas.length }}</small>
            </h4>
            <p v-if="!tareas.length" class="pj-muted">Ninguna tarea asociada a este proyecto.</p>
            <ul class="pj-tasks">
              <li v-for="t in tareas" :key="t.id" :class="{ hecha: t.estado }">
                <i :class="t.estado ? 'fas fa-check-circle' : 'far fa-circle'"></i>
                <span>{{ t.nombre }}</span>
                <small :class="'prio-' + t.prioridad">{{ t.prioridad }}</small>
              </li>
            </ul>
            <div class="pj-task-actions">
              <b-button size="sm" variant="outline-light" @click="verTareas">
                <i class="fas fa-list mr-1"></i> Ver en tareas
              </b-button>
              <b-button
                size="sm"
                variant="outline-light"
                :to="{ name: 'agregar', query: { proyecto: proyecto.slug } }"
              >
                <i class="fas fa-plus mr-1"></i> Nueva
              </b-button>
            </div>
          </section>
        </b-col>
      </b-row>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Swal from 'sweetalert2'
import api from '@/api'
import Loading from '@/components/Loading.vue'
import Mensaje from '@/components/Mensaje.vue'
import { renderNote, parseObsidianHref } from '@/utils/markdown'

export default {
  name: 'Proyecto',
  components: { Loading, Mensaje },
  data() {
    return {
      cargando: false,
      cargandoNota: false,
      error: '',
      proyecto: null,
      notas: [],
      todos: [],
      tareas: [],
      nota: null,
      backlinks: [],
      seleccion: [],
      importando: false,
    }
  },
  computed: {
    ...mapState(['ultimaActividadNotas']),
    slug() {
      return this.$route.params.slug
    },
    notaPath() {
      return (
        this.$route.query.nota ||
        (this.proyecto && this.proyecto.overview) ||
        (this.notas[0] && this.notas[0].path)
      )
    },
    html() {
      return this.nota ? renderNote(this.nota.body) : ''
    },
    indice() {
      return this.nota ? this.nota.headings.filter((h) => h.level === 2 || h.level === 3) : []
    },
    // Notas agrupadas por subcarpeta (relativa al proyecto); overview primero
    grupos() {
      const grupos = {}
      for (const n of this.notas) {
        const carpeta = n.folder === this.slug ? '' : n.folder.slice(this.slug.length + 1)
        ;(grupos[carpeta] = grupos[carpeta] || []).push(n)
      }
      const orden = (n) => (n.name === 'overview' ? '0' : '1' + n.name)
      return Object.keys(grupos)
        .sort()
        .map((carpeta) => ({
          carpeta,
          notas: grupos[carpeta].sort((a, b) => orden(a).localeCompare(orden(b))),
        }))
    },
    todosAbiertos() {
      return this.todos.filter((t) => !t.importada)
    },
    todosSeleccionados() {
      return this.todosAbiertos.length > 0 && this.seleccion.length === this.todosAbiertos.length
    },
  },
  watch: {
    slug: {
      immediate: true,
      handler() {
        this.cargarProyecto()
      },
    },
    // Cambio de nota dentro del mismo proyecto (cargarProyecto ya carga la inicial)
    notaPath(path) {
      if (path && this.proyecto && !this.cargando) this.cargarNota(path)
    },
    ultimaActividadNotas(actividad) {
      if (!actividad || actividad.project !== this.slug) return
      this.cargarProyecto({ silencioso: true })
    },
  },
  methods: {
    rutaNota(path) {
      const project = path.includes('/') ? path.split('/')[0] : null
      if (!project) return { name: 'proyectos' }
      return { name: 'proyecto', params: { slug: project }, query: { nota: path } }
    },
    async cargarProyecto({ silencioso = false } = {}) {
      if (!silencioso) {
        this.cargando = true
        this.proyecto = null
        this.nota = null
      }
      this.error = ''
      try {
        const { data } = await api.get(`/notes/projects/${encodeURIComponent(this.slug)}`)
        this.proyecto = data.project
        this.notas = data.notes
        this.todos = data.todos
        this.tareas = data.tasks
        this.seleccion = this.seleccion.filter((k) => this.todosAbiertos.some((t) => t.key === k))
        if (this.notaPath) await this.cargarNota(this.notaPath, { silencioso })
      } catch (error) {
        this.error =
          error.response && error.response.status === 404
            ? 'Este proyecto no existe en el vault.'
            : 'No se pudo cargar el proyecto.'
      } finally {
        this.cargando = false
      }
    },
    async cargarNota(path, { silencioso = false } = {}) {
      if (!silencioso) this.cargandoNota = true
      try {
        const { data } = await api.get('/notes', { params: { path } })
        this.nota = data.note
        this.backlinks = data.backlinks
        this.$nextTick(() => {
          if (this.$route.hash) this.irA(this.$route.hash.slice(1))
          else if (!silencioso) window.scrollTo({ top: 0 })
        })
      } catch {
        this.nota = {
          path,
          title: path,
          body: '_Esta nota ya no existe en el vault._',
          headings: [],
        }
        this.backlinks = []
      } finally {
        this.cargandoNota = false
      }
    },
    irA(id) {
      const el = this.$el.querySelector(`.markdown-body [id="${CSS.escape(id)}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    // Enlaces dentro de la nota: wikilinks → router, anclas → scroll
    onClickNota(event) {
      const link = event.target.closest('a')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (href.startsWith('obsidian-roto:')) {
        event.preventDefault()
      } else if (href.startsWith('obsidian:')) {
        event.preventDefault()
        const { path, anchor } = parseObsidianHref(href)
        const ruta = { ...this.rutaNota(path), hash: anchor ? `#${anchor}` : '' }
        if (path === this.notaPath && anchor) this.irA(anchor)
        else this.$router.push(ruta).catch(() => {})
      } else if (href.startsWith('#')) {
        event.preventDefault()
        this.irA(decodeURIComponent(href.slice(1)))
      }
    },
    toggleTodos() {
      this.seleccion = this.todosSeleccionados ? [] : this.todosAbiertos.map((t) => t.key)
    },
    async importar() {
      this.importando = true
      try {
        const { data } = await api.post(
          `/notes/projects/${encodeURIComponent(this.slug)}/import-tasks`,
          {
            keys: this.seleccion,
          }
        )
        this.seleccion = []
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          timer: 3000,
          showConfirmButton: false,
          icon: 'success',
          title: `${data.tasks.length} tarea(s) creada(s)`,
        })
        await this.cargarProyecto({ silencioso: true })
        this.$store.dispatch('getProyectos', { force: true })
      } catch (error) {
        Swal.fire('Error', 'No se pudieron importar las tareas.', 'error')
        console.error('Error al importar:', error.message)
      } finally {
        this.importando = false
      }
    },
    verTareas() {
      this.$store.commit('setProyectoFiltro', this.slug)
      this.$router.push({ name: 'checklist' })
    },
  },
}
</script>

<style scoped>
.pj-back {
  display: inline-block;
  font-size: var(--fs-sm);
  color: var(--text-3);
  margin-bottom: 12px;
  text-decoration: none !important;
}
.pj-back:hover {
  color: var(--accent);
}

.pj-header {
  margin-bottom: 18px;
}
.pj-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pj-title h1 {
  margin: 0;
}
.pj-estado {
  font-size: var(--fs-xs);
  padding: 3px 10px;
  border-radius: 999px;
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
.pj-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: var(--fs-xs);
  color: var(--text-3);
  margin: 8px 0 0;
}
.pj-meta i {
  margin-right: 4px;
}
.pj-resumen {
  font-size: var(--fs-sm);
  color: var(--text-2);
  margin: 8px 0 0;
  max-width: 900px;
}

.pj-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 14px;
}
.pj-panel h4 {
  font-size: var(--fs-sm);
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--text);
}
.pj-panel h4 small {
  color: var(--text-3);
  font-weight: 400;
  margin-left: 4px;
}
.pj-muted {
  font-size: var(--fs-xs);
  color: var(--text-3);
  margin: 0;
}

.pj-folder {
  font-size: var(--fs-xs);
  color: var(--text-3);
  margin: 10px 0 4px;
}
.pj-note-link,
.pj-toc a {
  display: block;
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--fs-sm);
  color: var(--text-2);
  text-decoration: none !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pj-note-link.indent {
  padding-left: 18px;
}
.pj-note-link:hover,
.pj-toc a:hover {
  background: var(--accent-soft);
  color: var(--text);
}
.pj-note-link.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
.pj-toc a {
  font-size: var(--fs-xs);
  padding: 3px 8px;
}
.pj-toc a.toc-3 {
  padding-left: 20px;
}

.pj-viewer {
  min-height: 300px;
}
.pj-note-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-xs);
  color: var(--text-3);
}
.pj-path {
  font-family: var(--font-mono);
}

.pj-backlinks {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.pj-backlinks h5 {
  font-size: var(--fs-xs);
  color: var(--text-3);
  margin-bottom: 8px;
}
.pj-backlinks a {
  display: block;
  font-size: var(--fs-sm);
  padding: 3px 0;
  color: var(--accent);
}
.pj-backlinks small {
  color: var(--text-3);
  font-family: var(--font-mono);
  margin-left: 6px;
}

.pj-todo {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: var(--fs-sm);
  color: var(--text);
  padding: 5px 0;
  margin: 0;
  cursor: pointer;
}
.pj-todo input {
  margin-top: 3px;
  flex-shrink: 0;
}
.pj-todo small {
  display: block;
  color: var(--text-3);
  font-size: var(--fs-xs);
}
.pj-todo.importada {
  opacity: 0.5;
  cursor: default;
}
.pj-todo-all {
  color: var(--text-3);
  font-size: var(--fs-xs);
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}

.pj-tasks {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
}
.pj-tasks li {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: var(--fs-sm);
  padding: 4px 0;
}
.pj-tasks li span {
  flex: 1;
}
.pj-tasks li i {
  color: var(--text-3);
  font-size: var(--fs-xs);
}
.pj-tasks li.hecha span {
  text-decoration: line-through;
  color: var(--text-3);
}
.pj-tasks li.hecha i {
  color: var(--success);
}
.pj-tasks small {
  font-size: var(--fs-xs);
  text-transform: uppercase;
}
.prio-alta {
  color: var(--danger);
}
.prio-media {
  color: var(--warning);
}
.prio-relax {
  color: var(--success);
}
.pj-task-actions {
  display: flex;
  gap: 6px;
}

/* ── Markdown renderizado (contenido v-html: estilos sin scope) ── */
.markdown-body {
  font-size: var(--fs-base);
  line-height: 1.65;
  color: var(--text);
  overflow-wrap: break-word;
}
.markdown-body >>> h1 {
  font-size: var(--fs-xl);
  margin: 0 0 16px;
}
.markdown-body >>> h2 {
  font-size: var(--fs-lg);
  margin: 28px 0 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.markdown-body >>> h3 {
  font-size: var(--fs-md);
  margin: 22px 0 10px;
}
.markdown-body >>> h4,
.markdown-body >>> h5,
.markdown-body >>> h6 {
  font-size: var(--fs-base);
  margin: 18px 0 8px;
}
.markdown-body >>> h1,
.markdown-body >>> h2,
.markdown-body >>> h3 {
  scroll-margin-top: 80px;
}
.markdown-body >>> p,
.markdown-body >>> ul,
.markdown-body >>> ol {
  margin: 0 0 12px;
}
.markdown-body >>> a {
  color: var(--accent);
}
.markdown-body >>> a.wikilink {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px dashed var(--accent-border);
}
.markdown-body >>> a.wikilink-roto {
  color: var(--danger);
  cursor: not-allowed;
}
.markdown-body >>> code {
  font-family: var(--font-mono);
  font-size: 0.82em;
  background: var(--bg-hover);
  color: #9a3412;
  padding: 1px 5px;
  border-radius: 4px;
}
.markdown-body >>> pre {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  overflow-x: auto;
  margin: 0 0 14px;
}
.markdown-body >>> pre code {
  background: none;
  padding: 0;
  color: var(--text);
  font-size: var(--fs-xs);
}
.markdown-body >>> blockquote {
  border-left: 3px solid var(--accent);
  margin: 0 0 12px;
  padding: 4px 12px;
  color: var(--text-2);
  background: var(--accent-soft);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.markdown-body >>> blockquote p:last-child {
  margin-bottom: 0;
}
.markdown-body >>> table {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 0 0 14px;
  font-size: var(--fs-sm);
}
.markdown-body >>> th,
.markdown-body >>> td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  vertical-align: top;
}
.markdown-body >>> th {
  background: var(--bg-subtle);
  text-align: left;
}
.markdown-body >>> hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 20px 0;
}
.markdown-body >>> li.task-item {
  list-style: none;
  margin-left: -1.2em;
}
.markdown-body >>> .task-checkbox {
  margin-right: 6px;
  vertical-align: middle;
}
</style>
