# Guía de uso — Interfaz web de Vollmed

Esta guía explica cómo usar la interfaz web de la clínica Vollmed: iniciar sesión,
registrar y editar pacientes, agendar consultas y consultar la agenda.

## Requisitos previos

1. **Backend corriendo**: la API Vollmed (Spring Boot) activa en `http://localhost:8080`,
   con MySQL disponible (el backend valida el esquema con Flyway).
2. **Frontend corriendo**: dentro de la carpeta `frontend/` ejecutar:

   ```bash
   npm install
   npm run dev
   ```

   La aplicación queda disponible en `http://localhost:5173`.
   El servidor de desarrollo redirige automáticamente las llamadas `/api/*` al backend.

3. **Credenciales**: necesita un usuario activo en el sistema; solicítelas al
   administrador si no las tiene. Para entornos de prueba existe el usuario
   `recepcion.e2e` (clave `Vollmed2026!`).

## Iniciar sesión

1. Abra `http://localhost:5173`; será redirigido a la pantalla de inicio de sesión.
2. Escriba su usuario y contraseña y pulse **Entrar**.
3. Si las credenciales son válidas, entrará a la página principal. El encabezado
   muestra un saludo con su usuario y el botón **Cerrar sesión**.

Si el usuario o la contraseña no son correctos, el sistema lo indica con un
mensaje junto al formulario. Tras 30 minutos de inactividad la sesión se cierra
automáticamente y volverá a la pantalla de inicio de sesión.

## Navegación

El menú lateral tiene cinco secciones:

- **Inicio**: pantalla de bienvenida.
- **Pacientes**: lista, alta, edición y eliminación de pacientes.
- **Médicos**: lista, alta y edición de médicos.
- **Agenda**: consultas agendadas de un médico y una fecha.
- **Nueva consulta**: reserva de una nueva cita.

## Registrar un paciente

1. Entre en **Pacientes** y pulse **Registrar nuevo paciente**.
2. Rellene los campos del formulario. La validación ocurre al salir de cada campo
   y los errores se muestran junto a cada uno:
   - **Nombre**: solo letras, espacios, guiones y apóstrofes.
   - **Email**: formato de correo válido y no registrado.
   - **Teléfono**: exactamente 9 dígitos.
   - **DNI**: formato `12.345.678` (dos dígitos, punto, tres, punto, tres).
   - **Dirección**: calle, número y ciudad son obligatorios; complemento y
     distrito son opcionales y pueden dejarse en blanco.
3. Pulse **Guardar**. Si el backend rechaza el alta (por ejemplo, un DNI ya
   registrado), el motivo se muestra junto al campo o en el formulario sin perder
   lo escrito. Si todo es correcto verá «Paciente creado correctamente» y el
   formulario se limpia.

## Editar o eliminar un paciente

En **Pacientes** puede buscar por nombre con el campo de búsqueda. Cada paciente
tiene dos acciones:

- **Editar**: abre el formulario con sus datos. El DNI no se puede modificar
  (se fija al crear el paciente); el email sí se puede cambiar. El resto de campos
  se valida igual que en el alta.
- **Eliminar**: pide confirmación y desactiva al paciente (borrado lógico: el
  paciente deja de aparecer en la lista, pero sus datos y consultas se conservan).
  Si el backend rechaza la operación, se muestra el motivo.

## Médicos

En **Médicos** se listan los médicos activos con su especialidad, DNI y email.

- **Buscar**: por nombre, sin distinguir mayúsculas.
- **Filtrar**: por especialidad (ortopedia, cardiología, ginecología o pediatría);
  se puede combinar con la búsqueda por nombre.
- **Registrar nuevo médico**: pide nombre, DNI (`12.345.678`), email, teléfono de
  9 dígitos, especialidad y dirección; calle, número y ciudad son obligatorios y
  complemento y distrito, opcionales. El aviso bajo el DNI recuerda que **no se
  podrá editar después**.
- **Editar**: permite cambiar nombre, email, teléfono, especialidad y dirección.
  El DNI queda bloqueado.
- No hay borrado desde esta pantalla: los médicos se desactivan por la API.

## Agendar una consulta

1. Entre en **Nueva consulta**.
2. Seleccione el paciente, el médico y la fecha.
3. Al elegir médico y fecha se muestran las franjas libres del médico ese día,
   en tramos de 30 minutos dentro del horario de la clínica
   (de 07:00 a 19:00, de lunes a sábado).
4. Pulse la franja deseada y luego **Crear consulta**. Verá «Cita creada
   exitosamente» y la disponibilidad se recalcula al instante.

Reglas que aplica el sistema al reservar:

- No se agendan consultas en domingo (la clínica está cerrada).
- La cita debe empezar al menos 30 minutos después del momento de la reserva.
- Un paciente no puede tener dos consultas el mismo día.
- Si el médico o el paciente no existen o están inactivos, se avisa antes de enviar.

## Ver la agenda

En **Agenda**:

1. Elija el médico (o «Todos los médicos») y la fecha.
2. La tabla muestra hora, paciente y médico de cada consulta de esa selección.
3. La agenda se actualiza **en tiempo real**: cuando otro usuario crea una cita,
   la tabla se refresca sola en menos de 2 segundos, sin recargar la página.
   Si la conexión en tiempo real se pierde, la página lo indica («Sin conexión
   en tiempo real; refresco cada 30 s») y pasa a refrescar cada 30 segundos
   hasta que se restablezca.

## Accesibilidad

- Todos los campos tienen etiqueta visible o nombre accesible.
- Los errores se anuncian a lectores de pantalla (`role="alert"`) y los estados
  de carga con `role="status"`.
- Puede navegar con el teclado (Tabulador); el foco visible indica dónde está.
- Las tablas se pueden desplazar horizontalmente en pantallas pequeñas y la
  interfaz se adapta a móviles (320 px en adelante).

## Problemas frecuentes

| Síntoma | Qué ocurre |
|---|---|
| Vuelve al inicio de sesión al navegar | La sesión expiró o el token dejó de ser válido; inicie sesión de nuevo y continuará donde estaba. |
| «No es posible conectar con el servidor» | El backend o la red no están disponibles; reintente cuando se restablezca. |
| Error al crear la cita con hora pasada | Las citas requieren un mínimo de 30 minutos de anticipación. |
| Franjas en gris o mensaje de horario | Fuera del horario laboral (L–S de 07:00 a 19:00) o día completo ocupado. |
