<template>
  <div>
    <PageHeader title="Snippets" subtitle="Biblioteca de código de snippets-manager-service">
      <button class="btn btn-secondary" :disabled="cargando" @click="cargar">
        <i class="fas fa-rotate" :class="{ 'fa-spin': cargando }"></i> Actualizar
      </button>
    </PageHeader>

    <p v-if="error" class="alert-inline tone-danger">
      <i class="fas fa-triangle-exclamation"></i> {{ error }}
    </p>

    <div class="grid-main-side">
      <div class="lista">
        <div class="filtros">
          <div class="input-icon buscar">
            <i class="fas fa-search"></i>
            <input
              v-model="q"
              type="search"
              class="form-control"
              placeholder="Buscar por descripción o código…"
              aria-label="Buscar snippets"
            />
          </div>
          <select v-model="lenguaje" class="custom-select lenguaje" aria-label="Lenguaje">
            <option value="">Todos los lenguajes ({{ snippets.length }})</option>
            <option v-for="l in lenguajes" :key="l.nombre" :value="l.nombre">
              {{ l.nombre }} ({{ l.count }})
            </option>
          </select>
        </div>

        <Loading :carga="cargando && !snippets.length" mensaje="Cargando snippets…" />
        <EmptyState
          v-if="!cargando && !error && !visibles.length"
          icon="fas fa-code"
          title="Sin snippets"
          :text="
            snippets.length ? 'Ningún snippet coincide con la búsqueda.' : 'Inserta el primero.'
          "
        />

        <article
          v-for="s in visibles.slice(0, limite)"
          :key="s.id"
          class="snippet"
          :class="{ editando: editando === s.id }"
        >
          <header>
            <span class="badge-soft tone-accent">{{ s.language }}</span>
            <h3 class="truncate" :title="s.description">{{ s.description }}</h3>
            <span class="estrellas" role="radiogroup" aria-label="Valoración">
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                :class="{ on: n <= s.rating }"
                :aria-label="`${n} estrellas`"
                @click="valorar(s, n === s.rating ? 0 : n)"
              >
                <i class="fa-star" :class="n <= s.rating ? 'fas' : 'far'"></i>
              </button>
            </span>
            <button
              class="btn btn-ghost btn-icon"
              title="Copiar"
              aria-label="Copiar"
              @click="copiar(s)"
            >
              <i class="far fa-copy"></i>
            </button>
            <button
              class="btn btn-ghost btn-icon"
              title="Editar"
              aria-label="Editar"
              @click="editar(s)"
            >
              <i class="fas fa-pen"></i>
            </button>
            <button
              class="btn btn-ghost btn-icon danger"
              title="Eliminar"
              aria-label="Eliminar"
              @click="eliminar(s)"
            >
              <i class="far fa-trash-can"></i>
            </button>
          </header>
          <pre class="mono"><code>{{ s.code }}</code></pre>
        </article>
        <button
          v-if="visibles.length > limite"
          type="button"
          class="btn btn-secondary mas"
          @click="limite += PAGINA"
        >
          Mostrar más ({{ visibles.length - limite }} restantes)
        </button>
      </div>

      <AppPanel :title="editando ? 'Editar snippet' : 'Insertar snippet'" class="formulario">
        <form novalidate @submit.prevent="guardar">
          <div class="form-group">
            <label for="s-lang">Lenguaje</label>
            <input
              id="s-lang"
              v-model.trim="form.language"
              class="form-control"
              list="s-lenguajes"
              placeholder="javascript, typescript, css…"
              required
            />
            <datalist id="s-lenguajes">
              <option v-for="l in lenguajes" :key="l.nombre" :value="l.nombre" />
            </datalist>
          </div>
          <div class="form-group">
            <label for="s-desc">Descripción</label>
            <input id="s-desc" v-model.trim="form.description" class="form-control" required />
          </div>
          <div class="form-group">
            <label for="s-code">Código</label>
            <textarea
              id="s-code"
              v-model="form.code"
              class="form-control mono codigo"
              rows="12"
              spellcheck="false"
              required
              @keydown.tab.prevent="tabular"
            ></textarea>
          </div>
          <p v-if="errorForm" class="form-error">{{ errorForm }}</p>
          <div class="botones">
            <button v-if="editando" type="button" class="btn btn-secondary" @click="cancelar">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="!formValido || guardando">
              <i class="fas" :class="editando ? 'fa-floppy-disk' : 'fa-plus'"></i>
              {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Insertar' }}
            </button>
          </div>
        </form>
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

const PAGINA = 20
const VACIO = () => ({ language: '', description: '', code: '' })

export default {
  name: 'Snippets',
  components: { Loading, PageHeader, AppPanel, EmptyState },
  data() {
    return {
      snippets: [],
      cargando: false,
      guardando: false,
      error: '',
      errorForm: '',
      q: '',
      lenguaje: '',
      PAGINA,
      limite: PAGINA,
      editando: null,
      form: VACIO(),
    }
  },
  computed: {
    lenguajes() {
      const counts = {}
      for (const s of this.snippets) counts[s.language] = (counts[s.language] || 0) + 1
      return Object.keys(counts)
        .sort()
        .map((nombre) => ({ nombre, count: counts[nombre] }))
    },
    visibles() {
      const q = this.q.trim().toLowerCase()
      return this.snippets
        .filter(
          (s) =>
            (!this.lenguaje || s.language === this.lenguaje) &&
            (!q || s.description.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
        )
        .sort((a, b) => b.rating - a.rating || new Date(b.fecha) - new Date(a.fecha))
    },
    formValido() {
      return this.form.language && this.form.description && this.form.code.trim()
    },
  },
  methods: {
    async cargar() {
      this.cargando = true
      this.error = ''
      try {
        const { data } = await api.get('/snippets')
        this.snippets = data.snippets
      } catch (error) {
        this.error = errorMsg(error, 'No se pudieron cargar los snippets')
      } finally {
        this.cargando = false
      }
    },
    // Tab inserta dos espacios en lugar de saltar al siguiente campo
    tabular(e) {
      const el = e.target
      const { selectionStart: ini, selectionEnd: fin } = el
      this.form.code = this.form.code.slice(0, ini) + '  ' + this.form.code.slice(fin)
      this.$nextTick(() => el.setSelectionRange(ini + 2, ini + 2))
    },
    editar(s) {
      this.editando = s.id
      this.form = { language: s.language, description: s.description, code: s.code }
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
          const { data } = await api.put(`/snippets/${this.editando}`, this.form)
          const i = this.snippets.findIndex((s) => s.id === this.editando)
          if (i >= 0) this.snippets.splice(i, 1, data.snippet)
          toast.fire({ icon: 'success', title: 'Snippet actualizado' })
        } else {
          const { data } = await api.post('/snippets', this.form)
          this.snippets.unshift(data.snippet)
          toast.fire({ icon: 'success', title: 'Snippet insertado' })
        }
        this.cancelar()
      } catch (error) {
        this.errorForm = errorMsg(error, 'No se pudo guardar el snippet')
      } finally {
        this.guardando = false
      }
    },
    async valorar(s, rating) {
      const anterior = s.rating
      s.rating = rating
      try {
        await api.patch(`/snippets/${s.id}/rating`, { rating })
      } catch (error) {
        s.rating = anterior
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo valorar') })
      }
    },
    async copiar(s) {
      try {
        await navigator.clipboard.writeText(s.code)
        toast.fire({ icon: 'success', title: 'Código copiado' })
      } catch {
        toast.fire({ icon: 'error', title: 'No se pudo copiar' })
      }
    },
    async eliminar(s) {
      if (!(await confirmar(`¿Eliminar «${s.description}»?`))) return
      try {
        await api.delete(`/snippets/${s.id}`)
        this.snippets = this.snippets.filter((x) => x.id !== s.id)
        if (this.editando === s.id) this.cancelar()
        toast.fire({ icon: 'success', title: 'Snippet eliminado' })
      } catch (error) {
        toast.fire({ icon: 'error', title: errorMsg(error, 'No se pudo eliminar') })
      }
    },
  },
  watch: {
    // Al cambiar el filtro se vuelve a la primera página
    q() {
      this.limite = PAGINA
    },
    lenguaje() {
      this.limite = PAGINA
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
  min-width: 220px;
}
.lenguaje {
  width: auto;
}
.snippet {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.snippet.editando {
  border-color: var(--accent);
  box-shadow: var(--focus-ring);
}
.snippet header {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 8px var(--sp-3) 8px var(--sp-4);
  border-bottom: 1px solid var(--border);
}
.snippet h3 {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--fs-base);
  font-weight: 500;
}
.snippet pre {
  margin: 0;
  padding: var(--sp-3) var(--sp-4);
  background: var(--bg-subtle);
  font-size: var(--fs-xs);
  line-height: 1.55;
  max-height: 260px;
  overflow: auto;
  white-space: pre;
  color: var(--text);
}
.estrellas {
  display: inline-flex;
}
.estrellas button {
  background: none;
  border: 0;
  padding: 2px;
  color: var(--border-strong);
  font-size: 12px;
}
.estrellas button.on {
  color: #d97706;
}
.estrellas:hover button {
  color: #d97706;
}
.estrellas button:hover ~ button {
  color: var(--border-strong);
}
.mas {
  align-self: center;
}
.formulario {
  position: sticky;
  top: calc(var(--topbar-h) + var(--sp-4));
}
.codigo {
  font-size: var(--fs-xs);
  line-height: 1.5;
  resize: vertical;
}
.botones {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
}
</style>
