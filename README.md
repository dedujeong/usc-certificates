# USC Certificates

Sistema interno de gestión de certificados académicos: registro de alumnos, carreras, materias, calificaciones y generación del certificado en PDF. Reescritura completa del sistema original (React+Vite / Express+Sequelize / MySQL) sobre Next.js + PostgreSQL + Prisma.

## Stack

- **Next.js 16** (App Router) — frontend y backend en una sola app (Route Handlers), sin CORS.
- **PostgreSQL 16** + **Prisma 6** como ORM.
- **MUI v6** para la UI, **TanStack Query** para fetching/caching del cliente.
- **Zod** para validación de inputs.
- **JWT (localStorage) + bcrypt** para autenticación, roles `admin` / `superAdmin`.
- **Vitest** + **React Testing Library** para tests.
- **Docker** para Postgres en desarrollo y para autohospedaje en producción.

## Desarrollo local

Requisitos: Node 22+, Docker (para Postgres).

```bash
cp .env.example .env          # ajusta DATABASE_URL/JWT_SECRET si hace falta
docker compose up -d postgres # levanta solo Postgres
npm install
npx prisma migrate dev        # aplica el esquema
npx prisma db seed            # datos de ejemplo + usuarios de prueba
npm run dev                   # http://localhost:3000
```

Credenciales de desarrollo creadas por el seed (cámbialas antes de cualquier despliegue real):

| Rol | Email | Password |
|---|---|---|
| superAdmin | `superadmin@usc.dev` | `ChangeMe123!` |
| admin | `admin@usc.dev` | `ChangeMe123!` |

## Tests

```bash
npm test
```

Usa una base de datos de prueba separada (`usc_certificates_test`, en el mismo contenedor de Postgres). Debe existir antes de correr los tests:

```bash
docker exec -it <contenedor-postgres> psql -U usc -d postgres -c "CREATE DATABASE usc_certificates_test OWNER usc;"
```

Las migraciones contra esa base se aplican automáticamente al correr `npm test` (ver `tests/globalSetup.ts`).

## Levantar en Windows con doble clic

Para correr el sistema completo (Postgres + app, ya conectados) en una PC Windows con [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo, sin usar una terminal:

| Archivo | Qué hace |
|---|---|
| `Iniciar.bat` | Crea `.env` con un `JWT_SECRET` nuevo si no existe, aplica migraciones y levanta Postgres + la app en `http://localhost:3000` |
| `Actualizar.bat` | Descarga la última versión desde `github.com/dedujeong/usc-certificates` (rama `main`), respalda la base, aplica migraciones y reconstruye la app. Si la carpeta se descargó como .zip, la enlaza al repositorio automáticamente. Requiere [Git](https://git-scm.com/download/win); se niega a actualizar si hay archivos versionados modificados a mano |
| `Detener.bat` | Apaga los contenedores (los datos se conservan) |
| `Reiniciar.bat` | `Detener` + `Iniciar` |
| `Sembrar.bat` | Carga el catálogo (carreras, materias, firmantes, campos del certificado) y los usuarios de prueba — solo hace falta en una base vacía |
| `Respaldar.bat` | Genera un respaldo de la base en `backups\usc_certificates_<fecha>.zip` y conserva solo los 10 más recientes |
| `Restaurar.bat` | Lista los respaldos disponibles y restaura el que elijas (pide confirmación: sobreescribe la base actual) |
| `Estado.bat` / `Logs.bat` | Para diagnosticar si algo no levanta |

Todos son lanzadores de `usc.ps1` (PowerShell) — no modifican `docker-compose.yml` ni el `Dockerfile`, solo los orquestan.

## Despliegue con Docker (autohospedaje)

```bash
export JWT_SECRET="un-secreto-largo-y-aleatorio"
docker compose --profile prod build
docker compose --profile prod run --rm migrate   # aplica migraciones pendientes
docker compose --profile prod up -d app          # http://localhost:3000
```

El `Dockerfile` usa un build multi-stage con la salida `standalone` de Next.js (imagen final sin `node_modules` completo). El servicio `migrate` reutiliza la etapa `builder` (que sí tiene el CLI de Prisma) para aplicar el esquema antes de levantar `app`. Vuelve a correr `migrate` después de cada despliegue que incluya cambios de esquema.

Variables de entorno requeridas en producción: `DATABASE_URL`, `JWT_SECRET` (el compose falla explícitamente si falta), `JWT_EXPIRES_IN` (opcional, default `8h`).

## Estructura del proyecto

```
app/
  (public)/login/          # página de login
  (protected)/              # layout con guard de sesión (CSR)
  api/                       # Route Handlers por recurso
lib/
  auth/                      # JWT, bcrypt, guards, AuthContext (cliente)
  server/                    # handleRoute (manejo de errores uniforme), crudFactory, services
  validators/                # schemas Zod compartidos
  api/                       # cliente API tipado (TanStack Query)
certificate/
  render/                    # generador de PDF (jsPDF), modularizado
prisma/
  schema.prisma, seed.ts, migrations/
```

## Decisiones de diseño relevantes

- **Auth**: JWT en `localStorage` (no cookies httpOnly) — decisión ya documentada en el diseño original del épico de autenticación, para una herramienta interna de bajo riesgo de XSS externo. El guard de rutas protegidas es puramente client-side (puede haber un parpadeo breve al recargar), por fidelidad a ese diseño.
- **Matrícula de alumnos**: se genera con una secuencia de Postgres (`student_tuition_seq`), consumida atómicamente en el insert — evita colisiones bajo registros concurrentes (bug presente en el sistema anterior, que calculaba el siguiente número en el cliente).
- **Inscripción a carrera**: solo puede haber una inscripción *activa* por alumno (índice único parcial en Postgres), pero sí se permite re-inscribir a un alumno en otra carrera después de dar de baja la inscripción anterior (el sistema anterior lo bloqueaba indefinidamente).
- **Calificaciones**: `Decimal(3,1)` exacto (el sistema anterior usaba `INTEGER`, truncando decimales).
- **Generador de certificado**: motor de texto con formato (`*negrita*`, `_subrayado_`) heredado tal cual del sistema anterior por ser una pieza ya validada visualmente; lo que cambió es que ya no mezcla fetch de datos con renderizado, y las fuentes/imágenes son archivos reales en `public/` en vez de base64 embebido en código.
