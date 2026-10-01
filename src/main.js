import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import '@fortawesome/fontawesome-free/css/all.css'
import api from '@/api'

// Formato de fechas
import VueMoment from 'vue-moment'
const moment = require('moment')
require('moment/locale/es')
Vue.use(VueMoment, { moment })

// Bootstrap (rejilla, formularios) + componentes de bootstrap-vue
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

// Sistema de diseño propio: debe cargarse DESPUÉS de Bootstrap para prevalecer
import './styles/app.css'

// Validacion para formularios
import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

// Graficos
import VueApexCharts from 'vue-apexcharts'
Vue.use(VueApexCharts)
Vue.component('apexchart', VueApexCharts)

Vue.config.productionTip = false

async function initApp() {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      const { data } = await api.get('/auth/me')
      store.commit('nuevoUsuario', data.user)
    } catch {
      localStorage.removeItem('token')
    }
  }

  new Vue({
    router,
    store,
    render: (h) => h(App),
  }).$mount('#app')
}

initApp()
