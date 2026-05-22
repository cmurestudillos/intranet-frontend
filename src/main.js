import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@fortawesome/fontawesome-free/css/all.css'
import api from '@/api'

// Formato de fechas
import VueMoment from 'vue-moment'
const moment = require('moment')
require('moment/locale/es')
Vue.use(VueMoment, { moment })

// Vue-bootstrap
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

// Scroll para el Chat
import VueChatScroll from 'vue-chat-scroll'
Vue.use(VueChatScroll)

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
