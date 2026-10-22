# Tareas de implementación del frontend (Vollmed)

Tareas pequeñas (máx. 20-30 min cada una), ordenadas por dependencia. Cada tarea indica los RF que cubre y una condición de finalización verificable.

- [x] **Inicializar proyecto React con Vite**
  - RFs: Ninguno (infraestructura)
  - Hecho cuando: `npm create vite@latest frontend -- --template react` se ejecuta correctamente y se puede iniciar el proyecto con `npm run dev` sin errores.

- [x] **Configurar ESLint y Prettier básicos**
  - RFs: Ninguno (infraestructura)
  - Hecho cuando: Archivos `.eslintrc.js` y `.prettierrc` existen y el linter no muestra errores en archivos de ejemplo.

- [x] **Crear estructura de carpetas básica (src/components, src/services, src/utils, src/hooks, src/store, src/styles, src/assets)**
  - RFs: Ninguno (infraestructura)
  - Hecho cuando: Todas las carpetas mencionadas existen dentro de `src/`.

- [x] **Implementar capa de servicios: authService.js (login, logout, set/get token)**
  - RFs: RF-1, RF-6, RF-13
  - Hecho cuando: Las funciones `login(credentials)`, `logout()`, `getToken()`, `setToken(token)` están presentes y las pruebas unitarias pasan (simulando respuestas de backend).

- [x] **Crear hook useAuth para manejar estado de autenticación (login/logout, token)**
  - RFs: RF-1, RF-6, RF-13
  - Hecho cuando: El hook expone `user`, `login`, `logout`, `isAuthenticated` y actualiza correctamente el estado tras llamar a authService.

- [x] **Crear página de login (Login.jsx) con formulario y validación básica**
  - RFs: RF-1, RF-2? (no, login no es paciente), RF-6, RF-13, RF-14? (validación de campos)
  - Hecho cuando: La ruta `/login` muestra un formulario con campos de usuario y contraseña, y al enviar llama a authService.login y redirige a `/` si las credenciales son válidas (simulado).

- [x] **Implementar protección de rutas mediante componente PrivateRoute**
  - RFs: RF-1, RF-13
  - Hecho cuando: Intentar acceder a una ruta protegida sin estar autenticado redirige a `/login` y después de login exitoso redirige a la ruta originalmente solicitada.

- [x] **Crear layout básico (Header, Sidebar, Footer) y ruta principal (Home) que muestre un placeholder según rol**
  - RFs: RF-1
  - Hecho cuando: Al iniciar sesión como médico, recepcionista o administrador, se muestra la página principal con un encabezado que indica el rol y un mensaje de bienvenida.

- [x] **Implementar utils/dateUtils.js con funciones esFechaPasada, esHorarioLaboral, formatearFechaParaMostrar, obtenerDiaSemanaNombre**
  - RFs: RF-10, RF-11, RF-12, RF-16
  - Hecho cuando: Las funciones están exportadas y pasan tests unitarios con diversos casos de entrada (fechas pasadas, presentes, formatos, etc.).

- [x] **Implementar utils/validationUtils.js con validarDNI, validarEmail, validarTelefono, validarNombre**
  - RFs: RF-4, RF-14, RF-15
  - Hecho cuando: Cada función retorna objeto `{esValido, mensaje}` correctamente para entradas válidas e inválidas, y los tests unitarios pasan.

- [x] **Implementar utils/disponibilidadUtils.js con calcularHorariosDisponibles (algoritmo del mapa)**
  - RFs: RF-5, RF-16
  - Hecho cuando: La función devuelve la lista correcta de bloques libres dados unos horarios ocupados y una fecha, y los tests unitarios cubren casos edge (lista vacía, día completo ocupado, horarios fuera de rango, etc.).

- [x] **Crear servicio pacienteService.js (getAll, create, getById, update, delete)**
  - RFs: RF-2, RF-3, RF-4, RF-14, RF-15
  - Hecho cuando: Las funciones llaman al endpoint correcto con los headers de autorización y retornan los datos esperados (simulados en tests).

- [x] **Crear servicio consultaService.js (getDisponibilidad, create, getByFechaMedico, updateEstado, getById)**
  - RFs: RF-5, RF-6, RF-7, RF-8, RF-9, RF-16
  - Hecho cuando: Las funciones interactúan con los endpoints esperados y manejan errores (401, 500, etc.) según lo especificado.

- [x] **Crear servicio medicoService.js (getAll, getById)**
  - RFs: RF-16
  - Hecho cuando: El servicio obtiene la lista de médicos y sus datos correctamente.

- [x] **Crear componente PacienteList.jsx que muestra lista de pacientes (con busca opcional)**
  - RFs: RF-2, RF-3
  - Hecho cuando: Al cargar, muestra una tabla con los pacientes obtenidos de pacienteService.getAll y permite buscar por nombre (filtro básico).

- [x] **Crear componente PacienteForm.jsx para crear y editar paciente (con validaciones inline)**
  - RFs: RF-2, RF-3, RF-4, RF-14, RF-15
  - Hecho cuando: El formulario muestra errores inline cuando los campos son inválidos (DNI, email, teléfono, nombre) y permite enviar cuando todos son válidos, llamando a pacienteService.create/update y mostrando mensaje de éxito.

- [x] **Crear componente ConsultaList.jsx que muestra agenda de consultas (lista o cuadrícula)**
  - RFs: RF-5, RF-6, RF-7, RF-8
  - Hecho cuando: Al seleccionar médico y fecha, muestra los horarios disponibles obtenidos de consultaService.getDisponibilidad y permite seleccionar un slot para crear una cita.

