# MEMORY.md

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual (2026-10-21)
- Backend: Spring Boot 4.1.1 + Security 7 + Hibernate 7 + Java 17 + MySQL (Flyway V1–V8,
  ddl-auto=validate). Arranca con `mvnw.cmd spring-boot:run`.
- Frontend: React + Vite 8 en `frontend/` (`npm run dev`, puerto 5173, proxy /api y /ws).
  App real con router (`App.js`), Layout, PrivateRoute y AutoLogout: verificada en vivo.
- Tests: **140/140 verde** con
  `node --test "test/*.test.mjs" "frontend/test/componentes/*.test.mjs"` (globs entre
  comillas; pasar directorios NO funciona). Tests RTL en `frontend/test/componentes/`.
- Skills: `frontend-design` (anthropics/skills) instalada para el proyecto en
  `.agents/skills/frontend-design` (guía de dirección visual; no es código de la app).
- Spec 001-front-end: **T1–T34 completas**. Veredicto: cumplida con las limitaciones
  anotadas (JWT sin roles, selección de hora por rango libre) y 3 dudas abiertas de spec.

## Correcciones importantes
- Security 7: SecurityFilter usa createEmptyContext+setContext+saveContext con
  RequestAttributeSecurityContextRepository; ConfigurationSecurity registra
  FilterRegistrationBean(setEnabled(false)) para que el filtro @Component no se duplique.
  Sin esto TODA ruta protegida daba 401 con token válido.
- `ValidacionMedicoActivo` usaba `datos.idPaciente()` → corregido a `idMedico()` (daba 500).
- `consultaService.getAll(fecha)`: la agenda "Todos los médicos" ignoraba la fecha (RF-7);
  ahora llama `GET /consultas?fecha=...` (el backend ya lo soporta).
- `dateUtils.aCadenaLocal()`: sustituye `toISOString()` para fechas por defecto (en UTC de
  noche devolvía el día siguiente).

## Decisiones (y por qué)
- Agenda: filtro por médico y/o día; el WS difunde `CONSULTA_CREADA/CANCELADA` y el
  componente refetchea. Latencia medida en vivo: **40 ms y 35 ms** (RNF-3 ≤2 s). Polling
  30 s solo como respaldo si el WS no está conectado.
- Disponibilidad en el formulario: se muestran **rangos libres** (p. ej. 07:00–19:00) y la
  cita se crea al inicio del rango elegido. La cuadrícula de 30 min existe como componente
  (DisponibilidadGrid) y está testeada, pero no la usa el formulario. Decisión heredada y
  cubierta por tests: cambiarla exige rehacer tests T31.
- DNI `\d{2}\.\d{3}\.\d{3}`; dirección: calle, número y ciudad obligatorios;
  **complemento y distrito opcionales** (sin @NotBlank en DTODireccion y sin required en el
  form; la BD admite "" en distrito y NULL en complemento).
- Edición de paciente: el **email sí se edita** (DTOActualizarPaciente y el PUT lo incluyen);
  el **DNI no**: no está en el DTO, va deshabilitado y el alta avisa "El DNI no se podrá editar
  después de guardar." (clase `.ayuda` + aria-describedby).
- Pantalla de médicos (`/medicos`, `/medicos/nuevo`, `/medicos/:id/editar`): lista con búsqueda
  por nombre y filtro por especialidad (sin borrado desde la UI). En edición se pueden cambiar
  nombre, email, teléfono, especialidad y dirección; el DNI va bloqueado. Requirió ampliar
  `DTOActualizarMedico` y `Medico.actualizarDatos` (opción B).
- Usuario semilla e2e `recepcion.e2e` (clave fuera del repo) creado por JDBC+BCrypt.
- Rediseño visual **solo en `globals.css`** (HTML/JSX intacto): paleta verde clínica
  (bosque #0C3B2C, primario #146B52) en lugar del azul; Source Serif 4 en títulos y
  Source Sans 3 en la UI (Google Fonts con fallback); trazo de ECG tenue en la cabecera
  (oculto < 1024 px); menú móvil en dos filas. `style.css` es residuo del scaffold, sin uso.
- Layout **a ancho completo**: cabecera y `.app-cuerpo` ya no tienen `max-width: 1240px`;
  ocupan el 100% con padding fluido (`clamp`). Los formularios mantienen su tope de 760 px
  para no estirar los campos. Cubierto por `frontend/test/componentes/Maquetacion.test.mjs`.

## Observaciones / limitaciones
- JWT sin roles: todos ROLE_USER → RF-1 "página según rol" no aplicable; hay página común.
- `favicon.ico` da 404 (cosmético). El layout (menú) se ve también en /login.
- findActivoById devuelve `boolean` primitivo: id inexistente = 500 (el frontend lo evita
  con RF-16). No cambiar.
- El AutoLogout de 30 min se comprobó en vivo (cierre WS + token borrado + /login).
- En la tabla `medico` solo email y DNI son `unique`: se permiten teléfonos repetidos (el 409
  de email/DNI sí se muestra inline; el mapeo de teléfono en `detectarErroresUnicidad` sirve a pacientes).

## Aprendizajes y errores a evitar
- Los `fill` de DevTools sobre `<select>` no siempre disparan el onChange de React: usar
  setter nativo + evento change. En inputs de texto `fill` puede AÑADIR en vez de sustituir.
- `useParams` viene de `react-router-dom`, NO de React: `React.useParams()` rompía
  /pacientes/:id/editar con pantalla en blanco (corregido).
- Fechas en tests y en la UI: hora local, nunca `toISOString()` para "hoy".
- jsdom/Node 22: importar primero `frontend/test/helpers/dom.mjs`; `navigator` es de solo
  lectura (defineProperty + try/catch); `cleanup()` en afterEach.
- Rutas del proyecto con espacios/acentos: usar el parámetro workdir o comillas.
- Vite + OneDrive a veces sirve CSS cacheado tras varias ediciones seguidas: si el navegador
  no refleja un cambio ya guardado, reiniciar `npm run dev` (no basta recargar).
- La emulación de viewport de Chrome DevTools persiste entre llamadas: si la página no llena
  un monitor grande, comprobar `window.innerWidth` y limpiar la emulación (`emulate` sin viewport).
- Si Spring no arranca con «Existing directory ... is not owned by BUILTIN\Administradores»,
  borrar ese directorio de `%TEMP%` y relanzar (lo crea otro contexto de usuario).
