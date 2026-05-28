# SIGTIC Frontend

PWA Angular del Sistema de Gestión de Tickets TI — Unidad de Informática Municipal.

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

**Credenciales de prueba:** `admin` / `admin123` (superuser Django, rol ADMIN)

---

## 3. Build de producción

```bash
ng build
```

Los archivos compilados quedan en `dist/sigtic-frontend/browser/`. Sirve esa carpeta con Nginx o Apache. El service worker (`ngsw-worker.js`) se activa automáticamente en producción.

---

## 4. Estructura del proyecto

```
src/
├── environments/
│   ├── environment.ts              # Dev: apiUrl = '/api/v1'
│   └── environment.production.ts  # Prod: apiUrl = '/api/v1'
├── styles.scss                     # Tema global, badges de estado, layout shell
└── app/
    ├── app.ts                      # Componente raíz → templateUrl: app.html
    ├── app.html                    # Solo <router-outlet />
    ├── app.routes.ts               # Rutas lazy-loaded con authGuard / roleGuard
    ├── app.config.ts               # Providers globales
    │
    ├── core/
    │   ├── auth/
    │   │   ├── auth.service.ts         # Signals: _user, isAuthenticated, rol, esInformatica
    │   │   ├── auth.guard.ts           # loadMe() + defaultIfEmpty → /login
    │   │   ├── role.guard.ts           # roleGuard('ROL1', 'ROL2') factory
    │   │   └── cookie.interceptor.ts   # withCredentials + silent refresh en 401
    │   └── services/
    │       ├── ticket.service.ts
    │       ├── inventario.service.ts
    │       ├── catalogo.service.ts     # shareReplay(1) — catálogos sin re-fetch
    │       └── usuario.service.ts
    │
    ├── shared/
    │   ├── models/                     # Interfaces TypeScript de todos los modelos
    │   └── pipes/
    │       └── replace.pipe.ts         # | replace:'T':' ' para fechas ISO
    │
    ├── layout/
    │   └── shell/shell.component.ts    # Sidebar fijo + toolbar + router-outlet
    │
    └── features/
        ├── auth/login/                 # Formulario login con show/hide password
        ├── dashboard/                  # Métricas por estado + tickets recientes
        ├── tickets/
        │   ├── ticket-list/            # Tabla filtrable por estado
        │   ├── ticket-create/          # Búsqueda dispositivo + alerta IP
        │   ├── ticket-detail/          # Timeline historial + form diagnóstico + PDF
        │   └── transicion-dialog/      # MatDialog: nuevo estado + selector técnico
        ├── inventario/
        │   ├── inventario-list/        # Tabla con filtros tipo / estado / búsqueda
        │   ├── inventario-detail/      # Ficha completa con subtabla dinámica
        │   └── inventario-form/        # Alta/edición, campos dinámicos por tipo
        ├── almacen/                    # Stock consumibles + registro movimientos inline
        ├── bajas/                      # Registro bajas con soporte sin-código
        └── usuarios/                   # Gestión roles + encargados temporales
```

---

## 5. Autenticación

- JWT en **httpOnly cookies** — nunca en localStorage (seguro contra XSS)
- `cookie.interceptor.ts` añade `withCredentials: true` a todas las requests HTTP
- En 401 (fuera de `/auth/`): intenta **silent refresh** → si falla, redirige a `/login`
- `authGuard`: llama a `loadMe()` en cada carga inicial; `defaultIfEmpty` previene el `EmptyError` de Angular cuando no hay sesión

---

## 6. Roles y acceso por sección

| Sección | USUARIO | TECNICO | ENCARGADO_INFO | JEFE_INFO | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tickets (propios) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tickets (todos) | — | ✓ | ✓ | ✓ | ✓ |
| Inventario | — | ✓ | ✓ | ✓ | ✓ |
| Almacén | — | ✓ | ✓ | ✓ | ✓ |
| Bajas | — | ✓ | ✓ | ✓ | ✓ |
| Usuarios | — | — | — | ✓ | ✓ |

---

## 7. PWA

La app es instalable en el escritorio/barra de tareas. En producción Chrome muestra el botón de instalación automáticamente. Configurado en:
- `public/manifest.webmanifest` — nombre, íconos, `display: standalone`
- `ngsw-config.json` — caché de app shell y rutas de API

---

## 8. Proxy (desarrollo)

`proxy.conf.json` redirige `/api` a `http://localhost:8000`. Si el backend corre en otro host o puerto, edita ese archivo. El `angular.json` ya lo referencia en `serve.options.proxyConfig`.

---

## 9. Comandos de referencia

```bash
# Desarrollo
ng serve

# Compilar (modo desarrollo, sin optimizaciones)
ng build --configuration=development

# Build producción
ng build

# Actualizar dependencias
npm outdated
npm update
```
