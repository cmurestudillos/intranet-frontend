import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify, {
  theme: {
    primary: '#6366f1',
    secondary: '#1e293b',
    accent: '#38bdf8',
    error: '#ef4444',
    info: '#38bdf8',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  customProperties: true,
  iconfont: 'fa5',
})
