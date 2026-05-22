<template>
  <v-layout>
    <v-flex>
      <v-card>
        <v-card-text>
          <h3>
            Bienvenido <u>{{ usuario.nombre }}</u>
          </h3>
        </v-card-text>

        <v-card-text style="height: 60vh; overflow: auto" v-chat-scroll>
          <div
            :class="item.nombre === usuario.nombre ? 'text-xs-right' : 'text-xs-left'"
            v-for="(item, index) in mensajes"
            :key="index"
          >
            <v-avatar>
              <img :src="fotoUrl(item.foto)" alt="" />
            </v-avatar>
            <v-chip>{{ item.mensaje }}</v-chip>
            <p class="caption mr-2">{{ item.fechaFormateada }}</p>
          </div>
        </v-card-text>

        <v-card-text>
          <b-row>
            <b-col cols="11">
              <v-form @submit.prevent="enviarMensaje" v-model="valido">
                <v-text-field
                  v-model="mensaje"
                  label="Escribe tu mensaje aquí"
                  required
                  counter="100"
                  :rules="reglas"
                ></v-text-field>
              </v-form>
            </b-col>
            <b-col cols="1" class="emoji-col">
              <span class="emoji-trigger" @click.stop="showPicker = !showPicker">😀</span>
              <div v-if="showPicker" class="emoji-picker" @click.stop>
                <span v-for="e in emojis" :key="e" class="emoji-item" @click="insertarEmoji(e)">{{
                  e
                }}</span>
              </div>
            </b-col>
          </b-row>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapState } from 'vuex'
import { io } from 'socket.io-client'
import moment from 'moment'
import api from '@/api'

export default {
  data() {
    return {
      mensaje: '',
      valido: false,
      reglas: [
        (v) => !!v || 'Tienes que escribir un mensaje...',
        (v) => v.length <= 100 || 'Máx. 100 caracteres.',
      ],
      mensajes: [],
      showPicker: false,
      socket: null,
      emojis: [
        '😀',
        '😂',
        '😍',
        '🥰',
        '😎',
        '🤔',
        '😅',
        '😭',
        '😤',
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
        '🎊',
        '🚀',
        '✅',
        '🤣',
        '🙈',
        '🥳',
        '😊',
        '😴',
        '🤯',
      ],
    }
  },
  computed: {
    ...mapState(['usuario']),
  },
  methods: {
    enviarMensaje() {
      if (this.valido && this.socket) {
        this.socket.emit('chat:message', {
          mensaje: this.mensaje,
          nombre: this.usuario.nombre,
          foto: this.usuario.foto,
        })
        this.mensaje = ''
      }
    },
    insertarEmoji(emoji) {
      this.mensaje += emoji
      this.showPicker = false
    },
    fotoUrl(foto) {
      if (!foto) return '/assets/img/no_image.png'
      if (foto.startsWith('http')) return foto
      return (process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000') + foto
    },
    formatMessage(msg) {
      return {
        ...msg,
        fechaFormateada: moment(msg.fecha).format('lll'),
      }
    },
  },
  async created() {
    moment.locale('es')

    try {
      const { data } = await api.get('/chat')
      this.mensajes = data.messages.map(this.formatMessage)
    } catch (err) {
      console.error('Error al cargar mensajes:', err.message)
    }

    const token = localStorage.getItem('token')
    this.socket = io(process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
    })

    this.socket.on('chat:message', (msg) => {
      this.mensajes.push(this.formatMessage(msg))
    })

    this.socket.on('connect_error', (err) => {
      console.error('Error al conectar socket:', err.message)
    })

    this.socket.on('chat:error', (err) => {
      console.error('Error en chat:', err.message)
    })
  },
  beforeDestroy() {
    if (this.socket) this.socket.disconnect()
  },
}
</script>

<style scoped>
.emoji-col {
  padding: 2em;
  position: relative;
}

.emoji-trigger {
  font-size: 26px;
  cursor: pointer;
  user-select: none;
  line-height: 1;
  display: inline-block;
}

.emoji-trigger:hover {
  transform: scale(1.15);
  display: inline-block;
}

.emoji-picker {
  position: absolute;
  bottom: 52px;
  right: 0;
  width: 220px;
  background: #1e293b;
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  z-index: 100;
}

.emoji-item {
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  line-height: 1;
  transition: background 0.15s ease;
  user-select: none;
}

.emoji-item:hover {
  background: rgba(99, 102, 241, 0.2);
}
</style>
