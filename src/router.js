import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "home" */ './views/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ingreso',
      name: 'ingreso',
      component: () => import(/* webpackChunkName: "ingreso" */ './views/Ingreso.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () =>
        import(/* webpackChunkName: "dashboard" */ './views/Dashboard/DashBoard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import(/* webpackChunkName: "chat" */ './views/Chat.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checklist',
      name: 'checklist',
      component: () => import(/* webpackChunkName: "checklist" */ './views/Tareas/CheckList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/agregar',
      name: 'agregar',
      component: () => import(/* webpackChunkName: "agregar" */ './views/Tareas/Agregar.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/editar/:id',
      name: 'editar',
      component: () => import(/* webpackChunkName: "editar" */ './views/Tareas/Editar.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/drive',
      name: 'drive',
      component: () => import(/* webpackChunkName: "drive" */ './views/Drive/Drive.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    token ? next() : next({ name: 'ingreso' })
  } else {
    next()
  }
})

export default router
