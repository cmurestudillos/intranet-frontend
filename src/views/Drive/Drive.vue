<template>
  <div>
    <PageHeader title="Documentos" subtitle="Archivos privados: solo tú puedes verlos.">
      <button class="btn btn-primary" @click="$refs.input.click()">
        <i class="fas fa-upload"></i> Subir archivos
      </button>
    </PageHeader>

    <input ref="input" type="file" multiple class="d-none" :accept="ACCEPT" @change="onSeleccion" />

    <!-- Zona de subida -->
    <section
      class="dropzone"
      :class="{ activa: arrastrando }"
      @dragenter.prevent="arrastrando = true"
      @dragover.prevent="arrastrando = true"
      @dragleave.prevent="arrastrando = false"
      @drop.prevent="onDrop"
    >
      <i class="fas fa-cloud-arrow-up"></i>
      <p>
        Arrastra archivos aquí o
        <button type="button" class="link-btn" @click="$refs.input.click()">selecciónalos</button>
      </p>
      <span class="form-hint">
        Imágenes, PDF, Word, Excel, TXT, CSV, Markdown o JSON · máx. {{ limites.documentoMB }} MB
        por archivo
      </span>
    </section>

    <!-- Cola de subida -->
    <AppPanel v-if="cola.length" title="Subidas" :count="cola.length" flush>
      <template #actions>
        <button class="btn btn-ghost btn-sm" :disabled="subiendo" @click="limpiarCola">
          Limpiar
        </button>
      </template>
      <ul class="cola">
        <li v-for="item in cola" :key="item.id">
          <i :class="icono(item.file.type)" class="tipo-icono"></i>
          <div class="cola-info">
            <span class="truncate">{{ item.file.name }}</span>
            <div v-if="item.estado === 'subiendo'" class="barra">
              <span :style="{ width: item.progreso + '%' }"></span>
            </div>
            <span v-else-if="item.error" class="form-error">{{ item.error }}</span>
          </div>
          <span class="muted tabular tam">{{ tamano(item.file.size) }}</span>
          <span class="badge-soft" :class="tonoEstado[item.estado]">{{ textoEstado(item) }}</span>
        </li>
      </ul>
    </AppPanel>

    <!-- Archivos -->
    <AppPanel title="Mis archivos" :count="documentos.length" flush>
      <template #actions>
        <div class="segmented">
          <button
            v-for="f in filtros"
            :key="f.value"
            :class="{ active: filtro === f.value }"
            @click="filtro = f.value"
          >
            {{ f.text }}
          </button>
        </div>
        <div class="input-icon buscador">
          <i class="fas fa-magnifying-glass"></i>
          <input
            v-model="texto"
            type="search"
            class="form-control form-control-sm"
            placeholder="Buscar por nombre…"
            aria-label="Buscar archivos"
          />
        </div>
      </template>

      <Loading :carga="cargando" mensaje="Cargando archivos…" />
      <template v-if="!cargando">
        <EmptyState
          v-if="!filtrados.length"
          icon="far fa-folder-open"
          :title="documentos.length ? 'Ningún archivo coincide' : 'Todavía no has subido archivos'"
          :text="
            documentos.length
              ? 'Prueba con otra búsqueda o filtro.'
              : 'Usa «Subir archivos» o arrástralos a la zona superior.'
          "
        />
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Subido</th>
                <th class="col-actions"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in filtrados" :key="doc.id">
                <td>
                  <div class="archivo">
                    <img
                      v-if="esImagen(doc.tipo)"
                      :src="url(doc)"
                      alt=""
                      class="miniatura"
                      loading="lazy"
                    />
                    <i v-else :class="icono(doc.tipo)" class="tipo-icono"></i>
                    <a :href="url(doc)" target="_blank" rel="noopener noreferrer" class="truncate">
                      {{ doc.nombre }}
                    </a>
                  </div>
                </td>
                <td class="muted">{{ etiquetaTipo(doc.tipo) }}</td>
                <td class="muted fecha" :title="doc.fecha | moment('LLL')">
                  {{ doc.fecha | moment('from') }}
                </td>
                <td class="col-actions">
                  <button
                    v-if="esImagen(doc.tipo)"
                    class="btn btn-ghost btn-icon"
                    title="Vista previa"
                    aria-label="Vista previa"
                    @click="previsualizar(doc)"
                  >
                    <i class="far fa-eye"></i>
                  </button>
                  <a
                    :href="descarga(doc)"
                    class="btn btn-ghost btn-icon"
                    title="Descargar"
                    aria-label="Descargar"
                  >
                    <i class="fas fa-download"></i>
                  </a>
                  <button
                    class="btn btn-ghost btn-icon danger"
                    title="Eliminar"
                    aria-label="Eliminar"
                    @click="eliminar(doc)"
                  >
                    <i class="far fa-trash-can"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </AppPanel>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Swal from 'sweetalert2'
