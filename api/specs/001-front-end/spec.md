# Especificación del Frontend del Proyecto Vollmed

## Contexto y objetivo
El proyecto Vollmed es una API REST para la gestión de una clínica médica. El frontend proporcionará una interfaz de usuario que permita al personal médico y administrativo interactuar con el sistema de manera eficiente, segura y accesible, apoyando las operaciones diarias de la clínica.

## Usuarios
- Médicos: consultan su agenda, ven información de pacientes y registran resultados de consultas.
- Recepcionistas: registran nuevos pacientes, programan y modifican citas, gestionan la agenda general.
- Administradores: supervisan el uso del sistema, gestionan usuarios y roles, y visualizan reportes básicos.

## Historias de usuario
- Como médico, quiero ver mi agenda del día para saber a qué pacientes debo atender.
- Como recepcionista, quiero registrar un nuevo paciente con sus datos de contacto para ingresarlo al sistema.
- Como recepcionista, quiero programar una cita para un paciente con un médico específico y una fecha/hora disponible.
- Como médico, quiero marcar una consulta como completada y registrar sus observaciones.
- Como administrador, quiero ver en tiempo real las nuevas consultas creadas por otros usuarios para estar al tanto de la actividad de la clínica.
- Como usuario, quiero recibir mensajes de error claros y ubicados cerca del campo problemático al ingresar datos inválidos.
- Como usuario con discapacidad visual o motora, quiero que la interfaz sea navegable mediante teclado y lectores de pantalla, y que se adapte a cualquier tamaño de pantalla.
- Como usuario, quiero que la aplicación se actualice automáticamente cuando otro usuario cree una consulta, sin necesidad de recargar la página manualmente.

## Requisitos funcionales (EARS)
RF-1: Cuando el usuario inicia sesión con credenciales válidas, el sistema shall mostrar la página principal correspondiente a su rol.
RF-2: Cuando el usuario selecciona la opción de registrar un nuevo paciente, el sistema shall presentar un formulario para ingresar nombre, email, teléfono, DNI y dirección.
RF-3: Cuando el usuario envía el formulario de registro de paciente con todos los campos válidos, el sistema shall crear el paciente en el backend y mostrar un mensaje de éxito.
RF-4: Cuando el usuario envía el formulario de registro de paciente con algún campo inválido, el sistema shall mostrar mensajes de error inline al lado de cada campo incorrecto y no enviará los datos al servidor.
RF-5: Cuando el usuario selecciona un médico y una fecha, el sistema shall mostrar los horarios disponibles en formato de lista o cuadrícula.
RF-6: Cuando el usuario selecciona un horario disponible y confirma la creación de una cita, el sistema shall crear la cita en el backend y actualizar la agenda mostrada sin requerir recarga de página.
RF-7: Cuando otro usuario crea una consulta mientras el usuario tiene la aplicación abierta, el sistema shall actualizar la lista de consultas del día seleccionado en tiempo real para reflejar la nueva cita.
RF-8: Cuando el sistema detecta un cambio en los datos de un médico o paciente realizado por otro usuario mediante una suscripción a eventos del backend (WebSocket o polling cada 30 s), el sistema shall actualizar la información mostrada únicamente cuando el usuario recargue la página.
RF-9: Cuando el usuario tiene una conexión a internet perdida o inestable (definida como la falta de respuesta a tres peticiones HTTP consecutivas con timeout de 5 s cada una), el sistema shall impedir la ejecución de operaciones que requieran escritura (POST, PUT, DELETE) y mostrar un mensaje de error de conexión.
RF-10: Cuando el usuario navega a cualquier vista, el sistema shall adaptar su diseño al ancho de la pantalla actual (móvil, tablet, escritorio) sin pérdida de funcionalidad o contenido.
RF-11: Cuando el usuario interactúa con algún elemento interactivo (botón, enlace, campo de entrada), el sistema shall proporcionar foco visible y indicar el estado de enfoque según los estándares de accesibilidad.
RF-12: Cuando el usuario utiliza un lector de pantalla, el sistema shall proporcionar etiquetas y roles ARIA apropiados para todos los elementos interactivos e informativos.
RF-13: Cuando el usuario finaliza su sesión, el sistema shall cerrar la sesión de forma segura y redirigir a la página de inicio de sesión.
RF-14: Cuando el usuario envía un formulario de registro o edición de paciente con un campo de email, teléfono o nombre inválido según sus respectivas expresiones regulares, el sistema shall mostrar un mensaje de error inline al lado del campo indicando el formato esperado.
RF-15: Cuando el usuario intenta crear o actualizar un paciente con un DNI o email que ya existe en el sistema, el sistema shall mostrar un mensaje de error inline indicando que dicho valor ya está registrado y no permitirá la operación.
RF-16: Antes de permitir la creación de una cita, el sistema shall verificar que el paciente y el médico seleccionados existen en el backend; en caso contrario, shall mostrar un mensaje de error indicando que el registro seleccionado no existe y bloquear la creación de la cita.

