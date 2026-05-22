<template>
  <nav>
    <!-- Top bar -->
    <v-toolbar app>
      <v-btn icon @click="drawer = !drawer">
        <i class="fas fa-bars"></i>
      </v-btn>
      <v-toolbar-title>
        <span class="brand-name">INTRANET</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn flat @click="cerrarSesion" class="logout-btn">
        <i class="fas fa-power-off mr-1"></i>
        <span class="hidden-xs-only">Cerrar sesión</span>
      </v-btn>
    </v-toolbar>

    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" app class="sidebar-drawer">
      <!-- Perfil -->
      <div class="sidebar-profile">
        <div class="sidebar-avatar-wrap">
          <img :src="avatarSrc" @error="onAvatarError" alt="avatar" class="sidebar-avatar-img" />
        </div>
        <p class="sidebar-name">{{ usuario.nombre || 'Usuario' }}</p>
        <span class="sidebar-email">{{ usuario.email }}</span>
      </div>

      <v-divider class="sidebar-divider"></v-divider>

      <!-- Menú de navegación -->
      <v-list class="sidebar-list">
        <v-list-tile
          v-for="(item, index) in items"
          :key="index"
          :to="item.to"
          active-class="sidebar-item-active"
          class="sidebar-item"
        >
          <v-list-tile-action>
            <i :class="[item.icon, 'sidebar-icon']"></i>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title class="sidebar-item-title">{{ item.title }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>

      <!-- Footer -->
      <div class="sidebar-footer">
        <p class="footer-copy">
          <strong>© Carlos Mur</strong>
        </p>
        <p class="footer-version">v{{ version }}</p>
      </div>
    </v-navigation-drawer>
  </nav>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import packageInfo from '../../package.json'

export default {
  data() {
    return {
      drawer: true,
      version: packageInfo.version,
      items: [
        { title: 'Perfil', icon: 'fas fa-user-circle', to: { name: 'home' } },
        { title: 'Dashboard', icon: 'fas fa-chart-line', to: { name: 'dashboard' } },
        { title: 'Chat', icon: 'fas fa-comments', to: { name: 'chat' } },
        { title: 'Tareas', icon: 'fas fa-check-square', to: { name: 'checklist' } },
        { title: 'Drive', icon: 'fas fa-cloud-upload-alt', to: { name: 'drive' } },
      ],
    }
  },
  computed: {
    ...mapState(['usuario']),
    avatarSrc() {
      const foto = this.usuario && this.usuario.foto
      if (!foto) return '/assets/img/no_image.png'
      if (foto.startsWith('http')) return foto
      return (process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000') + foto
    },
  },
  methods: {
    ...mapActions(['cerrarSesion']),
    onAvatarError(e) {
      e.target.src = '/assets/img/no_image.png'
    },
  },
}
</script>

<style scoped>
/* Brand gradient */
.brand-name {
  font-family: 'Inter', sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  background: linear-gradient(135deg, #818cf8 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logout-btn {
  font-family: 'Inter', sans-serif !important;
  font-size: 0.78rem !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: 0.02em !important;
}

/* Sidebar profile section */
.sidebar-drawer {
  display: flex;
  flex-direction: column;
}

.sidebar-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 20px;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.07) 0%, transparent 100%);
  text-align: center;
}

.sidebar-avatar-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  overflow: hidden;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.sidebar-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sidebar-name {
  font-family: 'Inter', sans-serif !important;
  font-weight: 600 !important;
  font-size: 0.88rem !important;
  color: #e2e8f0 !important;
  margin: 0 0 4px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.sidebar-email {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  display: block;
}

.sidebar-divider {
  margin: 0 16px !important;
  border-color: rgba(99, 102, 241, 0.12) !important;
}

/* Nav list */
.sidebar-list {
  padding: 8px !important;
}

.sidebar-item {
  border-radius: 8px !important;
  margin-bottom: 2px !important;
  transition: all 0.2s ease !important;
}

.sidebar-item:hover {
  background: rgba(99, 102, 241, 0.1) !important;
}

.sidebar-item-active {
  background: rgba(99, 102, 241, 0.14) !important;
  border-left: 3px solid #6366f1 !important;
}

.sidebar-icon {
  font-size: 0.85rem !important;
  color: #64748b !important;
  transition: color 0.2s ease !important;
  width: 18px;
}

.sidebar-item:hover .sidebar-icon,
.sidebar-item-active .sidebar-icon {
  color: #818cf8 !important;
}

.sidebar-item-title {
  font-family: 'Inter', sans-serif !important;
  font-size: 0.84rem !important;
  font-weight: 500 !important;
  color: #94a3b8 !important;
  transition: color 0.2s ease !important;
}

.sidebar-item:hover .sidebar-item-title,
.sidebar-item-active .sidebar-item-title {
  color: #e2e8f0 !important;
}

/* Footer */
.sidebar-footer {
  margin-top: auto;
  padding: 16px 12px;
  border-top: 1px solid rgba(99, 102, 241, 0.08);
  text-align: center;
}

.sidebar-socials {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.sidebar-socials a {
  text-decoration: none;
}

.social-icon {
  font-size: 0.88rem !important;
  color: #475569 !important;
  transition: color 0.2s ease !important;
}

.sidebar-socials a:hover .social-icon {
  color: #818cf8 !important;
}

.footer-copy {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: #334155;
  margin: 0 0 4px;
}

.footer-copy a {
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
}

.footer-version {
  font-family: 'Inter', sans-serif;
  font-size: 0.65rem;
  color: #1e293b;
  margin: 0;
  letter-spacing: 0.05em;
}
</style>
