import Vue from 'vue'
import Vuex from 'vuex'
import api from '@/api'
import router from '@/router'
import Swal from 'sweetalert2'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    usuario: '',
    carga: false,
    tareasPendientes: [],
    tareasCompletadas: [],
    tarea: { nombre: '', horas: 0, prioridad: '', id: '', uid: '' },
    documentos: [],
    graficoPendientes: [],
    graficoCompletadas: [],
    // Proyectos del vault de Obsidian (solo admin)
    proyectos: [],
    proyectoFiltro: '',
    // Última actividad recibida del vault; las vistas la observan para refrescar
    ultimaActividadNotas: null,
    // Límites de subida del backend (MB); valores por defecto hasta consultarlos
    limites: { avatarMB: 4, documentoMB: 4, cargados: false },
  },
  mutations: {
    nuevoUsuario(state, payload) {
      state.usuario = payload ?? ''
    },
    setTareasPendientes(state, tareas) {
      state.tareasPendientes = tareas
    },
    setTareasCompletadas(state, tareas) {
      state.tareasCompletadas = tareas
    },
    setTarea(state, tarea) {
      state.tarea = tarea
    },
    eliminarTarea(state, id) {
      state.tareasPendientes = state.tareasPendientes.filter((t) => t.id !== id)
      state.tareasCompletadas = state.tareasCompletadas.filter((t) => t.id !== id)
    },
    setGraficoPendientes(state, data) {
      state.graficoPendientes = data
    },
    setGraficoCompletadas(state, data) {
      state.graficoCompletadas = data
    },
    setDocumentos(state, documentos) {
      state.documentos = documentos
    },
    eliminarDocumento(state, id) {
      state.documentos = state.documentos.filter((d) => d.id !== id)
    },
    cargarFirebase(state, payload) {
      state.carga = payload
    },
    setProyectos(state, proyectos) {
      state.proyectos = proyectos
    },
    setProyectoFiltro(state, slug) {
      state.proyectoFiltro = slug || ''
    },
    setLimites(state, limites) {
      state.limites = { ...limites, cargados: true }
    },
    setUltimaActividadNotas(state, actividad) {
      state.ultimaActividadNotas = actividad
    },
  },
  actions: {
    setUsuario({ commit }, user) {
      commit('nuevoUsuario', user)
    },
    cerrarSesion({ commit }) {
      localStorage.removeItem('token')
      commit('nuevoUsuario', null)
      router.push({ name: 'ingreso' }).catch(() => {})
    },

    // ── Tareas ────────────────────────────────────────────────────────────── //
    async getTareasPendientes({ commit }) {
      commit('cargarFirebase', true)
      try {
        const { data } = await api.get('/tasks?estado=false')
        commit('setTareasPendientes', data.tasks)
      } catch (error) {
        console.error('Error al obtener tareas pendientes:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    async getTareasCompletadas({ commit }) {
      commit('cargarFirebase', true)
      try {
        const { data } = await api.get('/tasks?estado=true')
        commit('setTareasCompletadas', data.tasks)
      } catch (error) {
        console.error('Error al obtener tareas completadas:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    async getTarea({ commit }, id) {
      try {
        const { data } = await api.get(`/tasks/${id}`)
        commit('setTarea', data.task)
      } catch (error) {
        console.error('Error al obtener tarea:', error.message)
      }
    },

    async agregarTarea({ commit }, tarea) {
      commit('cargarFirebase', true)
      try {
        await api.post('/tasks', {
          nombre: tarea.nombre,
          horas: tarea.horas,
          prioridad: tarea.prioridad,
          proyecto: tarea.proyecto || '',
        })
        router.push({ name: 'checklist' })
      } catch (error) {
        console.error('Error al agregar tarea:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    async editarTarea(_ctx, tarea) {
      try {
        await api.put(`/tasks/${tarea.id}`, {
          nombre: tarea.nombre,
          horas: tarea.horas,
          prioridad: tarea.prioridad,
          proyecto: tarea.proyecto || '',
        })
        router.push({ name: 'checklist' })
      } catch (error) {
        console.error('Error al editar tarea:', error.message)
      }
    },

    async eliminarTarea({ commit }, id) {
      const result = await Swal.fire({
        title: '¿Eliminar esta tarea?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: { confirmButton: 'btn-confirm-danger' },
      })
      if (result.isConfirmed) {
        try {
          await api.delete(`/tasks/${id}`)
          commit('eliminarTarea', id)
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            timer: 3000,
            showConfirmButton: false,
            icon: 'success',
            title: 'Tarea eliminada',
          })
        } catch (error) {
          console.error('Error al eliminar tarea:', error.message)
        }
      }
    },

    async cambiarEstado({ dispatch }, tarea) {
      try {
        await api.patch(`/tasks/${tarea.id}/estado`)
        dispatch('getTareasPendientes')
        dispatch('getTareasCompletadas')
      } catch (error) {
        console.error('Error al cambiar estado:', error.message)
      }
    },

    async getLimites({ commit, state }) {
      if (state.limites.cargados) return
      try {
        const { data } = await api.get('/health')
        if (data.limites) commit('setLimites', data.limites)
      } catch (error) {
        console.error('Error al obtener límites:', error.message)
      }
    },

    // ── Proyectos (vault de Obsidian) ─────────────────────────────────────── //
    async getProyectos({ commit, state }, { force = false } = {}) {
      if (!state.usuario || !state.usuario.isAdmin) return
      if (state.proyectos.length && !force) return
      try {
        const { data } = await api.get('/notes/projects')
        commit('setProyectos', data.projects)
      } catch (error) {
        console.error('Error al obtener proyectos:', error.message)
      }
    },

    // ── Gráficas ──────────────────────────────────────────────────────────── //
    async graficaTareasPendientes({ commit }) {
      commit('cargarFirebase', true)
      try {
        const { data } = await api.get('/tasks?estado=false')
        const chartData = Array(12).fill(0)
        data.tasks.forEach((t) => {
          if (t.mesTarea >= 0 && t.mesTarea <= 11) chartData[t.mesTarea]++
        })
        commit('setGraficoPendientes', chartData)
        commit('setTareasPendientes', data.tasks)
      } catch (error) {
        console.error('Error al obtener gráfica pendientes:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    async graficaTareasCompletadas({ commit }) {
      commit('cargarFirebase', true)
      try {
        const { data } = await api.get('/tasks?estado=true')
        const chartData = Array(12).fill(0)
        data.tasks.forEach((t) => {
          if (t.mesTarea >= 0 && t.mesTarea <= 11) chartData[t.mesTarea]++
        })
        commit('setGraficoCompletadas', chartData)
        commit('setTareasCompletadas', data.tasks)
      } catch (error) {
        console.error('Error al obtener gráfica completadas:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    // ── Documentos ────────────────────────────────────────────────────────── //
    async getDocumentos({ commit }) {
      commit('cargarFirebase', true)
      try {
        const { data } = await api.get('/documents')
        commit('setDocumentos', data.documents)
      } catch (error) {
        console.error('Error al obtener documentos:', error.message)
      } finally {
        commit('cargarFirebase', false)
      }
    },

    async eliminarDocumento({ commit }, documento) {
      try {
        await api.delete(`/documents/${documento.id}`)
        commit('eliminarDocumento', documento.id)
      } catch (error) {
        console.error('Error al eliminar documento:', error.message)
      }
    },
  },
  getters: {
    nombreProyecto: (state) => (slug) => {
      const p = state.proyectos.find((x) => x.slug === slug)
      return p ? p.nombre : slug
    },
  },
})