## Requisitos no funcionales
RNF-1: La interfaz de usuario shall cumplir con las pautas de accesibilidad WCAG 2.1 AA en todos los componentes interactivos y de contenido.
RNF-2: El frontend shall ser totalmente responsive, asegurando una experiencia de uso óptima en anchuras de pantalla desde 320px hasta 1920px y más.
RNF-3: Las actualizaciones en tiempo real shall ocurrir con una latencia máxima de 2 segundos desde el evento en el backend hasta su reflejo en la interfaz.
RNF-4: Los mensajes de error de validación shall aparecer no más de 500 ms después de que el usuario salga del campo o intente enviar el formulario.
RNF-5: El tiempo de carga inicial de la aplicación shall ser inferior a 3 segundos en una conexión de banda ancha típica (>=5 Mbps).
RNF-6: Todas las comunicaciones con el backend shall utilizar HTTPS y incluir el token de autorización en el encabezado de autorización.
RNF-7: El frontend shall mantener el estado de la aplicación (en memoria: usuario logueado, permisos/rol y datos cargados en caché como listas de pacientes, médicos y consultas visibles) mientras la página esté abierta, sin recargas innecesarias.

## Casos límite
- Cuando el backend responde con un error 401 (no autorizado) debido a un token expirado, el sistema shall redirigir al usuario a la página de login y limpiar las credenciales almacenadas.
- Cuando el usuario intenta acceder a una ruta protegida sin estar autenticado, el sistema shall redirigir a la página de login preservando la URL original para redirigir tras el login exitoso.
- Cuando el usuario ingresa un DNI con formato incorrecto (no cumple \d{2}\.\d{3}\.\d{3}), el sistema shall mostrar un mensaje de error inline indicando el formato esperado.
- Cuando el usuario ingresa un email con formato incorrecto (no cumple con expresión regular de email estándar), el sistema shall mostrar un mensaje de error inline indicando el formato esperado.
- Cuando el usuario ingresa un teléfono con formato incorrecto (no cumple con expresión regular de teléfono local), el sistema shall mostrar un mensaje de error inline indicando el formato esperado.
- Cuando el usuario ingresa un nombre vacío o solo con espacios, el sistema shall mostrar un mensaje de error inline indicando que el campo es obligatorio.
- Cuando el usuario intenta crear o actualizar un paciente con un DNI o email que ya existe en el sistema, el sistema shall mostrar un mensaje de error inline indicando que dicho valor ya está registrado.
- Cuando el usuario intenta eliminar un paciente que tiene consultas asociadas, el sistema shall mostrar un mensaje de error indicando que primero debe reasignar o eliminar esas consultas.
- Cuando el usuario intenta crear una cita para un paciente o médico inexistente, el sistema shall mostrar un mensaje de error indicando que el registro seleccionado no existe.
- Cuando el usuario intenta crear una cita con una fecha/hora en el pasado, el sistema shall mostrar un mensaje de error indicando que la fecha debe ser futura.
- Cuando el usuario intenta crear una cita con una fecha/hora fuera del horario de atención de la clínica (7:00–19:00), el sistema shall mostrar un mensaje de error indicando que la hora no está permitida.
- Cuando el backend está temporalmente indisponible (error 500 o timeout), el sistema shall mostrar un mensaje de error genérico y permitir al usuario reintentar la operación después de unos segundos.
- Cuando el backend responde con un error 403 (prohibido) por falta de permisos, el sistema shall mostrar un mensaje de error indicando que el usuario no tiene permiso para realizar la acción.
- Cuando el usuario tiene una sesión inactiva por más de 30 minutos, el sistema shall cerrar la sesión automáticamente y redirigir a la página de login.

## Fuera de alcance
- Funcionalidad de trabajo offline o sincronización posterior (el frontend requiere conexión constante al backend).
- Generación de reportes avanzados o exportación a formatos externos (PDF, Excel).
- Integración con sistemas de terceros como pasarelas de pago o recordatorios por SMS.
- Personalización profunda de temas visuales (colores, fuentes) más allá de los proporcionados por el framework elegido.
- Implementación de un sistema de chat o mensajería interna entre usuarios del frontend.

## Criterios de finalización
- Todos los requisitos funcionales (RF-1 a RF-16) han sido implementados y pasan sus pruebas de aceptación.
- Todos los requisitos no funcionales (RNF-1 a RNF-7) han sido verificados mediante pruebas de accesibilidad, pruebas de rendimiento y pruebas manuales en diversos dispositivos y tamaños de pantalla.
- Se ha realizado una prueba de usuario con al menos un representante de cada rol (médico, recepcionista, administrador) y se ha confirmado que pueden realizar sus tareas habituales sin bloqueos ni confusiones significativas.
- No se han detectado defectos críticos (prioridad alta) en el registro de incidencias tras una semana de uso en un entorno de prueba con datos simulados.
- La documentación de usuario (guía rápida de inicio) ha sido actualizada y entregada junto al producto.

## Dudas abiertas
- [NECESITA ACLARACIÓN] ¿Se requiere notificar al usuario mediante sonido o vibración cuando ocurra una actualización crítica en tiempo real (por ejemplo, una cita cancelada de último minuto)?
- [NECESITA ACLARACIÓN] ¿Hay algún límite en la cantidad de consultas que se pueden mostrar simultáneamente en la vista de agenda antes de que sea necesario paginar o cargar más datos bajo demanda?
- [NECESITA ACLARACIÓN] ¿Se permite que el usuario deje un campo de dirección parcialmente vacío (por ejemplo, sin número o sin complemento) y, en caso afirmativo, cómo se deben validar esos campos?