<template>
  <div>
    <b-tabs card fill class="border">
      <b-tab title="Listado Archivos" active @click="getDocumentos()">
        <b-card-text>
          <ListadoArchivos />
        </b-card-text>
      </b-tab>
      <b-tab title="Cargar Documentos">
        <b-card-text>
          <!-- Componente de Carga -->
          <Loading :carga="carga" :mensaje="'Subiendo contenido...'" />

          <b-row class="mx-auto" v-if="!carga">
            <b-col cols="4">
              <h3>Selección de archivos</h3>
              <hr />
              <div class="well drop-zone">
                <img src="/assets/img/drop-images.png" alt="" />
                <vue-dropzone
                  ref="myVueDropzone"
                  :include-styling="false"
                  :useCustomSlot="true"
                  id="dropzone"
                  @vdropzone-upload-progress="uploadProgress"
                  :options="dropzoneOptions"
                  @vdropzone-file-added="fileAdded"
                >
                  <div class="file-selector">Soltar archivos aquí...</div>
                </vue-dropzone>
              </div>
            </b-col>
            <b-col cols="8">
              <h4>Cargar Archivos</h4>
              <b-button
                squared
                variant="outline-success"
                @click="sendingFiles()"
                :disabled="tempAttachments.length === 0"
                class="mr-2"
                >Subir</b-button
              >
              <b-button squared variant="outline-danger" @click="limpiarImagenes()" class="ml-2"
                >Limpiar</b-button
              >
              <CargaArchivos :tempAttachments="getTempAttachments" :attachments="getAttachments" />
            </b-col>
          </b-row>
        </b-card-text>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import vue2Dropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import { mapState, mapActions } from 'vuex'
import api from '@/api'
import CargaArchivos from './CargaArchivos.vue'
import ListadoArchivos from './ListadoArchivos.vue'
import Loading from '../../components/Loading.vue'

export default {
  components: {
    CargaArchivos,
    ListadoArchivos,
    vueDropzone: vue2Dropzone,
    Loading,
  },
  data() {
    return {
      archivos: [],
      tempAttachments: [],
      attachments: [],
      dropzoneOptions: {
        // La URL es solo para que Dropzone no arroje error; el upload lo manejamos manualmente
        url: 'https://httpbin.org/post',
        autoProcessQueue: false,
        maxFilesize: 50,
        dictDefaultMessage: 'Arrastra archivos aquí o haz clic para seleccionar',
        includeStyling: false,
        previewsContainer: false,
        thumbnailWidth: 250,
        thumbnailHeight: 140,
        uploadMultiple: true,
        parallelUploads: 20,
      },
    }
  },
  methods: {
    fileAdded(file) {
      this.archivos.push(file)
      const attachment = {
        _id: file.upload.uuid,
        title: file.name,
        type: 'file',
        extension: '.' + file.type.split('/')[1],
        isLoading: true,
        progress: null,
        size: file.size,
      }
      this.tempAttachments = [...this.tempAttachments, attachment]
    },
    async sendingFiles() {
      this.componenteInzCarga()
      try {
        for (const archivo of this.archivos) {
          const formData = new FormData()
          formData.append('file', archivo, archivo.name)
          await api.post('/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        }
        // Recargar la lista de documentos
        await this.getDocumentos()
      } catch (error) {
        console.error('Error al subir archivos:', error.message)
      } finally {
        this.tempAttachments = []
        this.archivos = []
        this.componenteFinCarga()
      }
    },
    uploadProgress(file, progress) {
      this.tempAttachments = this.tempAttachments.map((a) => {
        if (a.title === file.name) {
          return { ...a, progress: `${Math.floor(progress)}` }
        }
        return a
      })
    },
    limpiarImagenes() {
      this.tempAttachments = []
      this.archivos = []
    },
    ...mapActions(['getDocumentos', 'componenteInzCarga', 'componenteFinCarga']),
  },
  computed: {
    ...mapState(['usuario', 'carga']),
    getTempAttachments() {
      return this.tempAttachments
    },
    getAttachments() {
      return this.attachments
    },
  },
}
</script>
