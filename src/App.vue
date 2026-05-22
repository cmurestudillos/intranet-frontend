<template>
  <v-app dark class="intranet-app">
    <Navbar v-if="usuario"></Navbar>
    <v-content>
      <v-container fluid class="main-container">
        <router-view />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import { mapState } from 'vuex'
import Navbar from '@/components/Navbar'

export default {
  name: 'App',
  components: { Navbar },
  computed: {
    ...mapState(['usuario']),
  },
}
</script>
