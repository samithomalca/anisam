# ANISAM

Aplicación web interactiva para la autogestión y el seguimiento del bienestar emocional.

## 🚀 Producción

**URL pública: <https://anisam-taupe.vercel.app>**

- Desplegada en **Vercel** (proyecto `anisam`, team `munik-s-projects`).
- **Auto-deploy**: cada push a la rama `main` publica automáticamente en producción.
- Estado: sin build, servida como sitio estático (`vercel.json` con URLs limpias y
  cabeceras de seguridad).
- Plataforma autorizada en Appwrite: `anisam-taupe.vercel.app`

## Integración con Appwrite

El frontend usa **Appwrite** como backend para:

- **Autenticación** con email y contraseña (`Account`).
- **Historial de estados de ánimo** guardado por usuario en una tabla de Appwrite (`TablesDB`).
- **Sincronización**: los registros se guardan en Appwrite y se cachean en `localStorage`
  para funcionar sin conexión. Al iniciar sesión, el historial local se importa a la cuenta.

> Si Appwrite no está configurado, la app sigue funcionando en **modo invitado** con
> `localStorage`.

### 🔒 Control de acceso (Auth Guard)

La aplicación está **bloqueada hasta iniciar sesión**. Internamente usa tres estados que se
reflejan en el atributo `data-auth-state` del `<body>`:

| Estado | Qué se ve |
| --- | --- |
| `loading` | Nada (se está comprobando la sesión con Appwrite) |
| `locked` | Solo la **pantalla de acceso** (`#auth-gate`). El dashboard queda oculto. |
| `unlocked` | El dashboard completo, en la pantalla de inicio |

Comportamiento:

- **Sin sesión activa** → se muestra únicamente el formulario de login/registro con el
  fondo bloqueado. La navegación del dashboard y el modal del navbar quedan deshabilitados
  (`switchScreen` se ignora mientras el guard esté bloqueado).
- **Al registrarse o iniciar sesión** → se desbloquea y entra automáticamente al inicio.
- **Al pulsar "Salir"** → se cierra la sesión en Appwrite, se limpia el formulario y se
  vuelve a bloquear la pantalla.
- **Al recargar la página** con una sesión válida → se entra directamente al dashboard, sin
  parpadeo del contenido.

Desde el código puedes consultarlo con `window.AnisamGuard`:

```js
window.AnisamGuard.getState();   // 'loading' | 'locked' | 'unlocked'
window.AnisamGuard.isLocked();   // true si no hay sesión
window.AnisamGuard.isUnlocked(); // true si hay sesión
window.AnisamGuard.onChange((state, user) => { /* reaccionar al cambio */ });
```


### Archivos añadidos

| Archivo | Descripción |
| --- | --- |
| `appwrite-config.js` | Endpoint, Project ID, base de datos y tabla. **Aquí pegas tus datos.** |
| `appwrite.js` | Cliente de Appwrite, login/registro, **Auth Guard** y sincronización del historial. |
| `vercel.json` | Configuración de despliegue en Vercel (sin build, headers, URLs limpias). |

El SDK se carga por CDN (`appwrite@29`) y la UI de cuenta se agregó al navbar y en un
modal de `index.html`.

---

## Configuración en la consola de Appwrite

Entra a <https://cloud.appwrite.io/console> y abre tu proyecto.

### 1. Plataforma (obligatorio para evitar errores CORS)

`Overview` → **Add a platform** → **Web app**.

> ⚠️ **El plan Free de Appwrite solo permite 1 plataforma web**, y en este proyecto ya la
> ocupa la de producción: **`anisam-taupe.vercel.app`**. No se puede agregar una segunda.

Consecuencia práctica:

- La **app en producción funciona** con login y guardado en Appwrite.
- Para **probar en local** (`http://localhost:4321`) tendrías que borrar temporalmente la
  plataforma de Vercel y agregar `127.0.0.1`, y luego revertirlo. Otra opción es pasar a un
  plan de pago para tener varias plataformas a la vez.