import api from '@/api'
import { fileUrl, downloadUrl } from '@/utils/url'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Loading from '@/components/Loading.vue'

// Debe coincidir con la lista del backend (routes/documents.js)
const TIPOS = {
  'image/jpeg': 'Imagen JPG',
  'image/jpg': 'Imagen JPG',
  'image/png': 'Imagen PNG',
  'image/webp': 'Imagen WebP',
  'image/gif': 'Imagen GIF',
  'image/svg+xml': 'Imagen SVG',
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'text/plain': 'Texto',
  'text/csv': 'CSV',
  'text/markdown': 'Markdown',
  'application/json': 'JSON',
}
// Algunos navegadores no informan el MIME de .md/.csv: se deduce por extensión
const POR_EXTENSION = {
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  txt: 'text/plain',
}

let siguienteId = 0

export default {
  name: 'Drive',
  components: { PageHeader, AppPanel, EmptyState, Loading },
  data() {
    return {
      ACCEPT: Object.keys(TIPOS).join(',') + ',.md,.csv,.json,.txt,.docx,.xlsx',
      cargando: true,
      arrastrando: false,
      subiendo: false,
      cola: [],
      texto: '',
      filtro: '',
      filtros: [
        { value: '', text: 'Todos' },
        { value: 'imagenes', text: 'Imágenes' },
        { value: 'documentos', text: 'Documentos' },
      ],
      tonoEstado: {
        pendiente: '',
        subiendo: 'tone-accent',
        ok: 'tone-success',
        error: 'tone-danger',
      },
    }
  },
  computed: {
    ...mapState(['documentos', 'limites']),
    filtrados() {
      const q = this.texto.trim().toLowerCase()
      return this.documentos.filter((d) => {
        if (q && !d.nombre.toLowerCase().includes(q)) return false
        if (this.filtro === 'imagenes') return this.esImagen(d.tipo)
        if (this.filtro === 'documentos') return !this.esImagen(d.tipo)
        return true
      })
    },
  },
  methods: {
    url(doc) {
      return fileUrl(doc.url)
    },
    descarga(doc) {
      return downloadUrl(doc.url, doc.nombre)
    },
    esImagen(tipo) {
      return /^image\//.test(tipo || '')
    },
    etiquetaTipo(tipo) {
      return TIPOS[tipo] || tipo
    },
    icono(tipo) {
      if (this.esImagen(tipo)) return 'far fa-file-image'
      if (tipo === 'application/pdf') return 'far fa-file-pdf'
      if (/spreadsheet|csv/.test(tipo)) return 'far fa-file-excel'
      if (/wordprocessing/.test(tipo)) return 'far fa-file-word'
      if (/json|markdown/.test(tipo)) return 'far fa-file-code'
      return 'far fa-file-lines'
    },
    tamano(bytes) {
      return bytes > 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.max(1, Math.ceil(bytes / 1024))} KB`
    },
    textoEstado(item) {
      return { pendiente: 'En cola', subiendo: `${item.progreso}%`, ok: 'Subido', error: 'Error' }[
        item.estado
      ]
    },
    tipoDe(file) {
      if (file.type && TIPOS[file.type]) return file.type
      const ext = file.name.split('.').pop().toLowerCase()
      return POR_EXTENSION[ext] || file.type
    },
    onSeleccion(e) {
      this.encolar([...e.target.files])
      e.target.value = ''
    },
    onDrop(e) {
      this.arrastrando = false
      this.encolar([...e.dataTransfer.files])
    },
    // Valida en el cliente y sube en cuanto se añaden
    encolar(files) {
      const maxBytes = this.limites.documentoMB * 1024 * 1024
      for (const file of files) {
        const tipo = this.tipoDe(file)
        let error = ''
        if (!TIPOS[tipo]) error = 'Tipo de archivo no permitido'
        else if (file.size > maxBytes) error = `Supera el máximo de ${this.limites.documentoMB} MB`
        this.cola.push({
          id: ++siguienteId,
          file,
          tipo,
          progreso: 0,
          estado: error ? 'error' : 'pendiente',
          error,
        })
      }
      this.procesarCola()
    },
    async procesarCola() {
      if (this.subiendo) return
      this.subiendo = true
      let alguno = false
      for (const item of this.cola) {
        if (item.estado !== 'pendiente') continue
        item.estado = 'subiendo'
        try {
          const formData = new FormData()
          formData.append('file', new File([item.file], item.file.name, { type: item.tipo }))
          await api.post('/documents/upload', formData, {
            onUploadProgress: (e) => {
              if (e.total) item.progreso = Math.round((e.loaded / e.total) * 100)
            },
          })
          item.estado = 'ok'
          alguno = true
        } catch (error) {
          item.estado = 'error'
          const res = error.response
          item.error =
            (res && res.data && res.data.message) ||
            (res && res.status === 413
              ? 'El archivo es demasiado grande'
              : 'No se pudo subir el archivo')
        }
      }
      this.subiendo = false
      if (alguno) await this.$store.dispatch('getDocumentos')
      // Las subidas correctas desaparecen de la cola al cabo de unos segundos
      setTimeout(() => {
        this.cola = this.cola.filter((i) => i.estado !== 'ok')
      }, 4000)
    },
    limpiarCola() {
      this.cola = this.cola.filter((i) => i.estado === 'subiendo')
    },
    previsualizar(doc) {
      Swal.fire({
        imageUrl: this.url(doc),
        imageAlt: doc.nombre,
        title: doc.nombre,
        width: 720,
        showCloseButton: true,
        showConfirmButton: false,
      })
    },
    async eliminar(doc) {
      const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar este archivo?',
        text: `«${doc.nombre}» se borrará de forma permanente.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: { confirmButton: 'btn-confirm-danger' },
      })
      if (isConfirmed) this.$store.dispatch('eliminarDocumento', doc)
    },
  },
  async created() {
    this.$store.dispatch('getLimites')
    await this.$store.dispatch('getDocumentos')
    this.cargando = false
  },
}
</script>

