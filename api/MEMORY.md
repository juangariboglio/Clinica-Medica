# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual (2026-10-22)
- Repo: `github.com/juangariboglio/Clinica-Medica`, rama `main` con 4 commits publicados.
  Último: `b6426e8` (roles, auditoría, ticket WS y endurecimiento). README raíz con captura
  real en `api/docs/capturas/interfaz.png`.
- Backend: Spring Boot 4.1.2 + Security 7 + Hibernate 7 + Java 17 + MySQL (Flyway V1–V9,
  ddl-auto=validate). Arranca con `mvnw.cmd spring-boot:run`.
- Configuración: `application.properties` exige `VOLLMED_DB_PASSWORD` (sin valor por
  defecto); JWT con `VOLLMED_JWT_SECRET` (en producción obligatorio, sin default). Bases:
  `vollmed_api` y `vollmed_api_test`. Producción exige `WEBSOCKET_ALLOWED_ORIGINS` y TLS MySQL.
- Seguridad: roles `ROLE_ADMIN`/`ROLE_RECEPCION`, auditoría en tabla `auditoria`, login
  limitado por IP (10 fallos/15 min), ticket WebSocket efímero, CSP y Swagger OFF en producción.
- Frontend: React 19 + Vite 8 en `frontend/` (`npm run dev`, puerto 5173, proxy /api y /ws).
- Tests: **140/140 frontend** y **4/4 backend** (MySQL temporal en 3307; Flyway V9 aplicada).
  Smoke de integración OK: roles 403/204, auditoría, ticket WS de un solo uso y rate limit 429.
  Comando frontend: `node --test "test/*.test.mjs" "frontend/test/componentes/*.test.mjs"`.
- Spec 001-front-end: T1–T34 completas; limitación anotada de selección de hora por rango
  libre. 3 dudas de spec siguen abiertas.

## Correcciones importantes
- Security 7: SecurityFilter usa createEmptyContext+setContext+saveContext con
  RequestAttributeSecurityContextRepository; ConfigurationSecurity registra
  FilterRegistrationBean(setEnabled(false)) para que el filtro @Component no se duplique.
  Sin esto TODA ruta protegida daba 401 con token válido.
- `ValidacionMedicoActivo` usaba `datos.idPaciente()` → corregido a `idMedico()` (daba 500).
- `consultaService.getAll(fecha)`: la agenda "Todos los médicos" ignoraba la fecha (RF-7);
  ahora llama `GET /consultas?fecha=...`.
- `dateUtils.aCadenaLocal()`: sustituye `toISOString()` para fechas por defecto (en UTC de
  noche devolvía el día siguiente).

## Decisiones (y por qué)
- Agenda: filtro por médico y/o día; el WS difunde `CONSULTA_CREADA/CANCELADA` y el
  componente refetchea (latencia 35–40 ms). Polling 30 s solo si el WS no conecta.
- Disponibilidad: se muestran **rangos libres** y la cita se crea al inicio del rango.
  `DisponibilidadGrid` (30 min) existe y está testeada, pero no la usa el formulario.
- DNI `\d{2}\.\d{3}\.\d{3}`; dirección: calle, número y ciudad obligatorios; complemento y
  distrito opcionales. Email de paciente editable; DNI bloqueado.
- Médicos (`/medicos`): búsqueda, filtro por especialidad, alta y edición; sin borrado UI.
  Se amplió `DTOActualizarMedico` y `Medico.actualizarDatos` (email, teléfono, especialidad).
- Rediseño **solo en `globals.css`**: paleta verde clínica, Source Serif 4 + Source Sans 3,
  trazo de ECG en cabecera y menú móvil en dos filas. Layout a ancho completo; formularios
  limitados a 760 px. Cubierto por `frontend/test/componentes/Maquetacion.test.mjs`.
- Push GitHub: PAT fine-grained necesita **Contents: Read and write** (Metadata read-only es
  normal). `.opencode/` y `.agents/` están ignorados; el token nunca se versiona.
- JWT: `TokenService` valida el secreto al arrancar (mínimo 32 bytes) y `production` rechaza
  el valor de desarrollo. La expiración usa `Instant` para no depender de la zona horaria.
- Roles: demo `recepcion.e2e` queda `ROLE_ADMIN`; el resto de usuarios existentes, recepción.
  Solo admin borra médicos/pacientes; el frontend oculta “Eliminar” a recepción.
- WebSocket: ticket de 60 s y un solo uso (`/ws/ticket`); el JWT ya no va en la URL.
- Auditoría transversal en `infra/auditoria`; no guarda claves ni tokens.
- Repo: `.github/dependabot.yml` y `.github/workflows/codeql.yml` preparados. La protección
  de `main` no se pudo activar: el PAT no tiene permiso de administración (HTTP 403).
- Boot 4.1.2 resolvió los avisos de OSV: Tomcat 11.0.27, Jackson 2.21.7/3.1.7 y Security 7.1.2.
- Credenciales demo `recepcion.e2e` / `Vollmed2026!` documentadas como ejemplo local.

## Observaciones / limitaciones
- El JWT sigue en `localStorage` por compatibilidad con el frontend actual; la CSP reduce el
  impacto de XSS, pero migrar a cookie HttpOnly queda pendiente.
- `npm run build` falla por tipos React ausentes (`@types/react`); `npx vite build` sí compila.
- El layout/menú también se ve en `/login`.
- `favicon.ico` da 404 (cosmético). `findActivoById` con id inexistente devuelve 500.
- En `medico` solo email y DNI son unique; teléfonos repetidos permitidos.

## Aprendizajes y errores a evitar
- DevTools sobre `<select>`: usar setter nativo + evento change. En inputs de texto, `fill`
  puede añadir en vez de sustituir.
- `useParams` viene de `react-router-dom`; `React.useParams()` rompía la edición (corregido).
- Fechas en tests y UI: hora local, nunca `toISOString()` para "hoy".
- jsdom/Node 22: importar primero `frontend/test/helpers/dom.mjs`; `navigator` es de solo
  lectura; `cleanup()` en afterEach.
- Rutas con espacios/acentos: usar workdir o comillas.
- Vite + OneDrive sirve CSS cacheado: reiniciar `npm run dev` (no basta recargar).
- Emulación de viewport de Chrome DevTools persiste: comprobar `window.innerWidth` y limpiar
  con `emulate` sin viewport.
- Si Spring falla con «Existing directory ... is not owned by ...», borrar ese directorio de
  `%TEMP%` y relanzar.
