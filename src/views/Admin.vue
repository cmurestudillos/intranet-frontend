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
              <b-row>
                <b-col cols="2"
                  ><h3><u>Tlfn:</u></h3></b-col
                >
                <b-col cols="9">
                  <h3 v-if="usuario.phoneNumber" class="text-info">{{ usuario.phoneNumber }}</h3>
                  <h3 v-else class="text-info">----</h3>
                </b-col>
              </b-row>
            </v-card-text>
          </b-col>
          <b-col>
            <h1>Avatar</h1>
            <hr />
            <v-card-text>
              <v-avatar>
                <img :src="usuario.foto || '/assets/img/no_image.png'" alt="avatar" />
              </v-avatar>
            </v-card-text>
          </b-col>
        </b-row>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['usuario']),
  },
}
</script>
