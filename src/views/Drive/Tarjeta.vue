<template>
  <div>
    <!-- Listado de archivos -->
    <b-card
      v-for="(item, index) in documentos"
      :key="index"
      :item="item"
      class="shadow p-3 mb-4 rounded"
    >
      <b-img
        center
        rounded
        thumbnail
        fluid
        src="/assets/img/pdf.png"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="item.tipo === 'application/pdf'"
      ></b-img>
      <b-img
        center
        rounded
        thumbnail
        fluid
        src="/assets/img/excel.png"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="item.tipo === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'"
      ></b-img>
      <b-img
        center
        rounded
        thumbnail
        fluid
        src="/assets/img/word.png"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="
          item.tipo === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        "
      ></b-img>
      <b-img
        center
        rounded
        thumbnail
        fluid
        src="/assets/img/txt.png"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="item.tipo === 'text/plain'"
      ></b-img>
      <b-img
        center
        rounded
        thumbnail
        fluid
        src="/assets/img/json.png"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="item.tipo === 'application/json'"
      ></b-img>
      <b-img
        center
        rounded
        thumbnail
        fluid
        :src="resolveUrl(item.archivo)"
        :alt="item.nombre"
        :title="item.nombre"
        width="128"
        height="128"
        v-if="
          item.tipo === 'image/png' ||
          item.tipo === 'image/jpg' ||
          item.tipo === 'image/jpeg' ||
          item.tipo === 'image/svg+xml'
        "
      ></b-img>
      <b-row>
        <b-col class="mt-2 text-center">
          <b-button @click="verimagen(item)" square variant="info" size="sm" class="mr-1">
            <i class="fas fa-eye"></i>
          </b-button>
          <b-button @click="eliminarDocumento(item)" square variant="danger" size="sm" class="ml-1">
            <i class="fas fa-trash"></i>
          </b-button>
          <b-card-text class="small text-muted mt-2">{{
            item.fecha | moment('from', 'now')
          }}</b-card-text>
        </b-col>
      </b-row>
    </b-card>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapActions } from 'vuex'
// Ventana
import Swal from 'sweetalert2'

export default {
  props: {
    documentos: {
      type: Array,
    },
  },
  methods: {
    ...mapActions(['eliminarDocumento']),
    resolveUrl(url) {
      if (!url) return '/assets/img/no_image.png'
      if (url.startsWith('http')) return url
      return (process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000') + url
    },
    verimagen(doc) {
      const url = this.resolveUrl(doc.archivo)
      Swal.fire({
        imageUrl: url,
        html: `<strong>Nombre:</strong> <a class="modal-enlace" href="${url}" target="_blank" rel="noopener noreferrer">${doc.nombre}</a>`,
      })
    },
  },
}
</script>
