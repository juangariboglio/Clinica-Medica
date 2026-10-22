# AGENTS.md

## El proyecto
API REST de una clínica médica ("Vollmed") construida con Spring Boot 3.3.5 y Java 17.
Es un solo módulo Maven. No hay CI, linter ni formateador configurados.

## Comandos
- Ejecutar: `mvnw.cmd spring-boot:run` (en Windows; en Linux/Mac: `./mvnw spring-boot:run`)
- Compilar/empaquetar: `mvnw.cmd package`
- Todas las pruebas: `mvnw.cmd test`
- Una sola prueba: `mvnw.cmd test -Dtest=MedicoRepositoryTest`

## Las pruebas necesitan MySQL en ejecución
No hay H2 ni base de datos embebida; las pruebas usan MySQL real en localhost:3306:
- `MedicoRepositoryTest` (usa `@ActiveProfiles("test")`) → base `vollmed_api_test`
- `ConsultaControllerTest` y `ApiApplicationTests` (sin perfil) → base `vollmed_api` (perfil principal)
El esquema lo gestiona Flyway, así que ambas bases deben existir antes de ejecutar los tests.

## Rarezas de configuración
- `src/main/resources/application.properties` tiene credenciales de MySQL en texto plano y activa
  `spring.flyway.out-of-order=true`. Las líneas de comentario usan `//` (inusual en .properties).
- El secreto JWT viene de la variable de entorno `JWT_SECRET` (`api.security.secret=${JWT_SECRET:12345}`).
- `application-production.properties` espera las variables `DATASOURCE_URL/USERNAME/PASSWORD`.
- Las migraciones están en `src/main/resources/db/migration`, versiones V1–V8 sin V5 (el hueco es
  histórico, intencional): no renumerar; agregar la siguiente versión al final.

## Arquitectura
- Punto de entrada: `med.voll.api.ApiApplication`. El código se organiza por dominio bajo
  `src/main/java/med/voll/api/`: `medico`, `paciente`, `consulta`, `usuario`, más `dto` e
  `infra` compartidos (security, errores, springdoc).
- Los controllers llaman directamente a los repositorios JPA (sin capa de servicio: es intencional
  en esta fase del curso).
- Flujo de reservas: `consulta/ReservaDeConsultas` + una clase por regla en `consulta/validaciones/`.

## Convenciones (síguelas)
- **Todos los nombres están en español**: clases, métodos, DTOs, tests y comentarios.
  Ej.: `DTORegistroMedico`, `ValidacionMedicoActivo`, `TratadorDeErrores`. No introduzcas nombres en inglés.
- Los DTOs son records de Java con prefijo `DTO`; un record por caso de uso (registro/respuesta/actualizar/listado).
- Los borrados son lógicos: la entidad mantiene el flag `activo`, el controller llama a `desactivar*()` y devuelve 204.
- Las reglas de validación van en los campos de los DTOs con anotaciones Jakarta; los errores los maneja
  `infra/errores/TratadorDeErrores`.
- Los tests usan `@DisplayName` en español y `@WithMockUser` (solo `POST /login` y las rutas de Swagger
  son públicas; todo lo demás exige autenticación).
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil. 

## Cuidado
- `pom.xml` declara `spring-security-test` dos veces y trae springdoc v1 (1.7.0) y v2 (2.5.0) a la vez;
  no agregues duplicados.
- La ruta del proyecto contiene espacios y caracteres acentuados: comilla las rutas en los comandos shell.

## Forma de trabajar
- Mejorar este proyecto que esta desactualizado actualizando sus frameworks y añadiendo su front end
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar. 

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español. actualizar `MEMORY.md` al terminar cada tarea. 
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados, añadir dependencias, frameworks o un paso de build.

## Verificación
- No hay tests automáticos. Después de cada cambio, verifica con el MCP de Chrome
DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la
vista móvil. 

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Reglas
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 

