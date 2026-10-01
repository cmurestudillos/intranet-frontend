<template>
  <div>
    <PageHeader title="Nueva tarea" subtitle="Añade una tarea a tu lista de pendientes." />
    <TareaForm
      titulo="Datos de la tarea"
      :inicial="{ proyecto: $route.query.proyecto || '' }"
      :guardando="carga"
      @submit="agregarTarea"
    />
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import PageHeader from '@/components/ui/PageHeader.vue'
import TareaForm from './TareaForm.vue'

export default {
  name: 'Agregar',
  components: { PageHeader, TareaForm },
  computed: {
    ...mapState(['carga']),
  },
  methods: {
    ...mapActions(['agregarTarea']),
  },
}
</script>
