<template>
  <aside class="sidebar" :class="{ open }" aria-label="Navegación principal">
    <div class="sidebar-brand">
      <span class="brand-mark"><i class="fas fa-building"></i></span>
      <span class="brand-name">Intranet</span>
    </div>

    <nav class="sidebar-nav">
      <div v-for="seccion in secciones" :key="seccion.titulo">
        <p class="nav-section">{{ seccion.titulo }}</p>
        <router-link
          v-for="item in seccion.items"
          :key="item.to.name"
          :to="item.to"
          :exact="item.exact"
          class="nav-item"
          active-class="active"
          @click.native="$emit('navigate')"
        >
          <i :class="item.icon" aria-hidden="true"></i>
          <span>{{ item.title }}</span>
        </router-link>
      </div>
    </nav>

    <div class="sidebar-footer">Intranet v{{ version }}</div>
  </aside>
</template>

<script>
import { mapState } from 'vuex'
import packageInfo from '../../../package.json'

export default {
  name: 'AppSidebar',
  props: {
    open: { type: Boolean, default: false },
  },
  data() {
    return { version: packageInfo.version }
  },
  computed: {
    ...mapState(['usuario']),
    secciones() {
      const secciones = [
        {
          titulo: 'General',
          items: [
            { title: 'Dashboard', icon: 'fas fa-chart-pie', to: { name: 'dashboard' } },
            { title: 'Tareas', icon: 'fas fa-list-check', to: { name: 'checklist' } },
            { title: 'Documentos', icon: 'fas fa-folder-open', to: { name: 'drive' } },
            { title: 'Chat', icon: 'fas fa-comments', to: { name: 'chat' } },
          ],
        },
      ]
      if (this.usuario && this.usuario.isAdmin) {
        secciones.push({
          titulo: 'Trabajo',
          items: [
            { title: 'Project Manager', icon: 'fas fa-diagram-project', to: { name: 'pm-tareas' } },
            { title: 'Todoist', icon: 'fas fa-square-check', to: { name: 'todoist' } },
            { title: 'Horas', icon: 'fas fa-business-time', to: { name: 'horas' } },
            { title: 'Presupuestos', icon: 'fas fa-wallet', to: { name: 'presupuestos' } },
            { title: 'Snippets', icon: 'fas fa-code', to: { name: 'snippets' } },
            { title: 'Cron', icon: 'fas fa-clock-rotate-left', to: { name: 'cron' } },
          ],
        })
        secciones.push({
          titulo: 'Conocimiento',
          items: [{ title: 'Proyectos', icon: 'fas fa-book', to: { name: 'proyectos' } }],
        })
      }
      secciones.push({
        titulo: 'Cuenta',
        items: [{ title: 'Mi perfil', icon: 'fas fa-user', to: { name: 'home' }, exact: true }],
      })
      return secciones
    },
  },
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--sidebar-w);
  background: var(--navy-800);
  color: var(--text-on-dark);
  display: flex;
  flex-direction: column;
  z-index: 40;
  transition: transform 0.2s ease;
}
.sidebar-brand {
  height: var(--topbar-h);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 0 var(--sp-5);
  background: var(--navy-900);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}
.brand-name {
  font-size: var(--fs-md);
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.01em;
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-2) var(--sp-3) var(--sp-4);
}
.nav-section {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-on-dark-2);
  opacity: 0.75;
  margin: var(--sp-4) var(--sp-3) var(--sp-2);
}
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 9px var(--sp-3);
  border-radius: var(--radius-sm);
  color: var(--text-on-dark-2);
  font-size: var(--fs-base);
  font-weight: 500;
  text-decoration: none;
  margin-bottom: 2px;
  transition:
    background var(--transition),
    color var(--transition);
}
.nav-item i {
  width: 18px;
  text-align: center;
  font-size: 14px;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  text-decoration: none;
}
.nav-item.active {
  background: var(--navy-700);
  color: #fff;
  box-shadow: inset 3px 0 0 var(--accent);
}
.sidebar-footer {
  padding: var(--sp-3) var(--sp-5);
  font-size: var(--fs-xs);
  color: var(--text-on-dark-2);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

@media (max-width: 991px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar.open {
    transform: none;
    box-shadow: var(--shadow-lg);
  }
}
</style>
