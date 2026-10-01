<template>
  <apexchart type="bar" height="320" :options="options" :series="series" />
</template>

<script>
export default {
  props: {
    graficoPendientes: { type: Array, default: () => [] },
    graficoCompletadas: { type: Array, default: () => [] },
  },
  data() {
    return {
      options: {
        chart: {
          id: 'informe-tareas',
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
          stacked: true,
        },
        colors: ['#d97706', '#2563eb'],
        plotOptions: { bar: { columnWidth: '45%', borderRadius: 2 } },
        dataLabels: { enabled: false },
        grid: { borderColor: '#e1e5eb', strokeDashArray: 3 },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px' },
        xaxis: {
          categories: [
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic',
          ],
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: '#6b7686', fontSize: '12px' } },
        },
        yaxis: {
          forceNiceScale: true,
          labels: {
            style: { colors: '#6b7686', fontSize: '12px' },
            formatter: (v) => Math.round(v),
          },
        },
        tooltip: { y: { formatter: (v) => `${v} tarea${v === 1 ? '' : 's'}` } },
      },
    }
  },
  computed: {
    series() {
      return [
        { name: 'Pendientes', data: this.graficoPendientes },
        { name: 'Completadas', data: this.graficoCompletadas },
      ]
    },
  },
}
</script>