Si algún día cambias de dominio (dominio propio, GitHub Pages, preview deployments de
Vercel), reemplaza el hostname así:

1. `Overview` → borra la plataforma actual.
2. **Add a platform** → **Web app** → nuevo hostname (sin `https://` ni barras):
   - `anisam-taupe.vercel.app` (actual, producción)
   - `samithomalca.github.io` (si usaras GitHub Pages)
   - `tudominio.com` (dominio propio)

### 2. Autenticación con email

`Auth` → **Settings** → activa **Email/Password**.
Opcional: exige verificación de email si lo necesitas.

### 3. Base de datos y tabla

> **Ya creadas en este proyecto.** El plan Free permite una sola base de datos, así que se
> usa la existente **Production TablesDB**. Estos son los IDs reales:

- Database ID: `6ad644c7001212715993` (Production TablesDB)
- Table ID: `6ad645330023c95ed756` (nombre `mood_entries`)

La tabla tiene estas columnas (todas requeridas y ya creadas):

| Columna | Tipo | Tamaño | Requerida |
| --- | --- | --- | --- |
| `clientId` | varchar | 64 | Sí |
| `date` | varchar | 64 | Sí |
| `moodKey` | varchar | 32 | Sí |
| `moodLabel` | varchar | 32 | Sí |
| `emoji` | varchar | 16 | Sí |
| `intensity` | integer | — | Sí |
| `note` | text | — | Sí |

### 4. Permisos (privacidad por usuario)

En la tabla `mood_entries` → **Settings**:

1. Activa **Row security**.
2. En **Permissions**, agrega únicamente:
   - **Create** → rol **Users** (cualquier usuario autenticado).

Los permisos de lectura, actualización y borrado se asignan fila por fila desde el
código (`Permission.read/update/delete(Role.user(userId))`), por lo que **cada usuario
solo puede ver su propio historial**.

### 5. Conectar el proyecto

`appwrite-config.js` ya está configurado con:

- Endpoint (región FRA): `https://fra.cloud.appwrite.io/v1`
- Project ID: `6abda2040008ae6691ea`
- Database ID: `6ad644c7001212715993`
- Table ID: `6ad645330023c95ed756`

Si cambias de proyecto o región, copia el endpoint desde `Settings → Overview` y
actualiza esos cuatro valores.

---

## Ejecutar localmente

El proyecto es estático. Sirve la carpeta con cualquier servidor HTTP:

```bash
npx serve . -l 4321
# o
python -m http.server 5500
```

Abre <http://localhost:4321> (o el puerto que uses).

> ⚠️ Por el límite de 1 plataforma del plan Free, **el login no funcionará en local**
> mientras la plataforma activa sea la de Vercel. La app sí cargará en modo invitado con
> `localStorage`. Ver [sección 1](#1-plataforma-obligatorio-para-evitar-errores-cors).

## Desplegar

### Vercel (configuración actual)

El proyecto ya está desplegado y vinculado. Cada push a `main` publica automáticamente:

```bash
git push origin main        # dispara un deploy de producción
```

Para desplegar manualmente desde la CLI:

```bash
vercel link --yes --project anisam
vercel --prod
```

No hay build ni variables de entorno: la configuración vive en `appwrite-config.js` y el
proyecto se sirve como sitio estático.

### Otros proveedores

También puedes publicar en GitHub Pages, Netlify o Appwrite Sites. En cualquier caso,
recuerda actualizar la **Web platform** en Appwrite con el nuevo dominio
(ver [sección 1](#1-plataforma-obligatorio-para-evitar-errores-cors)); si no lo haces, la
app cargará pero el login fallará por CORS.

> **Seguridad:** el Project ID es público y es seguro incluirlo en el frontend.
> Nunca agregues una **API key** secreta a estos archivos.
