<template>
  <draggable class="list-group mt-4" @start="drag = true" @end="drag = false">
    <li class="list-group-item" v-for="item of tareas" :key="item.id">
      <div class="task-left">
        <i class="fas fa-grip-vertical task-handle"></i>
        <span :class="{ tachado: item.estado }" class="fonts">
          <strong>{{ item.nombre }}</strong>
        </span>
      </div>
      <div class="task-right">
        <span class="task-meta">
          <small>Horas</small>
          <strong>{{ item.horas }}h</strong>
        </span>
        <span class="task-meta task-prioridad" :class="'prio-' + item.prioridad">
          <small>Prioridad</small>
          <strong>{{ item.prioridad }}</strong>
        </span>
        <!-- Toggle estado -->
        <b-button
          @click="cambiarEstado(item)"
          :class="item.estado ? 'btn-success' : 'btn-info'"
          class="btn btn-sm task-btn"
          :title="item.estado ? 'Completada' : 'Pendiente'"
        >
          <i :class="item.estado ? 'fas fa-check' : 'fas fa-clock'"></i>
        </b-button>
        <!-- Editar -->
        <router-link
          class="btn btn-warning btn-sm task-btn"
          :to="{ name: 'editar', params: { id: item.id } }"
          :event="item.estado ? '' : 'click'"
          :class="{ 'btn-secondary': item.estado }"
          title="Editar"
        >
          <i class="fas fa-pen"></i>
        </router-link>
        <!-- Eliminar -->
        <b-button
          @click="eliminarTarea(item.id)"
          class="btn btn-danger btn-sm task-btn"
          title="Eliminar"
        >
          <i class="fas fa-trash"></i>
        </b-button>
      </div>
    </li>
  </draggable>
</template>

<script>
import { mapActions } from 'vuex'
import draggable from 'vuedraggable'

export default {
  props: {
    tareas: { type: Array },
  },
  components: { draggable },
  methods: {
    ...mapActions(['eliminarTarea', 'cambiarEstado']),
  },
}
</script>

<style scoped>
.list-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.list-group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.task-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.task-handle {
  color: #475569;
  cursor: grab;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.task-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
  border-left: 1px solid rgba(99, 102, 241, 0.12);
  font-family: 'Inter', sans-serif;
}
.task-meta small {
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.task-meta strong {
  font-size: 0.82rem;
  color: #e2e8f0;
}

.task-prioridad.prio-alta strong {
  color: #f87171;
}
.task-prioridad.prio-media strong {
  color: #fcd34d;
}
.task-prioridad.prio-relax strong {
  color: #86efac;
}

.task-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  border-radius: 6px !important;
}

.toCapitalFirst {
  text-transform: capitalize;
}
</style>
