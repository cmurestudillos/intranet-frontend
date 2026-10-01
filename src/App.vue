<template>
  <div id="intranet" :class="{ 'with-shell': usuario }">
    <template v-if="usuario">
      <AppSidebar :open="menuAbierto" @navigate="menuAbierto = false" />
      <div v-if="menuAbierto" class="backdrop" @click="menuAbierto = false"></div>
      <div class="shell-main">
        <AppTopbar @toggle-menu="menuAbierto = !menuAbierto" />
        <main class="content">
          <router-view />
        </main>
      </div>
    </template>
    <router-view v-else />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { API_ORIGIN } from '@/utils/url'

const toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
})

const TIPOS = {
  creada: 'Nota creada',
  modificada: 'Nota actualizada',
  eliminada: 'Nota eliminada',
  sync: 'Vault sincronizado',
}

export default {
  name: 'App',
  components: { AppSidebar, AppTopbar },
  data() {
    return { notesSocket: null, menuAbierto: false }
  },
  computed: {
    ...mapState(['usuario']),
    esAdmin() {
      return !!(this.usuario && this.usuario.isAdmin)
    },
  },
  watch: {
    // Avisos de cambios en el vault de Obsidian (solo admin; en Vercel no hay sockets)
    esAdmin: {
      immediate: true,
      handler(esAdmin) {
        if (esAdmin) this.conectarNotas()
        else this.desconectarNotas()
      },
    },
  },
  methods: {
    conectarNotas() {
      if (this.notesSocket) return
      this.notesSocket = io(API_ORIGIN, {
        auth: { token: localStorage.getItem('token') },
        reconnectionAttempts: 3,
      })
      this.notesSocket.on('notes:changed', (actividad) => {
        this.$store.commit('setUltimaActividadNotas', actividad)
        this.$store.dispatch('getProyectos', { force: true })
        toast.fire({
          icon: actividad.tipo === 'eliminada' ? 'warning' : 'info',
          title: TIPOS[actividad.tipo] || 'Cambio en el vault',
          text: actividad.path || actividad.detalle,
        })
      })
      this.notesSocket.on('connect_error', () => {})
    },
    desconectarNotas() {
      if (!this.notesSocket) return
      this.notesSocket.disconnect()
      this.notesSocket = null
    },
  },
  beforeDestroy() {
    this.desconectarNotas()
  },
}
</script>

<style>
.with-shell .shell-main {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  padding: var(--sp-6);
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 34, 56, 0.45);
  z-index: 35;
}
@media (max-width: 991px) {
  .with-shell .shell-main {
    margin-left: 0;
  }
  .content {
    padding: var(--sp-4);
  }
}
</style>
