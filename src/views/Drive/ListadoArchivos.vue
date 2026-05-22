<template>
  <div>
    <b-row>
      <b-col>
        <!-- Componente de busqueda -->
        <Buscador />
      </b-col>
      <b-col>
        <!-- Componente de filtro -->
        <Filtro />
      </b-col>
    </b-row>
    <!-- Componente de Mensajes -->
    <Mensaje
      v-if="documentos.length === 0 && !carga"
      :texto="'No hay Archivos subidos en el servidor actualmente.'"
      :tipo="'info'"
    />
    <!-- Componente de Carga -->
    <Loading :carga="carga" :mensaje="'Cargando contenido...'" />
    <!-- Componente de Tarjeta -->
    <b-card-group columns v-if="!carga">
      <Tarjeta :documentos="arrayFiltrado" />
    </b-card-group>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapState, mapActions, mapGetters } from 'vuex'
// Componentes
import Loading from '../../components/Loading.vue'
import Mensaje from '../../components/Mensaje.vue'
import Tarjeta from './Tarjeta.vue'
import Buscador from '../../components/Buscador.vue'
import Filtro from '../../components/Filtro.vue'

export default {
  data() {
    return {
      texto: '',
      selected: '',
    }
  },
  computed: {
    ...mapState(['usuario', 'documentos', 'carga']),
    ...mapGetters(['arrayFiltrado']),
  },
  methods: {
    ...mapActions(['getDocumentos']),
  },
  created() {
    this.getDocumentos()
  },
  components: {
    Loading,
    Mensaje,
    Tarjeta,
    Buscador,
    Filtro,
  },
}
</script>

<style scoped>
@media screen and (min-width: 992px) {
  .card-columns {
    column-count: 4;
    column-gap: 1.25rem;
    orphans: 1;
    widows: 1;
  }
}
</style>
