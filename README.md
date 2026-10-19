# ANISAM

Aplicación web interactiva para la autogestión y el seguimiento del bienestar emocional.

## Integración con Appwrite

El frontend usa **Appwrite** como backend para:

- **Autenticación** con email y contraseña (`Account`).
- **Historial de estados de ánimo** guardado por usuario en una tabla de Appwrite (`TablesDB`).
- **Sincronización**: los registros se guardan en Appwrite y se cachean en `localStorage`
  para funcionar sin conexión. Al iniciar sesión, el historial local se importa a la cuenta.

> Si Appwrite no está configurado, la app sigue funcionando en **modo invitado** con
> `localStorage`.

### Archivos añadidos

| Archivo | Descripción |
| --- | --- |
| `appwrite-config.js` | Endpoint, Project ID, base de datos y tabla. **Aquí pegas tus datos.** |
| `appwrite.js` | Cliente de Appwrite, login/registro y sincronización del historial. |

El SDK se carga por CDN (`appwrite@29`) y la UI de cuenta se agregó al navbar y en un
modal de `index.html`.

---

## Configuración en la consola de Appwrite

Entra a <https://cloud.appwrite.io/console> y abre tu proyecto.

### 1. Plataforma (obligatorio para evitar errores CORS)

`Overview` → **Add a platform** → **Web app**:

- Hostname de desarrollo: `localhost`
- Hostname de producción: el dominio donde publiques el sitio
  (por ejemplo `samithomalca.github.io` si usas GitHub Pages, o tu dominio de Vercel/Netlify).

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

Abre <http://localhost:4321> (o el puerto que uses). El dominio ya está autorizado en
Appwrite, así que el login funcionará directamente.

## Desplegar

Publica los archivos en GitHub Pages, Vercel, Netlify o Appwrite Sites y agrega el
dominio final como **Web platform** en Appwrite. No se necesita build ni variables de
entorno: la configuración vive en `appwrite-config.js`.

> **Seguridad:** el Project ID es público y es seguro incluirlo en el frontend.
> Nunca agregues una **API key** secreta a estos archivos.
