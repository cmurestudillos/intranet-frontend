<template>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th class="col-check"><span class="sr-only">Estado</span></th>
          <th>Tarea</th>
          <th class="num">Horas</th>
          <th>Prioridad</th>
          <th>Creada</th>
          <th class="col-actions"><span class="sr-only">Acciones</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in tareas" :key="item.id" :class="{ hecha: item.estado }">
          <td class="col-check">
            <button
              class="check"
              :class="{ on: item.estado }"
              :title="item.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
              :aria-label="item.estado ? 'Marcar como pendiente' : 'Marcar como completada'"
              @click="cambiarEstado(item)"
            >
              <i v-if="item.estado" class="fas fa-check"></i>
            </button>
          </td>
          <td class="col-nombre">
            <span class="nombre">{{ item.nombre }}</span>
            <router-link
              v-if="item.proyecto && usuario && usuario.isAdmin"
              :to="{ name: 'proyecto', params: { slug: item.proyecto } }"
              class="badge-soft tone-accent proyecto"
              :title="'Proyecto: ' + nombreProyecto(item.proyecto)"
            >
              <i class="fas fa-book"></i> {{ nombreProyecto(item.proyecto) }}
            </router-link>
          </td>
          <td class="num">{{ item.horas }} h</td>
          <td>
            <span class="badge-soft" :class="tonoPrioridad[item.prioridad]">{{
              etiquetaPrioridad[item.prioridad]
            }}</span>
          </td>
          <td class="muted fecha">{{ item.createdAt | moment('D MMM YYYY') }}</td>
          <td class="col-actions">
            <router-link
              v-if="!item.estado"
              :to="{ name: 'editar', params: { id: item.id } }"
              class="btn btn-ghost btn-icon"
              title="Editar"
              aria-label="Editar"
            >
              <i class="fas fa-pen"></i>
            </router-link>
            <button
              class="btn btn-ghost btn-icon danger"
              title="Eliminar"
              aria-label="Eliminar"
              @click="eliminarTarea(item.id)"
            >
              <i class="far fa-trash-can"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'

export default {
  props: {
    tareas: { type: Array, default: () => [] },
  },
  data() {
    return {
      tonoPrioridad: { alta: 'tone-danger', media: 'tone-warning', relax: 'tone-success' },
      etiquetaPrioridad: { alta: 'Alta', media: 'Media', relax: 'Baja' },
    }
  },
  computed: {
    ...mapState(['usuario']),
    ...mapGetters(['nombreProyecto']),
  },
  methods: {
    ...mapActions(['eliminarTarea', 'cambiarEstado']),
  },
  created() {
    // Los nombres de proyecto de las insignias salen del store
    this.$store.dispatch('getProyectos')
  },
}
</script>

<style scoped>
.col-check {
  width: 44px;
  padding-right: 0 !important;
}
.col-nombre {
  min-width: 240px;
}
.nombre {
  font-weight: 500;
  margin-right: var(--sp-2);
}
.hecha .nombre {
  text-decoration: line-through;
  color: var(--text-3);
}
.proyecto {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
.fecha {
  white-space: nowrap;
}
</style>
