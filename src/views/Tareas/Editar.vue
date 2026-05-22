<template>
  <div>
    <h1>Editar</h1>
    <hr />
    <b-card>
      <b-form @submit.prevent="editarTarea(tarea)">
        <b-row>
          <b-col cols="6">
            <b-form-group>
              <b-input-group prepend="Tarea:">
                <b-form-input
                  @change="stateNombre"
                  v-model="$v.tarea.nombre.$model"
                  type="text"
                  placeholder="Ej: Crear proyecto ..."
                ></b-form-input>
              </b-input-group>
              <!-- Validaciones -->
              <p class="text-danger" v-if="!$v.tarea.nombre.required">Campo requerido</p>
              <p class="text-danger" v-if="!$v.tarea.nombre.minLength">
                Longitud minima: 5 carácteres
              </p>
            </b-form-group>
          </b-col>
          <b-col cols="2">
            <b-form-group>
              <b-input-group prepend="Tiempo:">
                <b-form-input
                  @change="stateHoras"
                  v-model="tarea.horas"
                  type="number"
                ></b-form-input>
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col cols="4">
            <b-form-group>
              <b-input-group prepend="Tipo:">
                <b-form-radio-group
                  @change="statePrioridad"
                  size="md"
                  v-model="tarea.prioridad"
                  :options="options"
                  buttons
                  button-variant="outline-dark"
                ></b-form-radio-group>
              </b-input-group>
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col>
            <b-button
              block
              squared
              lg="4"
              variant="success"
              class="mx-2"
              type="submit"
              :disabled="$v.tarea.$invalid"
              alt="Confirmar"
              title="Confirmar"
            >
              <i class="fas fa-check"></i>
            </b-button>
          </b-col>
          <b-col>
            <b-button
              block
              @click="cancelarAccion()"
              squared
              lg="4"
              variant="danger"
              class="mx-2"
              alt="Cancelar"
              title="Canccelar"
            >
              <i class="fas fa-ban"></i>
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </b-card>
  </div>
</template>

<script>
// Propiedades de Vuex
import { mapActions, mapState } from 'vuex'
// Validaciones para formulario
import { required, minLength } from 'vuelidate/lib/validators'

export default {
  data() {
    return {
      id: this.$route.params.id,
      options: [
        { text: 'Alta', value: 'alta' },
        { text: 'Media', value: 'media' },
        { text: 'Relax', value: 'relax' },
      ],
    }
  },
  methods: {
    ...mapActions(['getTarea', 'editarTarea', 'cancelarAccion']),
    stateNombre(event) {
      this.tarea.nombre = event
    },
    stateHoras(event) {
      this.tarea.horas = event
    },
    statePrioridad(event) {
      this.tarea.prioridad = event
    },
  },
  created() {
    this.getTarea(this.id)
  },
  computed: {
    ...mapState(['tarea']),
  },
  validations: {
    tarea: {
      nombre: { required, minLength: minLength(5) },
    },
  },
}
</script>
