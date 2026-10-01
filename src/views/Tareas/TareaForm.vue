<template>
  <form class="tarea-form" novalidate @submit.prevent="guardar">
    <AppPanel :title="titulo">
      <div class="form-grid">
        <div class="form-group full">
          <label for="nombre">Nombre de la tarea</label>
          <input
            id="nombre"
            v-model.trim="$v.form.nombre.$model"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': $v.form.nombre.$error }"
            placeholder="Ej.: Preparar el informe trimestral"
          />
          <p v-if="$v.form.nombre.$dirty && !$v.form.nombre.required" class="form-error">
            El nombre es obligatorio
          </p>
          <p v-else-if="$v.form.nombre.$dirty && !$v.form.nombre.minLength" class="form-error">
            Mínimo 5 caracteres
          </p>
        </div>

        <div class="form-group">
          <label for="horas">Horas estimadas</label>
          <input
            id="horas"
            v-model.number="$v.form.horas.$model"
            type="number"
            min="0"
            step="0.5"
            class="form-control"
            :class="{ 'is-invalid': $v.form.horas.$error }"
          />
          <p v-if="$v.form.horas.$error" class="form-error">Introduce un número de horas válido</p>
        </div>

        <div class="form-group">
          <span class="form-label" id="prioridad-label">Prioridad</span>
          <div class="segmented" role="radiogroup" aria-labelledby="prioridad-label">
            <button
              v-for="p in prioridades"
              :key="p.value"
              type="button"
              role="radio"
              :aria-checked="form.prioridad === p.value ? 'true' : 'false'"
              :class="{ active: form.prioridad === p.value }"
              @click="form.prioridad = p.value"
            >
              <span class="prio-dot" :class="'prio-' + p.value"></span>{{ p.text }}
            </button>
          </div>
          <p v-if="$v.form.prioridad.$error" class="form-error">Elige una prioridad</p>
        </div>

        <div v-if="usuario && usuario.isAdmin" class="form-group full">
          <label for="proyecto">Proyecto <span class="muted">(opcional)</span></label>
          <SelectorProyecto id="proyecto" v-model="form.proyecto" />
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn-secondary"
          @click="$router.push({ name: 'checklist' })"
        >
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="guardando">
          {{ guardando ? 'Guardando…' : 'Guardar tarea' }}
        </button>
      </template>
    </AppPanel>
  </form>
</template>

<script>
import { mapState } from 'vuex'
import { required, minLength, minValue } from 'vuelidate/lib/validators'
import AppPanel from '@/components/ui/AppPanel.vue'
import SelectorProyecto from '@/components/SelectorProyecto.vue'

// Formulario común de alta y edición de tareas
export default {
  name: 'TareaForm',
  components: { AppPanel, SelectorProyecto },
  props: {
    titulo: { type: String, required: true },
    inicial: { type: Object, default: () => ({}) },
    guardando: { type: Boolean, default: false },
  },
  data() {
    return {
      form: { nombre: '', horas: 1, prioridad: 'media', proyecto: '', ...this.inicial },
      prioridades: [
        { value: 'alta', text: 'Alta' },
        { value: 'media', text: 'Media' },
        { value: 'relax', text: 'Baja' },
      ],
    }
  },
  validations: {
    form: {
      nombre: { required, minLength: minLength(5) },
      horas: { required, minValue: minValue(0) },
      prioridad: { required },
    },
  },
  computed: {
    ...mapState(['usuario']),
  },
  watch: {
    inicial(valor) {
      this.form = { ...this.form, ...valor }
    },
  },
  methods: {
    guardar() {
      this.$v.$touch()
      if (this.$v.$invalid) return
      this.$emit('submit', { ...this.form, horas: Number(this.form.horas) })
    },
  },
}
</script>

<style scoped>
.tarea-form {
  max-width: 820px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--sp-5);
}
.form-grid .full {
  grid-column: 1 / -1;
}
.prio-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.prio-alta {
  background: var(--danger);
}
.prio-media {
  background: #d97706;
}
.prio-relax {
  background: var(--success);
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