- [x] **Crear componente DisponibilidadGrid.jsx (visualización de horarios disponibles como cuadrícula)**
  - RFs: RF-5, RF-10, RF-11, RF-12
  - Hecho cuando: Dada una lista de horarios disponibles, renderiza una tabla/grid donde cada celda representa un slot, está habilitada si está disponible y muestra aria-label con el estado y rango de hora.

- [x] **Crear componente DisponibilidadList.jsx (alternativa lista)**
  - RFs: RF-5, RF-10, RF-11, RF-12
  - Hecho cuando: Dada una lista de horarios disponibles, renderiza una lista de elementos cada uno con rango de hora y botón de seleccionar.

- [x] **Crear componente Disponibilidad.jsx (contenedor que llama al servicio y muestra disponibilidad)**
  - RFs: RF-5, RF-6, RF-7, RF-8, RF-10, RF-11, RF-12
  - Hecho cuando: Al recibir cambios en médico/fecha, consulta al servicio y muestra la disponibilidad mediante DisponibilidadGrid o List, y permite seleccionar un horariopara continuar con la creación de cita.

- [x] **Implementar hook useDisponibilidad para obtener y mantener en estado la disponibilidad de un médico en una fecha**
  - RFs: RF-5, RF-6, RF-7, RF-8
  - Hecho cuando: El hook expone `disponibilidad`, `cargando`, `error` y vuelve a consultar cuando cambian médico o fecha.

- [x] **Crear componente ConsultaForm.jsx para crear cita (seleccionar paciente, médico, fecha/hora)**
  - RFs: RF-5, RF-6, RF-14, RF-15, RF-16
  - Hecho cuando: El formulario permite seleccionar paciente (de una lista), médico (de una lista), fecha (input date) y hora (de los slots disponibles), valida que todos estén seleccionados y envía a consultaService.create, mostrando mensaje de éxito.

- [x] **Implementar actualización en tiempo real de consultas mediante suscripción (WebSocket o polling cada 30s) en consultaService o hook useConsultas**
  - RFs: RF-7, RF-8, RF-9
  - Hecho cuando: Cuando se crea una nueva consulta por otro usuario, la lista de consultas en la vista se actualiza sin recargar la página (simulado mediante un mock de suscripción).

- [x] **Agregar manejo de errores global (mensajes inline y notificaciones toast) para operaciones fallidas**
  - RFs: RF-4, RF-9, RF-14, RF-15
  - Hecho cuando: Al ocurrir un error de validación o de backend, se muestra un mensaje cercano al campo o una notificación global, y se permite reintentar.

- [x] **Implementar redirección a login y limpieza de token al recibir error 401 (token expirado)**
  - RFs: RF-9
  - Hecho cuando: Cualquier llamada al backend que devuelva 401 resulta en llamada a authService.logout y redirección a `/login`.

- [x] **Agregar protección contra acceso a rutas protegidas sin autenticación (ya hecho en PrivateRoute, pero verificar)**
  - RFs: RF-1, RF-13
  - Hecho cuando: Intentar acceder a `/consulta/nueva` sin login redirige a `/login` y después de login lleva a `/consulta/nueva`.

- [x] **Implementar cierre de sesión automático tras 30 minutos de inactividad**
  - RFs: RF-13
  - Hecho cuando: Después de 30 minutos sin interacción, el usuario es redirigido a login y el token se elimina.

- [x] **Agregar estilos básicos (globals.css) y tema (variables de :root) para asegurar responsividad y accesibilidad**
  - RFs: RF-10, RF-11, RF-12, RNF-1, RNF-2
  - Hecho cuando: La aplicación se ve correctamente en anchos de pantalla de 320px a 1920px y pasa una prueba básica de contraste (por ejemplo, usando herramienta de desarrollador).

- [x] **Escribir pruebas unitarias para utils/dateUtils.js, validationUtils.js, disponibilidadUtils.js**
  - RFs: Todos los relacionados (ver arriba)
  - Hecho cuando: Cada archivo de test existe y al ejecutar `npm test` (o `node --test`) todos los tests pasan.

- [x] **Escribir pruebas unitarias para servicios (mock de fetch)**
  - RFs: RF-3, RF-6, RF-7, RF-8, RF-9, RF-14, RF-15, RF-16
  - Hecho cuando: Los tests de servicios pasan simulando respuestas exitosas y de error.

- [x] **Escribir pruebas de componentes clave (Login, PacienteForm, ConsultaForm, DisponibilidadGrid) usando React Testing Library**
  - RFs: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16
  - Hecho cuando: Los tests de componentes pasan y cubren renderizado, interacciones y estados de error.

- [x] **Verificar que la aplicación cumpla con RF-3 (latencia de actualización en tiempo real ≤ 2s) mediante pruebas manuales de simulación**
  - RFs: RF-3
  - Hecho cuando: Al simular una actualización desde el backend, la UI se actualiza en menos de 2 segundos (medido con console.time o similar en entorno de desarrollo).

- [x] **Crear guía rápida de inicio (docs/guia-usuario.md) para médicos, recepcionistas y administradores**
  - RFs: Ninguno (documentación)
  - Hecho cuando: El archivo existe y contiene instrucciones claros de cómo iniciar sesión, realizar operaciones comunes (registrar paciente, agendar cita, ver agenda).

- [x] **Realizar revisión final: asegurarse de que todos los RFs y RNFs estén cubiertos y marcar dudas abiertas si permanecen**
  - RFs: Todos
  - Hecho cuando: Se ha recorrido cada RF y RNF del spec y se confirma que está abordado en la implementación o en las pruebas; las dudas abiertas del spec se anotan.
