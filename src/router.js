import Vue from 'vue'
import Router from 'vue-router'
// Importación circular (store → router): solo se usa dentro del guard, en tiempo de ejecución
import store from './store'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ './views/Home.vue'),
      meta: { title: 'Mi perfil', requiresAuth: true },
    },
    {
      path: '/ingreso',
      name: 'ingreso',
      component: () => import(/* webpackChunkName: "ingreso" */ './views/Ingreso.vue'),
      meta: { title: 'Acceso' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () =>
        import(/* webpackChunkName: "dashboard" */ './views/Dashboard/DashBoard.vue'),
      meta: { title: 'Dashboard', requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import(/* webpackChunkName: "chat" */ './views/Chat.vue'),
      meta: { title: 'Chat', requiresAuth: true },
    },
    {
      path: '/checklist',
      name: 'checklist',
      component: () => import(/* webpackChunkName: "checklist" */ './views/Tareas/CheckList.vue'),
      meta: { title: 'Tareas', requiresAuth: true },
    },
    {
      path: '/agregar',
      name: 'agregar',
      component: () => import(/* webpackChunkName: "agregar" */ './views/Tareas/Agregar.vue'),
      meta: { parent: 'checklist', title: 'Nueva tarea', requiresAuth: true },
    },
    {
      path: '/editar/:id',
      name: 'editar',
      component: () => import(/* webpackChunkName: "editar" */ './views/Tareas/Editar.vue'),
      meta: { parent: 'checklist', title: 'Editar tarea', requiresAuth: true },
    },
    {
      path: '/proyectos',
      name: 'proyectos',
      component: () =>
        import(/* webpackChunkName: "proyectos" */ './views/Proyectos/Proyectos.vue'),
      meta: { title: 'Proyectos', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/proyectos/:slug',
      name: 'proyecto',
      component: () => import(/* webpackChunkName: "proyectos" */ './views/Proyectos/Proyecto.vue'),
      meta: { parent: 'proyectos', title: 'Proyecto', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trabajo/tareas',
      name: 'pm-tareas',
      component: () =>
        import(/* webpackChunkName: "trabajo" */ './views/Trabajo/TareasExternas.vue'),
      meta: { title: 'Project Manager', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trabajo/horas',
      name: 'horas',
      component: () => import(/* webpackChunkName: "trabajo" */ './views/Trabajo/Horas.vue'),
      meta: { title: 'Horas', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trabajo/cron',
      name: 'cron',
      component: () => import(/* webpackChunkName: "trabajo" */ './views/Trabajo/Cron.vue'),
      meta: { title: 'Cron', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trabajo/todoist',
      name: 'todoist',
      component: () => import(/* webpackChunkName: "trabajo" */ './views/Trabajo/Todoist.vue'),
      meta: { title: 'Todoist', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/trabajo/snippets',
      name: 'snippets',
      component: () => import(/* webpackChunkName: "trabajo" */ './views/Trabajo/Snippets.vue'),
      meta: { title: 'Snippets', requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/drive',
      name: 'drive',
      component: () => import(/* webpackChunkName: "drive" */ './views/Drive/Drive.vue'),
      meta: { title: 'Documentos', requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!token) return next({ name: 'ingreso' })
    const usuario = store.state.usuario
    if (to.matched.some((record) => record.meta.requiresAdmin) && !(usuario && usuario.isAdmin)) {
      return next({ name: 'home' })
    }
    next()
  } else {
    next()
  }
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Intranet` : 'Intranet'
})

export default router
