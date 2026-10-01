<template>
  <header class="topbar">
    <button
      class="btn btn-ghost btn-icon menu-btn"
      aria-label="Abrir menú"
      @click="$emit('toggle-menu')"
    >
      <i class="fas fa-bars"></i>
    </button>
    <nav class="breadcrumbs truncate" aria-label="Ruta">
      <router-link v-if="padre" :to="{ name: padre.name }" class="crumb">{{
        padre.title
      }}</router-link>
      <i v-if="padre" class="fas fa-chevron-right sep" aria-hidden="true"></i>
      <span class="crumb actual" aria-current="page">{{ titulo }}</span>
    </nav>

    <div ref="menu" class="user-menu">
      <button
        class="user-btn"
        :aria-expanded="abierto ? 'true' : 'false'"
        aria-haspopup="menu"
        @click="abierto = !abierto"
      >
        <img :src="avatar" alt="" class="avatar" width="30" height="30" @error="onAvatarError" />
        <span class="user-name">{{ usuario.nombre }}</span>
        <i class="fas fa-chevron-down caret"></i>
      </button>
      <div v-if="abierto" class="dropdown" role="menu">
        <div class="dropdown-head">
          <strong class="truncate">{{ usuario.nombre }}</strong>
          <span class="truncate">{{ usuario.email }}</span>
          <span v-if="usuario.isAdmin" class="badge-soft tone-accent">Administrador</span>
        </div>
        <router-link
          :to="{ name: 'home' }"
          class="dropdown-item"
          role="menuitem"
          @click.native="abierto = false"
        >
          <i class="fas fa-user"></i> Mi perfil
        </router-link>
        <a
          v-if="usuario.isAdmin"
          :href="docsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="dropdown-item"
          role="menuitem"
          @click="abierto = false"
        >
          <i class="fas fa-code"></i> Documentación de la API
        </a>
        <button class="dropdown-item" role="menuitem" @click="cerrarSesion">
          <i class="fas fa-arrow-right-from-bracket"></i> Cerrar sesión
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import { fileUrl, API_ORIGIN, NO_IMAGE } from '@/utils/url'

export default {
  name: 'AppTopbar',
  data() {
    return { abierto: false, docsUrl: `${API_ORIGIN}/api/docs` }
  },
  computed: {
    ...mapState(['usuario']),
    titulo() {
      return this.$route.meta.title || ''
    },
    padre() {
      const name = this.$route.meta.parent
      if (!name) return null
      const route = this.$router.resolve({ name }).route
      return { name, title: route.meta.title }
    },
    avatar() {
      return fileUrl(this.usuario.foto)
    },
  },
  watch: {
    $route() {
      this.abierto = false
    },
  },
  methods: {
    ...mapActions(['cerrarSesion']),
    onClickFuera(e) {
      if (this.abierto && !this.$refs.menu.contains(e.target)) this.abierto = false
    },
    onAvatarError(e) {
      if (!e.target.src.endsWith(NO_IMAGE)) e.target.src = NO_IMAGE
    },
  },
  mounted() {
    document.addEventListener('click', this.onClickFuera)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.onClickFuera)
  },
}
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--topbar-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 0 var(--sp-6);
}
.menu-btn {
  display: none;
}
.breadcrumbs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
}
.crumb {
  color: var(--text-3);
}
a.crumb:hover {
  color: var(--accent);
  text-decoration: none;
}
.crumb.actual {
  color: var(--text);
  font-weight: 500;
}
.sep {
  font-size: 9px;
  color: var(--border-strong);
}
.user-menu {
  position: relative;
}
.user-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: 4px 8px 4px 4px;
  cursor: pointer;
  color: var(--text);
}
.user-btn:hover {
  background: var(--bg-hover);
}
.user-name {
  font-size: var(--fs-sm);
  font-weight: 500;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.caret {
  font-size: 10px;
  color: var(--text-3);
}
.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  width: 260px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: var(--sp-1);
  z-index: 50;
}
.dropdown-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: var(--sp-3);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--sp-1);
}
.dropdown-head strong {
  font-size: var(--fs-base);
  max-width: 100%;
}
.dropdown-head span.truncate {
  font-size: var(--fs-xs);
  color: var(--text-3);
  max-width: 100%;
}
.dropdown-head .badge-soft {
  margin-top: var(--sp-2);
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 8px var(--sp-3);
  font-size: var(--fs-sm);
  color: var(--text);
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  text-align: left;
  cursor: pointer;
}
.dropdown-item i {
  width: 16px;
  color: var(--text-3);
}
.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text);
  text-decoration: none;
}

@media (max-width: 991px) {
  .menu-btn {
    display: inline-flex;
  }
  .topbar {
    padding: 0 var(--sp-4);
  }
}
@media (max-width: 575px) {
  .user-name,
  .caret {
    display: none;
  }
}
</style>
