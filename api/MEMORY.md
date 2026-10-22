# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual (2026-10-22)
- Repo: `github.com/juangariboglio/Clinica-Medica`, rama `main`. Subidos 3 commits:
  backend Spring Boot 4.1.1, frontend React y docs/tests. README raíz con captura real en
  `api/docs/capturas/interfaz.png`.
- Backend: Spring Boot 4.1.1 + Security 7 + Hibernate 7 + Java 17 + MySQL (Flyway V1–V8,
  ddl-auto=validate). Arranca con `mvnw.cmd spring-boot:run`.
- Configuración: `application.properties` exige `VOLLMED_DB_PASSWORD` (sin valor por
  defecto); JWT con `VOLLMED_JWT_SECRET`. Bases: `vollmed_api` y `vollmed_api_test`.
- Frontend: React 19 + Vite 8 en `frontend/` (`npm run dev`, puerto 5173, proxy /api y /ws).
- Tests: **140/140 frontend y 4/4 backend**. Comando frontend:
  `node --test "test/*.test.mjs" "frontend/test/componentes/*.test.mjs"` (globs entre comillas).
- Spec 001-front-end: T1–T34 completas; limitaciones anotadas (JWT sin roles, selección de
  hora por rango libre). 3 dudas de spec siguen abiertas.

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
- Credenciales demo `recepcion.e2e` / `Vollmed2026!` documentadas como ejemplo local.

## Observaciones / limitaciones
- JWT sin roles: todos ROLE_USER. El layout/menú también se ve en `/login`.
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
