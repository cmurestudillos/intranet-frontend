<template>
  <div>
    <apexchart class="text-center" type="line" :options="options" :series="series"></apexchart>
  </div>
</template>

<script>
// Graficos
export default {
  props: {
    graficoPendientes: {
      type: Array,
    },
    graficoCompletadas: {
      type: Array,
    },
  },
  data() {
    return {
      options: {
        chart: { id: 'informe-tareas' },
        xaxis: {
          categories: [
            'Enero',
            'Febrero',
            'Marzo',
            'Abril',
            'Mayo',
            'Junio',
            'Julio',
            'Agosto',
            'Septiembre',
            'Octubre',
            'Noviembre',
            'Diciembre',
          ],
        },
        colors: ['#ffc107', '#28a745'],
      },
    }
  },
  computed: {
    series() {
      return [
        { name: 'Tareas Pendientes', data: this.graficoPendientes },
        { name: 'Tareas Completadas', data: this.graficoCompletadas },
      ]
    },
  },
}
</script>
