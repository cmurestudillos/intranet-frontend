<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- Header con degradado -->
      <div class="auth-header" :class="registro ? 'auth-header--register' : 'auth-header--login'">
        <div class="auth-logo">
          <i class="fas fa-shield-alt"></i>
        </div>
        <h1 class="auth-title">{{ registro ? 'Crear cuenta' : 'Bienvenido' }}</h1>
        <p class="auth-subtitle">
          {{
            registro
              ? 'Rellena los campos para registrarte'
              : 'Introduce tus credenciales para acceder'
          }}
        </p>
      </div>

      <!-- Formulario -->
      <div class="auth-body">
        <!-- Nombre (solo registro) -->
        <transition name="slide-down">
          <div v-if="registro" class="auth-field">
            <label class="auth-label">Nombre</label>
            <div class="auth-input-wrap">
              <i class="fas fa-user auth-input-icon"></i>
              <input
                v-model.trim="$v.nombre.$model"
                type="text"
                class="auth-input"
                placeholder="Tu nombre completo"
                autocomplete="name"
                :class="{ 'auth-input--error': $v.nombre.$dirty && $v.nombre.$error }"
              />
            </div>
            <span class="auth-error" v-if="$v.nombre.$dirty && !$v.nombre.required">
              El nombre es obligatorio
            </span>
            <span class="auth-error" v-if="$v.nombre.$dirty && !$v.nombre.minLength">
              Mínimo 2 caracteres
            </span>
          </div>
        </transition>

        <!-- Email -->
        <div class="auth-field">
          <label class="auth-label">Email</label>
          <div class="auth-input-wrap">
            <i class="fas fa-envelope auth-input-icon"></i>
            <input
              v-model.trim="$v.email.$model"
              type="email"
              class="auth-input"
              placeholder="correo@ejemplo.com"
              autocomplete="email"
              :class="{ 'auth-input--error': $v.email.$dirty && $v.email.$error }"
            />
          </div>
          <span class="auth-error" v-if="$v.email.$dirty && !$v.email.required">
            El email es obligatorio
          </span>
          <span class="auth-error" v-if="$v.email.$dirty && !$v.email.email">
            Introduce un email válido
          </span>
        </div>

        <!-- Contraseña -->
        <div class="auth-field">
          <label class="auth-label">Contraseña</label>
          <div class="auth-input-wrap">
            <i class="fas fa-lock auth-input-icon"></i>
            <input
              v-model="$v.password.$model"
              :type="showPass ? 'text' : 'password'"
              class="auth-input auth-input--with-toggle"
              placeholder="Mínimo 6 caracteres"
              autocomplete="current-password"
              :class="{ 'auth-input--error': $v.password.$dirty && $v.password.$error }"
            />
            <button
              type="button"
              class="auth-toggle-pass"
              @click="showPass = !showPass"
              tabindex="-1"
            >
              <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <span class="auth-error" v-if="$v.password.$dirty && !$v.password.required">
            La contraseña es obligatoria
          </span>
          <span class="auth-error" v-if="$v.password.$dirty && !$v.password.minLength">
            Mínimo 6 caracteres
          </span>
        </div>

        <!-- Confirmar contraseña (solo registro) -->
        <transition name="slide-down">
          <div v-if="registro" class="auth-field">
            <label class="auth-label">Confirmar contraseña</label>
            <div class="auth-input-wrap">
              <i class="fas fa-lock auth-input-icon"></i>
              <input
                v-model="$v.confirmar.$model"
                :type="showConfirm ? 'text' : 'password'"
                class="auth-input auth-input--with-toggle"
                placeholder="Repite la contraseña"
                autocomplete="new-password"
                :class="{ 'auth-input--error': $v.confirmar.$dirty && $v.confirmar.$error }"
              />
              <button
                type="button"
                class="auth-toggle-pass"
                @click="showConfirm = !showConfirm"
                tabindex="-1"
              >
                <i :class="showConfirm ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <span class="auth-error" v-if="$v.confirmar.$dirty && !$v.confirmar.sameAsPassword">
              Las contraseñas no coinciden
            </span>
          </div>
        </transition>

        <!-- Error global -->
        <transition name="fade">
          <div v-if="errorMsg" class="auth-alert">
            <i class="fas fa-exclamation-circle"></i>
            {{ errorMsg }}
          </div>
        </transition>

        <!-- Botón submit -->
        <button
          class="auth-btn"
          :class="registro ? 'auth-btn--register' : 'auth-btn--login'"
          :disabled="loading"
          @click="submit"
        >
          <span v-if="!loading">
            <i :class="registro ? 'fas fa-user-plus' : 'fas fa-sign-in-alt'"></i>
            {{ registro ? 'Crear cuenta' : 'Entrar' }}
          </span>
          <span v-else class="auth-spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            {{ registro ? 'Creando cuenta...' : 'Entrando...' }}
          </span>
        </button>

        <!-- Toggle login / registro -->
        <div class="auth-switch">
          <template v-if="!registro">
            ¿No tienes cuenta?
            <button class="auth-switch-btn" @click="switchMode(true)">Regístrate</button>
          </template>
          <template v-else>
            ¿Ya tienes cuenta?
            <button class="auth-switch-btn" @click="switchMode(false)">Inicia sesión</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { required, minLength, email, sameAs } from 'vuelidate/lib/validators'