<style scoped>
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-6) var(--sp-4);
  margin-bottom: var(--sp-6);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  background: var(--bg-surface);
  text-align: center;
  transition:
    border-color var(--transition),
    background var(--transition);
}
.dropzone.activa {
  border-color: var(--accent);
  background: var(--accent-soft);
}
.dropzone > i {
  font-size: 24px;
  color: var(--accent);
  margin-bottom: var(--sp-1);
}
.dropzone p {
  margin: 0;
  font-size: var(--fs-base);
  font-weight: 500;
}
.link-btn {
  border: 0;
  background: none;
  padding: 0;
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
}
.link-btn:hover {
  text-decoration: underline;
}
.cola {
  list-style: none;
  margin: 0;
  padding: 0;
}
.cola li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px var(--sp-5);
  border-bottom: 1px solid var(--border);
  font-size: var(--fs-sm);
}
.cola li:last-child {
  border-bottom: 0;
}
.cola-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cola .form-error {
  margin: 0;
}
.tam {
  white-space: nowrap;
}
.barra {
  height: 4px;
  background: var(--bg-hover);
  border-radius: 2px;
  overflow: hidden;
}
.barra span {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 0.2s;
}
.buscador {
  width: 220px;
}
.archivo {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-width: 0;
  max-width: 520px;
}
.archivo a {
  color: var(--text);
  font-weight: 500;
}
.archivo a:hover {
  color: var(--accent);
}
.tipo-icono {
  width: 28px;
  font-size: 18px;
  text-align: center;
  color: var(--text-3);
  flex-shrink: 0;
}
.miniatura {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.fecha {
  white-space: nowrap;
}
@media (max-width: 640px) {
  .buscador {
    width: 100%;
  }
}
</style>
