# Intranet — Frontend

SPA Vue 2 para la aplicación de intranet personal. Dark mode + glassmorphism + Font Awesome 6.

## Stack

| Tecnología | Versión | Rol |
|-----------|---------|-----|
| Vue.js | 2.7.16 | Framework principal |
| Vuex | 3.6.2 | Estado global |
| Vue Router | 3.6.5 | Enrutamiento SPA |
| Axios | ^1.7 | Comunicación con API |
| Socket.io Client | ^4.8 | Chat en tiempo real |
| Vuetify | 1.5.24 | Componentes UI (`iconfont: 'fa5'`) |
| Bootstrap Vue | 2.23.1 | Componentes Bootstrap |
| Vuelidate | 0.7.7 | Validación de formularios |
| ApexCharts | ^3.54 | Gráficas del dashboard |
| Font Awesome | 6.7.2 | Iconos |
| SweetAlert2 | ^11.15 | Modales |
| Vue CLI | 5.0.8 | Build tools |
| pnpm | 11.1.3 | Package manager |

## Requisitos

- Node.js 18+
- pnpm 11+ → `npm install -g pnpm`
- Backend corriendo en `http://localhost:3000`

## Instalación

```bash
pnpm install
cp .env.local.example .env.local   # Editar URLs del backend
pnpm dev                            # http://localhost:8080
```

> **Importante:** El archivo `.env` apunta a la URL de producción (Vercel).
> Siempre usa `.env.local` para desarrollo local — tiene prioridad sobre `.env`.

## Variables de entorno

**`.env.local`** (desarrollo local):
```env
VUE_APP_API_URL=http://localhost:3000/api
VUE_APP_SOCKET_URL=http://localhost:3000
```

**`.env.local`** (apuntando a Vercel):
```env
VUE_APP_API_URL=https://tu-backend.vercel.app/api
VUE_APP_SOCKET_URL=https://tu-backend.vercel.app
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor de desarrollo con HMR (puerto 8080) |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm lint` | ESLint + Prettier |
| `pnpm lint:fix` | Corrige errores automáticamente |

## Estructura

```
src/
├── api/
│   └── index.js          # Axios: baseURL desde env, interceptor JWT, redirige en 401
├── views/
│   ├── Ingreso.vue        # Login + Registro (email/contraseña, Vuelidate, dark card)
│   ├── Home.vue           # Perfil y upload de avatar
│   ├── Chat.vue           # Chat (historial REST + Socket.io + picker emoji propio)
│   ├── Dashboard/
│   │   ├── DashBoard.vue  # Contenedor gráficas
│   │   └── Linea.vue      # ApexCharts (series como computed — reactivo)
│   ├── Tareas/
│   │   ├── CheckList.vue  # Tabs pendientes/completadas
│   │   ├── ListadoTareas.vue # Items con drag&drop (vuedraggable)
│   │   ├── Agregar.vue    # Formulario nueva tarea
│   │   └── Editar.vue     # Formulario editar tarea
│   └── Drive/
│       ├── Drive.vue      # Tabs listado/subida
│       ├── ListadoArchivos.vue
│       ├── Tarjeta.vue    # Card por documento con preview
│       └── CargaArchivos.vue
├── components/
│   ├── Navbar.vue         # Toolbar + sidebar (iconos <i> directos, avatar con fallback)
│   ├── Loading.vue
│   ├── Mensaje.vue
│   ├── Buscador.vue
│   └── Filtro.vue
├── store.js               # Vuex: estado, mutations, actions async/await
├── router.js              # Guards basados en localStorage token
└── main.js                # Verifica JWT al arrancar → GET /api/auth/me
```

## Convenciones importantes

### Iconos
Siempre usar `<i>` directamente, **nunca** `<v-icon class="fas ...">`:
```html
<!-- ✅ Correcto -->
<i class="fas fa-home"></i>

<!-- ❌ Incorrecto — Vuetify 1.x añade material-icons y el icono no aparece -->
<v-icon class="fas fa-home"></v-icon>
```

### URLs de archivos del backend
Los archivos subidos (avatar, documentos) se devuelven como rutas relativas (`/uploads/...`).
Usar el helper `fotoUrl()` / `resolveUrl()` para añadir el origen del backend:
```js
fotoUrl(foto) {
  if (!foto) return '/assets/img/no_image.png'
  if (foto.startsWith('http')) return foto
  return (process.env.VUE_APP_SOCKET_URL || 'http://localhost:3000') + foto
}
```

### Rutas de assets estáticos
Siempre con `/` inicial para que funcionen desde cualquier ruta:
```html
<!-- ✅ -->
<img src="/assets/img/no_image.png" />

<!-- ❌ Roto en sub-rutas como /chat -->
<img src="assets/img/no_image.png" />
```

### Gráficas (ApexCharts)
El estado de las gráficas en Vuex es siempre `[]`. En `Linea.vue`, `series` es un `computed` (no `data`) para reactividad automática cuando llegan los datos async.

## Design System

- **Tema:** Dark mode — fondo `#0f172a`, superficies `#1e293b`
- **Paleta:** Primario `#6366f1` (indigo) · Acento `#38bdf8` (cyan)
- **Tipografía:** Inter (300–800)
- **Glassmorphism:** `backdrop-filter: blur(16px)` en cards
- **CSS global:** `public/assets/css/styles.css` (23 secciones, ~400 líneas)

## Notas de configuración

- `babel.config.js`: `useBuiltIns: false` — no añadir core-js (conflicto con pnpm 11)
- `.npmrc`: `ignore-scripts=true` — necesario para que pnpm 11 no bloquee el arranque
- `vuetify.js`: `iconfont: 'fa5'` — necesario para Font Awesome 6
