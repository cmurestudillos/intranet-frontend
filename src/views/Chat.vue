<template>
  <div class="chat-page">
    <PageHeader title="Chat" subtitle="Canal general del equipo.">
      <span class="badge-soft" :class="conectado ? 'tone-success' : ''">
        <i class="fas fa-circle estado-dot"></i>
        {{ conectado ? 'En tiempo real' : 'Actualización cada 5 s' }}
      </span>
    </PageHeader>

    <section class="panel chat">
      <div ref="lista" class="mensajes" aria-live="polite">
        <Loading :carga="cargando" mensaje="Cargando mensajes…" />
        <EmptyState
          v-if="!cargando && !mensajes.length"
          icon="far fa-comments"
          title="Todavía no hay mensajes"
          text="Escribe el primero."
        />
        <template v-for="(m, i) in mensajes">
          <div v-if="nuevoDia(i)" :key="m.id + '-dia'" class="separador">
            <span>{{ m.fecha | moment('dddd, D [de] MMMM') }}</span>
          </div>
          <div
            :key="m.id"
            class="mensaje"
            :class="{ propio: m.uid === usuario.uid, agrupado: agrupado(i) }"
          >
            <img
              v-if="!agrupado(i)"
              :src="foto(m.foto)"
              alt=""
              class="avatar"
              width="32"
              height="32"
              @error="onAvatarError"
            />
            <span v-else class="avatar-hueco"></span>
            <div class="burbuja-wrap">
              <div v-if="!agrupado(i)" class="meta">
                <strong>{{ m.uid === usuario.uid ? 'Tú' : m.nombre }}</strong>
                <span>{{ m.fecha | moment('HH:mm') }}</span>
              </div>
              <div class="burbuja">{{ m.mensaje }}</div>
            </div>
          </div>
        </template>
      </div>

      <form class="composer" @submit.prevent="enviar">
        <div class="emoji-wrap">
          <button
            type="button"
            class="btn btn-ghost btn-icon"
            aria-label="Insertar emoji"
            @click.stop="showPicker = !showPicker"
          >
            <i class="far fa-face-smile"></i>
          </button>
          <div v-if="showPicker" class="emoji-picker" @click.stop>
            <button v-for="e in emojis" :key="e" type="button" @click="insertarEmoji(e)">
              {{ e }}
            </button>
          </div>
        </div>
        <input
          ref="input"
          v-model="mensaje"
          type="text"
          class="form-control"
          maxlength="100"
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
        />
        <span class="contador tabular" :class="{ limite: mensaje.length >= 90 }"
          >{{ mensaje.length }}/100</span
        >
        <button type="submit" class="btn btn-primary" :disabled="!mensaje.trim() || enviando">
          <i class="fas fa-paper-plane"></i> Enviar
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { io } from 'socket.io-client'
import moment from 'moment'
import api from '@/api'
import { fileUrl, API_ORIGIN, NO_IMAGE } from '@/utils/url'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Loading from '@/components/Loading.vue'

const POLL_MS = 5000

