<template>
  <div>
    <PageHeader title="Mi perfil" subtitle="Datos de tu cuenta y foto de perfil." />

    <div class="grid-2">
      <AppPanel title="Datos de la cuenta">
        <dl class="datos">
          <dt>Nombre</dt>
          <dd>{{ usuario.nombre }}</dd>
          <dt>Email</dt>
          <dd>{{ usuario.email }}</dd>
          <dt>Rol</dt>
          <dd>
            <span v-if="usuario.isAdmin" class="badge-soft tone-accent">Administrador</span>
            <span v-else class="badge-soft">Usuario</span>
          </dd>
        </dl>
      </AppPanel>

      <AppPanel title="Foto de perfil">
        <div class="avatar-editor">
          <img
            :src="preview || fotoActual"
            alt="Foto de perfil"
            class="avatar avatar-xl"
            width="96"
            height="96"
            @error="onAvatarError"
          />
          <div class="avatar-info">
            <p v-if="file" class="file-name truncate">
              <i class="far fa-image"></i> {{ file.name }}
              <span class="muted">· {{ tamano(file.size) }}</span>
            </p>
            <p class="form-hint">
              JPG, PNG o WebP. Máximo {{ limites.avatarMB }} MB. Se recomienda una imagen cuadrada.
            </p>
            <div class="avatar-actions">
              <input
                ref="input"
                type="file"
                class="d-none"
                accept="image/jpeg,image/png,image/webp"
                @change="seleccionar"
              />
              <button
                class="btn btn-secondary btn-sm"
                :disabled="loading"
                @click="$refs.input.click()"
              >
                <i class="fas fa-upload"></i> Seleccionar imagen
              </button>
              <template v-if="file">
                <button class="btn btn-primary btn-sm" :disabled="loading" @click="subir">
                  <span v-if="loading" class="spinner spinner-sm"></span>
                  {{ loading ? 'Guardando…' : 'Guardar' }}
                </button>
                <button class="btn btn-ghost btn-sm" :disabled="loading" @click="descartar">
                  Cancelar
                </button>
              </template>
            </div>
          </div>
        </div>
        <Mensaje v-if="aviso" :texto="aviso.texto" :tipo="aviso.tipo" class="mt-4 mb-0" />
      </AppPanel>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import api from '@/api'
import { fileUrl, NO_IMAGE } from '@/utils/url'
import PageHeader from '@/components/ui/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import Mensaje from '@/components/Mensaje.vue'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp']

export default {
  name: 'Home',
  components: { PageHeader, AppPanel, Mensaje },
  data() {
    return {
      file: null,
      preview: '',
      loading: false,
      aviso: null,
    }
  },
  computed: {
    ...mapState(['usuario', 'limites']),
    fotoActual() {
      return fileUrl(this.usuario.foto)
    },
  },
  methods: {
    tamano(bytes) {
      return bytes > 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
        : `${Math.ceil(bytes / 1024)} KB`
    },
    seleccionar(event) {
      const archivo = event.target.files[0]
      event.target.value = ''
      if (!archivo) return
      if (!TIPOS.includes(archivo.type)) {
        this.aviso = { tipo: 'error', texto: 'Formato no válido. Usa JPG, PNG o WebP.' }
        return
      }
      if (archivo.size > this.limites.avatarMB * 1024 * 1024) {
        this.aviso = {
          tipo: 'error',
          texto: `La imagen pesa ${this.tamano(archivo.size)}; el máximo es ${this.limites.avatarMB} MB.`,
        }
        return
      }
      this.descartar()
      this.file = archivo
      this.preview = URL.createObjectURL(archivo)
      this.aviso = null
    },
    descartar() {
      if (this.preview) URL.revokeObjectURL(this.preview)
      this.file = null
      this.preview = ''
    },
    async subir() {
      this.loading = true
      this.aviso = null
      try {
        const formData = new FormData()
        formData.append('avatar', this.file)
        const { data } = await api.put('/users/avatar', formData)
        this.$store.commit('nuevoUsuario', { ...this.usuario, foto: data.foto })
        this.descartar()
        this.aviso = { tipo: 'success', texto: 'Foto de perfil actualizada.' }
      } catch (error) {
        const msg = error.response && error.response.data && error.response.data.message
        this.aviso = {
          tipo: 'error',
          texto: msg || 'No se pudo subir la imagen. Inténtalo de nuevo.',
        }
      } finally {
        this.loading = false
      }
    },
    onAvatarError(e) {
      if (!e.target.src.endsWith(NO_IMAGE)) e.target.src = NO_IMAGE
    },
  },
  created() {
    this.$store.dispatch('getLimites')
  },
  beforeDestroy() {
    this.descartar()
  },
}
</script>

<style scoped>
.datos {
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: var(--sp-4);
  margin: 0;
}
.datos dt {
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--text-3);
}
.datos dd {
  margin: 0;
  font-size: var(--fs-base);
  min-width: 0;
  overflow-wrap: anywhere;
}
.avatar-editor {
  display: flex;
  gap: var(--sp-5);
  align-items: center;
}
.avatar-xl {
  width: 96px;
  height: 96px;
}
.avatar-info {
  min-width: 0;
  flex: 1;
}
.file-name {
  font-size: var(--fs-sm);
  font-weight: 500;
  margin: 0 0 var(--sp-1);
}
.avatar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
.spinner-sm {
  width: 12px;
  height: 12px;
  border-color: rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
}
@media (max-width: 480px) {
  .avatar-editor {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
