<template>
  <v-layout justify-center>
    <v-flex xs12>
      <v-card class="text-xs-center">
        <b-row class="mx-auto">
          <b-col>
            <h1>Datos personales</h1>
            <hr />
            <v-card-text>
              <b-row>
                <b-col cols="2"
                  ><h3><u>Nombre:</u></h3></b-col
                >
                <b-col cols="9">
                  <h3 class="text-info">{{ usuario.nombre }}</h3>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="2"
                  ><h3><u>Email:</u></h3></b-col
                >
                <b-col cols="9">
                  <h3 class="text-info">{{ usuario.email }}</h3>
                </b-col>
              </b-row>
            </v-card-text>
          </b-col>
          <b-col>
            <h1>Avatar</h1>
            <hr />
            <v-card-text>
              <v-avatar size="80">
                <img :src="fotoUrl(usuario.foto)" alt="avatar" />
              </v-avatar>
            </v-card-text>
            <v-card-text>
              <input
                type="file"
                ref="boton"
                class="d-none"
                accept="image/jpeg,image/png,image/webp"
                @change="buscarImagen($event)"
              />
              <b-button variant="primary" @click="$refs.boton.click()" class="mr-2"
                >Buscar imagen</b-button
              >
              <b-button
                variant="secondary"
                :disabled="file === null || loading"
                @click="subirImagen()"
                class="ml-2"
                >{{ loading ? 'Subiendo...' : 'Subir imagen' }}</b-button
              >
            </v-card-text>
          </b-col>
        </b-row>

        <v-card-text v-if="error">
          <Mensaje :texto="error" :tipo="tipoError" />
        </v-card-text>

        <v-card-text v-if="file">
          <h4>{{ file.name }}</h4>
          <v-img :src="urlTemporal" width="300" height="300" class="mx-auto"></v-img>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapState } from 'vuex'
import api from '@/api'
import Mensaje from '../components/Mensaje.vue'

export default {
  components: { Mensaje },
  data() {
    return {
      file: null,
      urlTemporal: '',
      loading: false,
      error: null,
      tipoError: '',
    }
  },
  computed: {
    ...mapState(['usuario']),
  },
  methods: {
    fotoUrl(foto) {
      if (!foto) return '/assets/img/no_image.png'
      if (foto.startsWith('http')) return foto
      return (process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000') + foto
    },
    buscarImagen(event) {
      const archivo = event.target.files[0]
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
      if (!tiposPermitidos.includes(archivo.type)) {
        this.tipoError = 'error'
        this.error = 'Archivo no válido. Solo se permiten imágenes JPEG, PNG o WebP.'
        this.file = null
        return
      }
      this.file = archivo
      this.error = null
      const reader = new FileReader()
      reader.readAsDataURL(this.file)
      reader.onload = (e) => {
        this.urlTemporal = e.target.result
      }
    },
    async subirImagen() {
      try {
        this.loading = true
        const formData = new FormData()
        formData.append('avatar', this.file)
        const { data } = await api.put('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        // Actualizar la foto en el estado del usuario
        this.$store.commit('nuevoUsuario', { ...this.usuario, foto: data.foto })
        this.tipoError = 'success'
        this.error = 'Imagen subida con éxito'
        this.file = null
      } catch {
        this.tipoError = 'error'
        this.error = 'Error al subir la imagen. Inténtalo de nuevo.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>