export default {
  name: 'Chat',
  components: { PageHeader, EmptyState, Loading },
  data() {
    return {
      mensaje: '',
      mensajes: [],
      cargando: true,
      enviando: false,
      showPicker: false,
      socket: null,
      conectado: false,
      poller: null,
      emojis: [
        '😀',
        '😂',
        '😍',
        '😎',
        '🤔',
        '😅',
        '😭',
        '😱',
        '🙏',
        '👍',
        '👎',
        '👏',
        '💪',
        '🤝',
        '❤️',
        '🔥',
        '⭐',
        '💯',
        '🎉',
        '🚀',
        '✅',
        '🙈',
        '🥳',
        '😊',
      ],
    }
  },
  computed: {
    ...mapState(['usuario']),
  },
  methods: {
    foto(url) {
      return fileUrl(url)
    },
    onAvatarError(e) {
      if (!e.target.src.endsWith(NO_IMAGE)) e.target.src = NO_IMAGE
    },
    nuevoDia(i) {
      return i === 0 || !moment(this.mensajes[i].fecha).isSame(this.mensajes[i - 1].fecha, 'day')
    },
    // Mensajes seguidos del mismo autor en menos de 5 min se agrupan
    agrupado(i) {
      if (i === 0 || this.nuevoDia(i)) return false
      const a = this.mensajes[i - 1]
      const b = this.mensajes[i]
      return a.uid === b.uid && b.fecha - a.fecha < 5 * 60 * 1000
    },
    agregar(nuevos) {
      const ids = new Set(this.mensajes.map((m) => m.id))
      const frescos = nuevos.filter((m) => !ids.has(m.id))
      if (!frescos.length) return
      const abajo = this.estaAbajo()
      this.mensajes = [...this.mensajes, ...frescos].sort((a, b) => a.fecha - b.fecha)
      if (abajo) this.bajar()
    },
    estaAbajo() {
      const el = this.$refs.lista
      return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80
    },
    bajar() {
      this.$nextTick(() => {
        const el = this.$refs.lista
        if (el) el.scrollTop = el.scrollHeight
      })
    },
    async cargar() {
      try {
        const { data } = await api.get('/chat')
        this.agregar(data.messages)
      } catch (err) {
        console.error('Error al cargar mensajes:', err.message)
      }
    },
    async enviar() {
      const texto = this.mensaje.trim()
      if (!texto) return
      this.enviando = true
      try {
        if (this.conectado) {
          this.socket.emit('chat:message', { mensaje: texto })
        } else {
          // Sin WebSocket (p. ej. en Vercel): envío por REST
          const { data } = await api.post('/chat', { mensaje: texto })
          this.agregar([data.message])
        }
        this.mensaje = ''
        this.bajar()
      } catch (err) {
        console.error('Error al enviar mensaje:', err.message)
      } finally {
        this.enviando = false
        this.$refs.input.focus()
      }
    },
    insertarEmoji(emoji) {
      this.mensaje = (this.mensaje + emoji).slice(0, 100)
      this.showPicker = false
      this.$refs.input.focus()
    },
    cerrarPicker() {
      this.showPicker = false
    },
    iniciarPolling() {
      if (!this.poller) this.poller = setInterval(this.cargar, POLL_MS)
    },
    pararPolling() {
      clearInterval(this.poller)
      this.poller = null
    },
  },
  async created() {
    await this.cargar()
    this.cargando = false
    this.bajar()

    this.iniciarPolling()
    this.socket = io(API_ORIGIN, {
      auth: { token: localStorage.getItem('token') },
      reconnectionAttempts: 3,
    })
    this.socket.on('connect', () => {
      this.conectado = true
      this.pararPolling()
      this.cargar()
    })
    this.socket.on('disconnect', () => {
      this.conectado = false
      this.iniciarPolling()
    })
    this.socket.on('connect_error', () => {})
    this.socket.on('chat:message', (msg) => this.agregar([msg]))
    this.socket.on('chat:error', (err) => console.error('Error en chat:', err.message))
  },
  mounted() {
    document.addEventListener('click', this.cerrarPicker)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.cerrarPicker)
    this.pararPolling()
    if (this.socket) this.socket.disconnect()
  },
}
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--topbar-h) - 150px);
  min-height: 420px;
  margin-bottom: 0;
}
.estado-dot {
  font-size: 7px;
}
.mensajes {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-5);
}
.separador {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin: var(--sp-4) 0;
  font-size: var(--fs-xs);
  color: var(--text-3);
}
.separador span {
  display: inline-block;
}
.separador span::first-letter {
  text-transform: uppercase;
}
.separador::before,
.separador::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--border);
}
.mensaje {
  display: flex;
  gap: var(--sp-3);
  margin-top: var(--sp-4);
  max-width: 75%;
}
.mensaje.agrupado {
  margin-top: var(--sp-1);
}
.mensaje.propio {
  margin-left: auto;
  flex-direction: row-reverse;
}
.avatar-hueco {
  width: 32px;
  flex-shrink: 0;
}
.burbuja-wrap {
  min-width: 0;
}
.propio .burbuja-wrap {
  text-align: right;
}
.meta {
  display: flex;
  gap: var(--sp-2);
  align-items: baseline;
  font-size: var(--fs-xs);
  color: var(--text-3);
  margin-bottom: 2px;
}
.propio .meta {
  justify-content: flex-end;
}
.meta strong {
  color: var(--text);
  font-weight: 600;
}
.burbuja {
  display: inline-block;
  text-align: left;
  font-size: var(--fs-base);
  padding: 8px 12px;
  border-radius: var(--radius-lg);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  overflow-wrap: anywhere;
}
.propio .burbuja {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.composer {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--border);
  background: var(--bg-subtle);
  border-radius: 0 0 var(--radius) var(--radius);
}
.composer .form-control {
  flex: 1;
}
.contador {
  font-size: var(--fs-xs);
  color: var(--text-3);
  min-width: 44px;
  text-align: right;
}
.contador.limite {
  color: var(--warning);
}
.emoji-wrap {
  position: relative;
}
.emoji-picker {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  display: grid;
  grid-template-columns: repeat(6, 36px);
  gap: 2px;
  padding: var(--sp-2);
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 10;
}
.emoji-picker button {
  border: 0;
  background: transparent;
  font-size: 18px;
  height: 36px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.emoji-picker button:hover {
  background: var(--bg-hover);
}
@media (max-width: 640px) {
  .mensaje {
    max-width: 92%;
  }
  .contador {
    display: none;
  }
}
</style>
