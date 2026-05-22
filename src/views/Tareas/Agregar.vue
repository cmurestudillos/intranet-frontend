<template>
  <div>
    <h1>Agregar</h1>
    <hr />
    <b-card>
      <b-form @submit.prevent="submitForm">
        <b-row>
          <b-col cols="6">
            <b-form-group>
              <b-input-group prepend="Tarea:">
                <b-form-input
                  v-model="$v.nombre.$model"
                  type="text"
                  placeholder="Ej: Crear proyecto ..."
                ></b-form-input>
              </b-input-group>
              <p class="text-danger" v-if="$v.nombre.$dirty && !$v.nombre.required">
                Campo requerido
              </p>
              <p class="text-danger" v-if="$v.nombre.$dirty && !$v.nombre.minLength">
                Longitud mínima: 5 caracteres
              </p>
            </b-form-group>
          </b-col>
          <b-col cols="2">
            <b-form-group>
              <b-input-group prepend="Tiempo:">
                <b-form-input v-model="$v.horas.$model" type="number"></b-form-input>
              </b-input-group>
            </b-form-group>
          </b-col>
          <b-col cols="4">
            <b-form-group>
              <b-input-group prepend="Prioridad:">
                <b-form-radio-group
                  size="md"
                  v-model="$v.prioridad.$model"
                  :options="options"
                  buttons
                  button-variant="outline-dark"
                ></b-form-radio-group>
              </b-input-group>
              <p class="text-danger" v-if="$v.prioridad.$dirty && !$v.prioridad.required">
                Campo requerido
              </p>
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
              :disabled="$v.$invalid || carga"
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
              title="Cancelar"
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
import { mapActions, mapState } from 'vuex'
import { required, minLength } from 'vuelidate/lib/validators'

export default {
  data() {
    return {
      nombre: '',
      horas: 0,
      prioridad: '',
      options: [
        { text: 'Alta', value: 'alta' },
        { text: 'Media', value: 'media' },
        { text: 'Relax', value: 'relax' },
      ],
    }
  },
  validations: {
    nombre: { required, minLength: minLength(5) },
    horas: { required },
    prioridad: { required },
  },
  computed: {
    ...mapState(['carga']),
  },
  methods: {
    ...mapActions(['agregarTarea', 'cancelarAccion']),
    submitForm() {
      this.$v.$touch()
      if (!this.$v.$invalid) {
        this.agregarTarea({
          nombre: this.nombre,
          horas: Number(this.horas),
          prioridad: this.prioridad,
        })
      }
    },
  },
}
</script>