import api from '@/api'

export default {
  data() {
    return {
      registro: false,
      nombre: '',
      email: '',
      password: '',
      confirmar: '',
      showPass: false,
      showConfirm: false,
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
  methods: {
    switchMode(modo) {
      this.registro = modo
      this.errorMsg = null
      this.$v.$reset()
      this.nombre = ''
      this.email = ''
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
        this.$router.push({ name: 'home' })
      } catch (err) {
        this.errorMsg = err.response?.data?.message || 'Error al conectar con el servidor'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
/* ── Wrapper centrado ─────────────────────── */
.auth-wrapper {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

/* ── Card ─────────────────────────────────── */
.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(99, 102, 241, 0.1);
  overflow: hidden;
  animation: fadeInUp 0.4s ease both;
}

/* ── Header ───────────────────────────────── */
.auth-header {
  padding: 32px 28px 24px;
  text-align: center;
  position: relative;
}
.auth-header--login {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
}
.auth-header--register {
  background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
}

.auth-logo {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  font-size: 1.4rem;
  color: #fff;
  backdrop-filter: blur(8px);
}

.auth-title {
  font-family: 'Inter', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

/* ── Body ─────────────────────────────────── */
.auth-body {
  padding: 28px 28px 24px;
}

/* ── Field ────────────────────────────────── */
.auth-field {
  margin-bottom: 18px;
}

.auth-label {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}

.auth-input-wrap {
  position: relative;
}

.auth-input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: #475569;
  pointer-events: none;
}

.auth-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 8px;
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  outline: none;
  box-sizing: border-box;
}
.auth-input::placeholder {
  color: #475569;
}
.auth-input:focus {
  border-color: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  background: rgba(15, 23, 42, 0.8);
}
.auth-input--error {
  border-color: rgba(239, 68, 68, 0.5) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}
.auth-input--with-toggle {
  padding-right: 40px;
}

/* Botón mostrar/ocultar contraseña */
.auth-toggle-pass {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #475569;
  cursor: pointer;
  padding: 4px;
  font-size: 0.85rem;
  transition: color 0.2s ease;
}
.auth-toggle-pass:hover {
  color: #818cf8;
}

/* ── Errores de campo ─────────────────────── */
.auth-error {
  display: block;
  font-family: 'Inter', sans-serif;
  font-size: 0.75rem;
  color: #f87171;
  margin-top: 5px;
}

/* ── Alerta de error global ───────────────── */
.auth-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 18px;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  color: #fca5a5;
}

/* ── Botón principal ──────────────────────── */
.auth-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.auth-btn--login {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
}
.auth-btn--login:hover:not(:disabled) {
  background: linear-gradient(135deg, #4338ca, #4f46e5);
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.5);
  transform: translateY(-1px);
}
.auth-btn--register {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}
.auth-btn--register:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #059669);
  box-shadow: 0 4px 24px rgba(16, 185, 129, 0.5);
  transform: translateY(-1px);
}
.auth-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none !important;
}

.auth-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Switch login/registro ────────────────── */
.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  color: #64748b;
}
.auth-switch-btn {
  background: none;
  border: none;
  color: #818cf8;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s ease;
}
.auth-switch-btn:hover {
  color: #a5b4fc;
  text-decoration: underline;
}

/* ── Animaciones ──────────────────────────── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}
.slide-down-enter-to,
.slide-down-leave {
  opacity: 1;
  max-height: 120px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
