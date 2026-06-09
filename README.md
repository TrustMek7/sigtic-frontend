# Gestión Interna de Informática — Frontend

PWA Angular del sistema de gestión de tickets, inventario y almacén para la Unidad de Informática — Municipalidad Distrital de Cayma.

**Stack:** Angular 21 · Angular Material 3 · Standalone components · Signals · PWA (Service Worker)

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Node.js | 20 | `node --version` |
| Angular CLI | 21 | `ng version` |

El backend Django debe estar corriendo en `http://localhost:8000` antes de iniciar el frontend.

---

## 1. Instalación

```bash
cd sigtic-frontend
npm install
```

---

## 2. Servidor de desarrollo

```bash
ng serve
```

Abre `http://localhost:4200`. El proxy en `proxy.conf.json` redirige automáticamente `/api/*` al backend en `localhost:8000`.

**Credenciales de prueba:**

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| `jefe_info` | `Jefe123!` | JEFE_INFO |
| `encargado_demo` | `Encargado123!` | ENCARGADO_INFO |
| `tecnico_demo` | `Tecnico123!` | TECNICO |
| `usuario_demo` | `Usuario123!` | USUARIO |

> Estos usuarios solo existen si ejecutaste `load_inventario.py` o `seed_demo`. Ver README del backend.

---

## 3. Build de producción

```bash
ng build
```

Los archivos compilados quedan en `dist/sigtic-frontend/browser/`. El service worker (`ngsw-worker.js`) se activa automáticamente en producción.

---

## 4. Estructura del proyecto

```
src/
├── index.html                          # Título: "Gestión Interna de Informática"
├── styles.scss                         # Tokens CSS, tema global, badges, toasts, animaciones
└── app/
    ├── app.ts                          # Componente raíz → <router-outlet />
    ├── app.routes.ts                   # Rutas lazy-loaded con authGuard / roleGuard
    ├── app.config.ts                   # Providers globales (HTTP, Router, Animations)
    │
    ├── core/
    │   ├── auth/
    │   │   ├── auth.service.ts         # Signals: _user, isAuthenticated, rol, esInformatica,
    │   │   │                           #          esJefeOEncargado, esJefe, esTecnico
    │   │   ├── auth.guard.ts           # loadMe() + defaultIfEmpty → /login
    │   │   ├── role.guard.ts           # roleGuard('ROL1', 'ROL2') factory
    │   │   └── cookie.interceptor.ts   # withCredentials + silent refresh en 401
    │   └── services/
    │       ├── ticket.service.ts       # list({ estado?, tecnico? }), CRUD, transicion, PDF
    │       ├── inventario.service.ts   # CRUD dispositivos, búsqueda por código
    │       ├── catalogo.service.ts     # shareReplay(1) — catálogos sin re-fetch
    │       ├── usuario.service.ts      # Roles, encargados temporales
    │       └── toast.service.ts        # Notificaciones: success/error/warning/info/successWithAction
    │
    ├── shared/
    │   ├── models/                     # Interfaces TypeScript de todos los modelos
    │   └── pipes/
    │       └── replace.pipe.ts         # | replace:'T':' ' para fechas ISO
    │
    ├── layout/
    │   └── shell/shell.component.ts    # Sidebar oscuro + toolbar blanca + breadcrumb reactivo
    │
    └── features/
        ├── auth/login/                 # Glassmorphism + blobs animados + logo Escudo de Cayma
        ├── dashboard/                  # KPI cards por estado + tabla de tickets recientes
        ├── tickets/
        │   ├── ticket-list/            # Tabs para técnicos (todos / mis asignados) + filtro estado
        │   ├── ticket-create/          # Búsqueda dispositivo por código + alerta IP
        │   ├── ticket-detail/          # Timeline historial + form diagnóstico + generación PDF
        │   └── transicion-dialog/      # MatDialog: nuevo estado + asignación de técnico
        ├── inventario/
        │   ├── inventario-list/        # Tabla con filtros: tipo / estado / búsqueda libre
        │   ├── inventario-detail/      # Ficha completa con subtabla dinámica por tipo
        │   └── inventario-form/        # Alta/edición, secciones dinámicas según tipo
        ├── almacen/                    # Stock consumibles + filtros + registro movimientos inline
        ├── bajas/                      # Registro de bajas (con o sin código de inventario)
        └── usuarios/                   # Gestión de roles + encargados temporales con historial
```

---

## 5. Sistema de diseño

El UI sigue los principios de **Stripe + Atlassian + Material 3** (sin estilos "neón"):

