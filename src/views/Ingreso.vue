<template>
  <div class="auth">
    <aside class="auth-aside">
      <div class="auth-brand">
        <span class="brand-mark"><i class="fas fa-building"></i></span>
        <span>Intranet</span>
      </div>
      <div class="auth-claim">
        <h1>Tu espacio de trabajo, en un solo sitio.</h1>
        <ul>
          <li><i class="fas fa-list-check"></i> Tareas con prioridades y seguimiento mensual</li>
          <li><i class="fas fa-folder-open"></i> Documentos privados, accesibles solo por ti</li>
          <li><i class="fas fa-comments"></i> Chat del equipo en tiempo real</li>
        </ul>
      </div>
      <p class="auth-foot">© Carlos Mur</p>
    </aside>

    <main class="auth-main">
      <form class="auth-form" novalidate @submit.prevent="submit">
        <h2>{{ registro ? 'Crear cuenta' : 'Iniciar sesión' }}</h2>
        <p class="auth-sub">
          {{
            registro ? 'Completa los datos para registrarte.' : 'Accede con tu email y contraseña.'
          }}
        </p>

        <Mensaje v-if="errorMsg" :texto="errorMsg" tipo="error" />

        <div v-if="registro" class="form-group">
          <label for="nombre">Nombre</label>
          <input
            id="nombre"
            v-model.trim="$v.nombre.$model"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': $v.nombre.$error }"
            autocomplete="name"
          />
          <p v-if="$v.nombre.$dirty && !$v.nombre.required" class="form-error">
            El nombre es obligatorio
          </p>
          <p v-else-if="$v.nombre.$dirty && !$v.nombre.minLength" class="form-error">
            Mínimo 2 caracteres
          </p>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="$v.email.$model"
            type="email"
            class="form-control"
            :class="{ 'is-invalid': $v.email.$error }"
            autocomplete="email"
            placeholder="nombre@empresa.com"
          />
          <p v-if="$v.email.$dirty && !$v.email.required" class="form-error">
            El email es obligatorio
          </p>
          <p v-else-if="$v.email.$dirty && !$v.email.email" class="form-error">
            Introduce un email válido
          </p>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="pass-wrap">
            <input
              id="password"
              v-model="$v.password.$model"
              :type="showPass ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': $v.password.$error }"
              :autocomplete="registro ? 'new-password' : 'current-password'"
            />
            <button
              type="button"
              class="pass-toggle"
              :aria-label="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showPass = !showPass"
            >
              <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <p v-if="$v.password.$dirty && !$v.password.required" class="form-error">
            La contraseña es obligatoria
          </p>
          <p v-else-if="$v.password.$dirty && !$v.password.minLength" class="form-error">
            Mínimo 6 caracteres
          </p>
        </div>

        <div v-if="registro" class="form-group">
          <label for="confirmar">Confirmar contraseña</label>
          <input
            id="confirmar"
            v-model="$v.confirmar.$model"
            :type="showPass ? 'text' : 'password'"
            class="form-control"
            :class="{ 'is-invalid': $v.confirmar.$error }"
            autocomplete="new-password"
          />
          <p v-if="$v.confirmar.$dirty && !$v.confirmar.sameAsPassword" class="form-error">
            Las contraseñas no coinciden
          </p>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner spinner-light"></span>
          {{ textoBoton }}
        </button>

        <p class="auth-switch">
          {{ registro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?' }}
          <button type="button" class="link-btn" @click="switchMode(!registro)">
            {{ registro ? 'Inicia sesión' : 'Regístrate' }}
          </button>
        </p>
      </form>
    </main>
  </div>
</template>

<script>
import { required, minLength, email, sameAs } from 'vuelidate/lib/validators'
import api from '@/api'
import Mensaje from '@/components/Mensaje.vue'

export default {
  components: { Mensaje },
  data() {
    return {
      registro: false,
      nombre: '',
      email: '',
      password: '',
      confirmar: '',
      showPass: false,
      loading: false,
      errorMsg: null,
    }
  },
  validations() {
    const base = {
      email: { required, email },
      password: { required, minLength: minLength(6) },
      // En login, nombre y confirmar no se validan
      nombre: {},
      confirmar: {},
    }
    if (this.registro) {
      base.nombre = { required, minLength: minLength(2) }
      base.confirmar = { sameAsPassword: sameAs('password') }
    }
    return base
  },
  computed: {
    textoBoton() {
      if (this.loading) return this.registro ? 'Creando cuenta…' : 'Entrando…'
      return this.registro ? 'Crear cuenta' : 'Entrar'
    },
  },
  methods: {
    switchMode(modo) {
      this.registro = modo
      this.errorMsg = null
      this.$v.$reset()
      this.nombre = ''
      this.password = ''
      this.confirmar = ''
    },
    async submit() {
      this.$v.$touch()
      if (this.$v.$invalid) return

      this.loading = true
      this.errorMsg = null

      try {
        const endpoint = this.registro ? '/auth/register' : '/auth/login'
        const payload = this.registro
          ? { nombre: this.nombre, email: this.email, password: this.password }
          : { email: this.email, password: this.password }

        const { data } = await api.post(endpoint, payload)
        localStorage.setItem('token', data.token)
        this.$store.commit('nuevoUsuario', data.user)
        this.$router.push({ name: 'dashboard' })
      } catch (err) {
        this.errorMsg = err.response?.data?.message || 'No se pudo conectar con el servidor'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 440px) 1fr;
  background: var(--bg-surface);
}
.auth-aside {
  background: var(--navy-800);
  color: var(--text-on-dark);
  display: flex;
  flex-direction: column;
  padding: var(--sp-8);
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  font-size: var(--fs-md);
  font-weight: 600;
  color: #fff;
}
.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--accent);
  display: grid;
  place-items: center;
  font-size: 14px;
}
.auth-claim {
  margin: auto 0;
}
.auth-claim h1 {
  color: #fff;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.25;
  margin-bottom: var(--sp-6);
}
.auth-claim ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.auth-claim li {
  display: flex;
  gap: var(--sp-3);
  align-items: baseline;
  font-size: var(--fs-base);
  color: var(--text-on-dark-2);
  margin-bottom: var(--sp-3);
}
.auth-claim li i {
  width: 16px;
  color: #93b4f5;
}
.auth-foot {
  font-size: var(--fs-xs);
  color: var(--text-on-dark-2);
  margin: 0;
}
.auth-main {
  display: grid;
  place-items: center;
  padding: var(--sp-8) var(--sp-4);
  background: var(--bg-app);
}
.auth-form {
  width: 100%;
  max-width: 380px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--sp-8);
}
.auth-form h2 {
  font-size: var(--fs-lg);
}
.auth-sub {
  font-size: var(--fs-sm);
  color: var(--text-3);
  margin: var(--sp-1) 0 var(--sp-6);
}
.pass-wrap {
  position: relative;
}
.pass-wrap .form-control {
  padding-right: 38px;
}
.pass-toggle {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 28px;
  border: 0;
  background: transparent;
  color: var(--text-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.pass-toggle:hover {
  color: var(--text);
}
.btn-block {
  width: 100%;
  height: 38px;
  margin-top: var(--sp-2);
}
.spinner-light {
  width: 14px;
  height: 14px;
  border-color: rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
}
.auth-switch {
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--text-3);
  margin: var(--sp-5) 0 0;
}
.link-btn {
  border: 0;
  background: none;
  padding: 0;
  color: var(--accent);
  font-weight: 500;
  cursor: pointer;
}
.link-btn:hover {
  text-decoration: underline;
}

@media (max-width: 860px) {
  .auth {
    grid-template-columns: 1fr;
  }
  .auth-aside {
    padding: var(--sp-5) var(--sp-6);
  }
  .auth-claim,
  .auth-foot {
    display: none;
  }
}
</style>
