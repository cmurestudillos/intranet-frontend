<template>
  <div>
    <!-- Mensaje informativo -->
    <b-alert class="text-center" show variant="info" v-if="tipo === 'info'">
      <v-icon class="fas fa-info text-info fa-3x"></v-icon>
      <h4>{{ texto }}</h4>
    </b-alert>

    <!-- Mensaje advertencia -->
    <b-alert class="text-center" show variant="warning" v-if="tipo === 'warning'">
      <v-icon class="fas fa-exclamation text-warning fa-3x"></v-icon>
      <h4>{{ texto }}</h4>
    </b-alert>

    <!-- Mensaje error -->
    <b-alert class="text-center" show variant="danger" v-if="tipo === 'error'">
      <v-icon class="fas fa-times text-danger fa-3x"></v-icon>
      <h4>{{ texto }}</h4>
    </b-alert>

    <!-- Mensaje de confirmacion -->
    <b-alert class="text-center" show variant="success" v-if="tipo === 'success'">
      <v-icon class="fas fa-check text-success fa-3x"></v-icon>
      <h4>{{ texto }}</h4>
    </b-alert>
  </div>
</template>

<script>
export default {
  props: {
    texto: {
      type: String,
    },
    tipo: {
      type: String,
    },
  },
}
</script>