| Token | Valor | Uso |
|---|---|---|
| `--c-primary` | `#2563EB` | Botones, links, foco |
| `--c-secondary` | `#06B6D4` | Acentos, gradientes |
| `--c-sidebar` | `#0F172A` | Fondo del menú lateral |
| `--c-bg` | `#F5F7FB` | Fondo de la aplicación |
| `--c-text` | `#0F172A` | Texto principal |
| `--c-text-muted` | `#64748B` | Textos secundarios |

**Tipografía:** Inter (Google Fonts) — misma fuente que Stripe, Linear y Vercel. Subtitulada por Roboto como fallback.

**Logo:** Escudo de la Municipalidad Distrital de Cayma (`public/img/Escudo-cayma.png`) — aparece en el sidebar y en la pantalla de login dentro de un contenedor circular con sombra.

**Animaciones:**
- Login: degradado pulsante de fondo (`gradientShift`) + tarjeta con `fadeInUp` + tres blobs difuminados (`blobFloat`)
- Toasts: deslizamiento desde la derecha (`toastSlideIn`)
- Selects: apertura con `fadeInUp` suave

---

## 6. Notificaciones (ToastService)

Todas las notificaciones de la aplicación pasan por `ToastService`. Aparecen en la esquina superior derecha con animación de deslizamiento.

```typescript
// Uso en cualquier componente
private toast = inject(ToastService);

this.toast.success('Ticket creado.');
this.toast.error('Error al conectar con el servidor.');
this.toast.warning('Completa todos los campos requeridos.');
this.toast.info('Procesando...');

// Con botón de acción (ej: descarga de PDF)
this.toast.successWithAction('Documento generado', 'Descargar')
  .onAction().subscribe(() => window.open(url, '_blank'));
```

| Tipo | Color | Duración |
|---|---|---|
| `success` | Verde `#059669` | 3 s |
| `error` | Rojo `#DC2626` | 6 s |
| `warning` | Ámbar `#D97706` | 4 s |
| `info` | Azul `#2563EB` | 3 s |

---

## 7. Roles y acceso por sección

| Sección | USUARIO | TECNICO | ENCARGADO_INFO | JEFE_INFO | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear ticket | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver tickets (propios) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver tickets (todos) | — | ✓ | ✓ | ✓ | ✓ |
| **Cambiar estado del ticket** | — | — | ✓ | ✓ | ✓ |
| Registrar diagnóstico | — | ✓ | ✓ | ✓ | ✓ |
| Generar PDF oficial | — | — | ✓ | ✓ | ✓ |
| Inventario | — | ✓ | ✓ | ✓ | ✓ |
| Almacén | — | ✓ | ✓ | ✓ | ✓ |
| Bajas | — | ✓ | ✓ | ✓ | ✓ |
| Gestión de usuarios | — | — | — | ✓ | ✓ |

### Vista de tickets para técnicos

Los técnicos ven dos pestañas en la lista de tickets:

- **Tickets de Informática** — todos los tickets del sistema (con contador)
- **Mis tickets asignados** — solo los tickets donde el técnico está asignado (contador azul)

El filtrado de "Mis tickets" se realiza en el frontend sobre los mismos datos cargados (sin segunda llamada al API), usando `t.tecnico === auth.user().id`.

---

## 8. Autenticación

- JWT en **httpOnly cookies** — nunca en localStorage (seguro contra XSS)
- `cookie.interceptor.ts` añade `withCredentials: true` a todas las requests
- En 401 (fuera de `/auth/`): intenta **silent refresh** → si falla, redirige a `/login`
- `authGuard`: llama a `loadMe()` en cada carga inicial
- Login inválido y campos vacíos muestran toast de error/advertencia (no mensaje inline)

---

## 9. PWA

La app es instalable. En producción Chrome muestra el botón de instalación automáticamente.

- `public/manifest.webmanifest` — nombre, íconos, `display: standalone`
- `ngsw-config.json` — caché de app shell y rutas de API

---

## 10. Proxy (desarrollo)

`proxy.conf.json` redirige `/api` a `http://localhost:8000`. Si el backend corre en otro host, edita ese archivo. El `angular.json` ya lo referencia en `serve.options.proxyConfig`.

---

## 11. Comandos de referencia

```bash
# Desarrollo
ng serve

# Build desarrollo (sin optimizaciones)
ng build --configuration=development

# Build producción
ng build

# Actualizar dependencias
npm outdated
npm update
```
