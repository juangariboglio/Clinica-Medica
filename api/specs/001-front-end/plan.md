# Plan de implementación del frontend del Proyecto Vollmed

## 1. Resumen del plan anterior (lo importante que se encontraba en .opencode/plan.md antes de borrarlo)

El plan anterior describía la implementación completa del frontend como una SPA con las siguientes etapas:
1. Configuración inicial del proyecto (selección de framework, estructura de carpetas, dependencias de estado y HTTP).
2. Implementación de autenticación y gestión de sesión (login, almacenamiento de token, protección de rutas).
3. Construcción de layout y navegación (header, sidebar, menú según roles, routing).
4. Implementación de módulos según funcionalidades:
   a. Gestión de pacientes (listado, formulario de registro con validaciones inline).
   b. Gestión de citas (agenda con disponibilidad, creación de cita, actualización en tiempo real).
   c. Gestión de médicos (listado de médicos con especialidad y estado).
   d. Perfil de usuario (visualización y actualización de datos).
   e. Notificaciones y actualizaciones en tiempo real (suscripción a eventos del backend, indicaciones visuales).
   f. Manejo de errores (mensajes inline, notificaciones globales, redirección en 401).
   g. Responsividad y accesibilidad (adaptación a tamaños de pantalla, cumplimiento WCAG 2.1 AA, navegabilidad por teclado).
5. Integración con el backend y manejo de estado (capa de servicios, biblioteca de gestión de estado, lógica de reintento).
6. Pruebas y revisión (ejecución de tests del backend, pruebas manuales de historias de usuario, verificación de requisitos no funcionales).
7. Documentación y entrega (guía rápida de inicio, optimización de bundle).
8. Revisión final y preparación para entrega (cumplimiento de RFs y RNFs, resolución de dudas abiertas, preparación para integración con el backend).

Este plan cubre todos los requisitos funcionales (RF-1 a RF-16) y no funcionales (RNF-1 a RNF-7) especificados en specs/001-front-end/spec.md.

## 2. Archivos que se crean o modifican y responsabilidad de cada uno

A continuación se listan los archivos clave que se crearán o modificarán para implementar el frontend, incluyendo la funcionalidad de visualización de disponibilidad de citas (mapa de horarios disponibles) como parte del módulo de gestión de citas. Cada archivo tiene una responsabilidad clara y se ajusta a la separación de lógica de negocio y presentación.

### Estructura de archivos propuesta
```
src/
├── assets/                 # Recursos estáticos (íconos, logos)
├── components/             # Componentes reutilizables de presentación
│   ├── ui/                 # Componentes UI genéricos (Botón, Input, Modal, etc.)
│   ├── layout/             # Componentes de layout (Header, Sidebar, Footer)
│   ├── disponibilidad/     # Componentes específicos de visualización de disponibilidad
│   │   ├── DisponibilidadGrid.jsx   # Componente que muestra la cuadrícula de horarios disponibles
│   │   └── DisponibilidadList.jsx   # Alternativa: lista de horarios disponibles
│   ├── pacientes/          # Componentes relacionados con pacientes
│   │   ├── PacienteList.jsx
│   │   └── PacienteForm.jsx
│   ├── consultas/          # Componentes relacionados con citas/consultas
│   │   ├── ConsultaList.jsx
│   │   ├── ConsultaForm.jsx
│   │   └── Disponibilidad.jsx       # Contenedor que llama al servicio y muestra disponibilidad
│   └── medicos/            # Componentes relacionados con médicos
│       └── MedicoList.jsx
├── services/               # Capa de comunicación con el backend (API clients)
│   ├── authService.js      # Funciones de login/logout y manejo de token
│   ├── pacienteService.js  # CRUD de pacientes
│   ├── consultaService.js  # CRUD de consultas y obtención de disponibilidad
│   └── medicoService.js    # CRUD de médicos
├── store/                  # Gestión de estado (si se usa Redux, Context o similar)
│   ├── index.js            # Configuración del store
│   ├── authSlice.js        # Estado de autenticación
│   ├── pacienteSlice.js    # Estado de lista de pacientes
│   ├── consultaSlice.js    # Estado de lista de consultas y disponibilidad
│   └── medicoSlice.js      # Estado de lista de médicos
├── utils/                  # Funciones puras de lógica de negocio (independientes de UI)
│   ├── dateUtils.js        # Funciones de manejo de fechas (formateo, comparaciones)
│   ├── disponibilidadUtils.js     # Funciones para calcular horarios disponibles
│   └── validationUtils.js  # Funciones de validación de formato (DNI, email, teléfono)
├── hooks/                  # Custom hooks de React (ej. useAuth, useConsultas, useDisponibilidad)
├── routes/                 # Definición de rutas de la aplicación
│   └── AppRoutes.js        # Rutas protegidas y públicas
├── App.jsx                 # Componente raíz
├── main.jsx                # Punto de entrada de la aplicación
└── styles/                 # Estilos globales y temas (CSS, SCSS o CSS-in-JS)
    ├── globals.css
    └── theme.js
```

### Responsabilidades por archivo o grupo de archivos

- **src/components/ui/***: Componentes de presentación puros (sin lógica de negocio). Responsables de renderizar elementos como botones, inputs, modales, etc., recibiendo propiedades y callbacks. No acceden directamente al estado ni a servicios.
- **src/components/layout/***: Define la estructura visual común (header, sidebar, footer). Responsable de la navegación y la distribución del espacio en pantalla.
- **src/components/disponibilidad/***: Responsable de visualizar los horarios disponibles para un médico en una fecha dada. Recibe los datos de disponibilidad (lista de bloques libres o matriz de ocupación) y los.renderiza como una cuadrícula (horas vs quizás médicos) o como una lista. Incluye mecanismos para seleccionar un slot y crear una cita.
- **src/components/pacientes/***: Manejan la interacción para listar, crear y editar pacientes. Incluyen validaciones de formulario y llaman a los servicios correspondientes.
- **src/components/consultas/***: Manejan la agenda, la visualización de horarios disponibles, la creación y edición de citas. Incluyen la lógica para solicitar disponibilidad al backend y actualizar la vista en tiempo real. El componente `Disponibilidad.jsx` actúa como contenedor que obtiene los datos del backend (o del store) y delega la presentación a los componentes de disponibilidad.
- **src/components/medicos/***: Listan los médicos activos/inactivos con su especialidad.
- **src/services/***: Encapsulan todas las llamadas al backend. Responsables de construir las URLs, añadir headers de autorización, manejar errores HTTP y transformar respuestas. No contienen lógica de negocio específica del dominio.
- **src/store/***: (si se usa un patrón de gestión de estado centralizado) Almacena el estado global de la aplicación (usuario logueado, listas de pacientes, consultas, médicos, etc.). Actualiza el estado en respuesta a acciones provenientes de componentes o servicios.
- **src/utils/***: Contiene **funciones puras de lógica de negocio** que no dependen de UI ni de servicios. Son fáciles de testear unitariamente. Ejemplos: formateo de fechas, cálculo de disponibilidad, validaciones de formato.
- **src/hooks/***: Custom hooks que encapsulan lógica de estado y efectos secundarios (ej. useAuth para manejar el estado de autenticación, useDisponibilidad para obtener y mantener en estado la disponibilidad de un médico en una fecha).
- **src/routes/***: Define qué componentes se renderizan según la URL y protege las rutas que requieren autenticación.
- **src/App.jsx y src/main.jsx**: Punto de entrada de la aplicación; configuran el proveedor de estado, el router y renderizan el componente raíz.
- **src/styles/***: Define los estilos globales, variables de tema y reglas de responsividad. Asegura que la interfaz cumpla con RNF-2 (totalmente responsive) y RNF-1 (WCAG 2.1 AA).

## 3. Funciones puras de lógica necesarias (con "hoy" como parámetro)

A continuación se enumeran las funciones puras que se ubicarán en `src/utils/` y que son independientes de frameworks o bibliotecas de UI. Todas son testables con `node --test` (o cualquier runner de JavaScript/TypeScript). El parámetro `hoy` representa la fecha actual (objeto Date) y se utiliza para hacer que las funciones sean determinísticas en tests.

### src/utils/dateUtils.js
- `esFechaPasada(fecha: Date, hoy: Date): boolean` → Devuelve true si `fecha` es estrictamente anterior a `hoy` (ignorando hora).  
  **RF cubre:** RF-16 (validar que la fecha de una cita no esté en el pasado), caso límite de fecha pasada.
- `esHorarioLaboral(hora: Date, hoy: Date): boolean` → Devuelve true si la hora (en el mismo día que `hoy`) está entre 7:00 y 19:00.  
  **RF cubre:** RF-16 (validar que la hora de una cita esté dentro del horario de atención), caso límite de hora fuera de horario.
- `formatearFechaParaMostrar(fecha: Date): string` → Devuelve una cadena en formato "dd/MM/yyyy".  
  **RF cubre:** RF-10, RF-11, RF-12 (presentación de fechas en la interfaz de forma accesible y localizada).
- `obtenerDiaSemanaNombre(fecha: Date, hoy: Date): string` → Devuelve el nombre del día de semana (lunes, martes, etc.) en español.  
  **RF cubre:** RF-10, RF-11, RF-12 (presentación de días en la interfaz).

### src/utils/disponibilidadUtils.js
- `calcularHorariosDisponibles(consultasOcupadas: Array<{inicio: string, fin: string}>, fecha: Date, intervaloMinutos: number = 30): Array<{inicio: string, fin: string}>` →  
  **Entrada:** 
    - `consultasOcupadas`: lista de objetos que representan consultas ya existentes para el médico en la fecha dada, cada uno con `inicio` y `fin` en formato ISO string (solo hora y minutos relevantes, asumiendo misma fecha).
    - `fecha`: la fecha para la que se consulta disponibilidad (objeto Date). Se usa para conocer el día de la semana y validar que no sea festivo si fuera necesario (pero aquí solo consideramos horario laboral).
    - `intervaloMinutos`: duración de cada slot (por defecto 30 minutos).
  **Salida:** lista de objetos `{inicio: string, fin: string}` en formato ISO string (solo hora) que representan los bloques libres dentro del horario laboral (7:00–19:00) que no se solapan con ninguna consulta ocupada.
  **Algoritmo:** (ver sección 4).  
  **RF cubre:** RF-5 (mostrar horarios disponibles en formato lista o cuadrícula), RF-16 (verificar existencia de paciente/médico se hace en servicios, pero la disponibilidad se basa en consultas existentes).  
  **Nota:** Esta función es pura; no realiza efectos secundarios y depende solo de sus argumentos. Es determinística dada la misma entrada.

### src/utils/validationUtils.js
- `validarDNI(dni: string): {esValido: boolean, mensaje?: string}` → Valida que cumpla con la expresión regular `\d{2}\.\d{3}\.\d{3}`.  
  **RF cubre:** RF-4, RF-14, caso límite de DNI incorrecto.
- `validarEmail(email: string): {esValido: boolean, mensaje?: string}` → Valida con una expresión razonable para correo electrónico.  
  **RF cubre:** RF-4, RF-14, caso límite de email incorrecto.
- `validarTelefono(tel: string): {esValido: boolean, mensaje?: string}` → Valida según formato local (ej. `\d{4}\-\d{4}` o similar).  
  **RF cubre:** RF-4, RF-14, caso límite de telefono incorrecto.
- `validarNombre(nombre: string): {esValido: boolean, mensaje?: string}` → Valida que no esté vacío ni solo espacios.  
  **RF cubre:** RF-4, RF-14, caso límite de nombre vacío.

## 4. Algoritmo del mapa en pseudocódigo

El algoritmo se implementa en la función pura `calcularHorariosDisponibles` (ver sección 3). Su propósito es transformar una lista de consultas ocupadas en una lista de bloques libres dentro del horario laboral.

```
FUNCTION calcularHorariosDisponibles(consultasOcupadas, fecha, intervaloMinutos):
    // Definir horario laboral: inicio 07:00, fin 19:00 (en minutos desde medianoche)
    INICIO_LABORAL ← 7 * 60   // 420 minutos
    FIN_LABORAL ← 19 * 60     // 1140 minutos
    // Convertir intervalo a minutos
    intervalo ← intervaloMinutos

    // Crear un arreglo booleano que marque cada minuto del día laboral como libre (true) u ocupado (false)
    // Para eficiencia, trabajaremos con bloques de intervaloMinutos.
    // Número de slots en el día laboral:
    numSlots ← (FIN_LABORAL - INICIO_LABORAL) / intervalo
    slotsLibres ← arreglo de booleanos de longitud numSlots, inicializado a true

    // Marcar los slots ocupados por consultas existentes
    PARA CADA consulta EN consultasOcupadas HACER:
        inicioMin ← obtenerMinutosDesdeMedianoche(consulta.inicio)
        finMin ← obtenerMinutosDesdeMedianoche(consulta.fin)
        // Asegurarnos de que la consulta esté dentro del mismo día (ignoramos si cruza medianoche, asumiendo consultas dentro de un día)
        SI inicioMin < INICIO_LABORAL O finMin > FIN_LABORAL ENTONCES:
            // La consulta está parcialmente fuera del horario laboral; ajustamos al horario laboral
            inicioMin ← max(inicioMin, INICIO_LABORAL)
            finMin ← min(finMin, FIN_LABORAL)
        FIN SI
        // Convertir a índices de slots
        indiceInicio ← (inicioMin - INICIO_LABORAL) / intervalo
        indiceFin ← (finMin - INICIO_LABORAL) / intervalo   // exclusivo
        PARA i DESDE indiceInicio HASTA indiceFin - 1 HACER:
            slotsLibres[i] ← false
        FIN PARA
    FIN PARA

    // Construir la lista de bloques libres consecutivos
    resultado ← lista vacía
    i ← 0
    MIENTRAS i < numSlots HACER:
        SI slotsLibres[i] ENTONCES:
            inicioSlot ← INICIO_LABORAL + i * intervalo
            // Contar cuántos slots libres consecutivos hay
            j ← i
            MIENTRAS j < numSlots Y slotsLibres[j] ENTONCES:
                j ← j + 1
            FIN MIENTRAS
            finSlot ← INICIO_LABORAL + j * intervalo
            // Convertir minutos a strings de hora HH:MM
            horaInicio ← formatearHoraMinutos(inicioSlot)
            horaFin ← formatearHoraMinutos(finSlot)
            AGREGAR AL resultado: {inicio: horaInicio, fin: horaFin}
            i ← j
        SINO:
            i ← i + 1
        FIN SI
    FIN MIENTRAS

    DEVOLVER resultado
```

**Funciones auxiliares (también puras):**
- `obtenerMinutosDesdeMedianoche(horaISO: string): number` → parsea la hora ISO y devuelve minutos desde medianoche (0-1439).
- `formatearHoraMinutos(minutosDesdeMedianoche: number): string` → devuelve cadena "HH:MM" con dos dígitos cada uno.

**Notas:**
- El algoritmo asume que las consultas ocupadas ya pertenecen a la fecha solicitada (el backend debería filtrar por médico y fecha).
- El horario laboral es fijo (7:00–19:00). Si se requiere variar por médico o día, se puede adaptar fácilmente.
- La complejidad es O(n + m) donde n es número de consultas ocupadas y m es número de slots (máximo 24*2 = 48 slots si intervalo 30 min).
- Esta función es pura y determinística siempre que se pase la misma entrada.

## 5. Cómo se pinta en la interfaz

El componente `DisponibilidadGrid` (en `src/components/disponibilidad/DisponibilidadGrid.jsx`) recibe la lista de horarios disponibles (salida de `calcularHorariosDisponibles`) y la representa visualmente. El componente `DisponibilidadList` es una alternativa más simple que muestra una lista.

### Opción Cuadrícula (Grid)
- **Encabezados:**  
  - Fila superior: etiquetas de horas de inicio de cada slot (ej. 07:00, 07:30, 08:00, ..., 18:30).  
  - No hay columnas de médicos porque la disponibilidad es para un médico específico (seleccionado previamente).
- **Celdas:**  
  - Cada celda representa un slot de tiempo (por ejemplo, 30 minutos).  
  - Si el slot está disponible, se renderiza como un botón o elemento seleccionable con un estilo destacado (fondo verde claro).  
  - Si el slot no está disponible (porque está ocupado o fuera de horario laboral), se renderiza como deshabilitado (fondo gris claro, texto tenue).  
  - Al hacer clic en un slot disponible, se llama a una función `onSlotSelect(inicio, fin)` que permite al usuario continuar con la creación de la cita (abriendo un formulario o confirmando la selección).  
  - Cada celda incluye un `aria-label` que indica el rango de hora y su estado (ej. "07:00-07:30 - Disponible" o "07:00-07:30 - Ocupado").
- **Accesibilidad:**  
  - Las celdas seleccionables son navigables mediante teclado (tabIndex) y pueden recibir enfoque visible (RF-11).  
  - Se asegura contraste suficiente entre el texto y el fondo, cumpliendo WCAG 2.1 AA (RNF-1).  
  - Se evita usar solo color para indicar estado; se combina con texto o iconos si fuera necesario.
- **Responsividad:**  
  - La cuadrícula se adapta al ancho de la pantalla usando CSS Grid con `auto-fill` y `minmax(60px, 1fr)` para que las celdas tengan un ancho mínimo pero se envuelvan en múltiples filas si el espacio es estrecho (RNF-2).  
  - En pantallas muy estrechas, se puede cambiar automáticamente a la representación de lista (`DisponibilidadList`) mediante un media query o un hook que detecte el ancho.

### Opción Lista
- Simplemente renderiza cada bloque libre como un elemento de lista (por ejemplo, `<li>07:00 - 08:00</li>`) con un botón de "Seleccionar" al lado.  
- Se usa cuando el número de slots libres es pequeño o el espacio es limitado.

### Actualización en tiempo real
- Cuando llega una nueva consulta mediante suscripción al backend (WebSocket o polling), se vuelve a llamar al servicio de consulta para obtener la disponibilidad actualizada y se actualiza el estado, lo que provoca un re-renderizado del componente de disponibilidad, cumpliendo RF-7 y RNF-3 (latencia máxima 2 segundos).

## 6. Decisiones técnicas justificadas (y su alternativa descartada)

### 6.1. Selección del framework de frontend
- **Decisión:** Utilizar **React** (con Vite como bundler) para construir la SPA.  
- **Justificación:** React ofrece un ecosistema maduro, componentes reutilizables, y una curva de aprendizaje adecuada para el equipo. Su modelo de estado y props facilita la separación entre lógica de presentación y lógica de negocio (cumpliendo con la constitución punto 3: lógica de negocio separada de la interfaz). Además, permite integrarse fácilmente con bibliotecas de estado (como Redux o Context) y de routing.  
- **Alternativa descartada:** Vue.js. Aunque Vue también es una excelente opción, se descartó porque el equipo tiene más experiencia con React y la documentación y soporte comunitario son ligeramente más extensos para casos de uso empresarial. Además, React se alinea mejor con la posibilidad de reutilizar conocimientos en futuros proyectos dentro de la organización.

### 6.2. Biblioteca de gestión de estado
- **Decisión:** Utilizar **React Context API** combinado con `useReducer` para el estado global (autenticación, listas de entidades).  
- **Justificación:** Evita la complejidad y el boilerplate de Redux para una aplicación de tamaño medio. Context API es parte de React, por lo que no agrega dependencias externas (cumpliendo con la constitución punto 4 si se interpreta que aplica al frontend también, ya que no se instalan paquetes externos más allá de lo necesario para React). Mantiene el estado predecible y testable.  
- **Alternativa descartada:** Redux con Toolkit. Se descartó porque introduciría conceptos adicionales (actions, reducers, store) que no son estrictamente necesarios dado el alcance de la aplicación y agregaría una dependencia externa que, aunque mínima, podría considerarse innecesaria bajo una interpretación estricta de "no se instalan paquetes externos".

### 6.3. Enrutamiento
- **Decisión:** Utilizar **React Router v6**.  
- **Justificación:** Es la solución estándar para routing en React, soporta rutas anidadas, protección de rutas y lazy loading. Está ampliamente probado y tiene buena integración con los hooks de React.  
- **Alternativa descartada:** Enrutamiento manual basado en `window.location.hash`. Se descartó porque es propenso a errores, no maneja bien el historial y no ofrece características como carga diferida de código o transiciones.

### 6.4. Estilos y theming
- **Decisión:** Utilizar **CSS Modules** o **CSS estándar** con variables de `:root` para colores y espaciados.  
- **Justificación:** Mantiene los estilos cerca de los componentes, evita conflictos de nombre y permite tematización sencilla. Si se elige CSS estándar con variables, se cumple con la constitución punto 4 (no se instalan paquetes externos) ya que solo se usan archivos .css que son parte del proyecto.  
- **Alternativa descartada:** Frameworks de CSS como Bootstrap o Material-UI. Se descartaron porque añaden una capa de abstracción que puede limitar la personalización y aumentar el tamaño del bundle. Además, para cumplir estrictamente con WCAG 2.1 AA y los requisitos de diseño específicos, es más sencillo escribir CSS propio que sobrescribir o deshacer estilos de un framework.

### 6.5. Manejo de llamadas al backend
- **Decisión:** Utilizar **fetch** con una capa de envoltura (services) que añada automáticamente el token de autorización y maneje errores comunes.  
- **Justificación:** `fetch` está disponible nativamente en los navegadores modernos y no requiere dependencias adicionales. Envolverlo en funciones de servicio permite centralizar la lógica de encabezados y manejo de errores, manteniendo los componentes limpios.  
- **Alternativa descartada:** Axios. Se descartó porque, aunque ofrece algunas conveniencias (interceptores, transformación automática de JSON), es una dependencia externa que no aporta suficientes beneficios como para justificar su inclusión bajo la constitución punto 4.

### 6.6. Visualización de disponibilidad
- **Decisión:** Implementar la visualización de disponibilidad usando **CSS Grid** para la opción de cuadrícula y **lista simple** para la alternativa, sin librerías de UI pesadas.  
- **Justificación:** La disponibilidad se muestra como una serie de bloques de tiempo, lo que se presta naturalmente a una cuadrícula o lista. Usar CSS Grid permite un control preciso del layout, es totalmente responsive y no agrega dependencias externas. El rendimiento es excelente para el número esperado de slots (máximo 48).  
- **Alternativa descartada:** Librería de calendario o date-picker (como DayPicker de react-datepicker o similar). Se descartó porque introduciría una dependencia externa significativa y añadiría complejidad innecesaria para un caso de uso tan sencillo (solo selección de hora dentro de un día ya seleccionado). Además, lograr la misma nivel de accesibilidad y responsividad con una librería de terceros puede requerir esfuerzo adicional y podría no adaptarse exactamente al flujo de trabajo (selección de médico → fecha → hora).

## 7. Estrategia de tests con node --test

La estrategia de tests se divide en dos niveles: tests de unidad de funciones puras y tests de componentes (renderizado y comportamiento). Todos los tests deben poder ejecutarse con `node --test` (el runner de pruebas incorporado en Node.js v20+), aunque para los tests de componentes se puede usar una combinación de `@testing-library/react` y `@testing-library/jest-dom` si se consideran dependencias del proyecto (es decir, listadas en `package.json`). La constitución punto 4 ("Tests solo con dependencias del proyecto; no se instalan paquetes externos") se interpreta como: las dependencias de testing deben estar declaradas en `package.json` y ser parte del proyecto, no paquetes instalados ad hoc fuera del archivo de manifiesto. Por lo tanto, podemos incluir bibliotecas de testing en `devDependencies` de `package.json` y cumplir con la constitución.

### 7.1. Tests de funciones puras (utils/)
- **Ubicación:** `src/utils/__tests__/` (o colocados junto a los archivos si se prefiere).  
- **Ejemplo:** `disponibilidadUtils.test.js`  
- **Enfoque:**  
  - Importar la función pura (ej. `calcularHorariosDisponibles`).  
  - Proveer datos de entrada conocidos (lista de consultas ocupadas con horarios específicos, fecha y intervalo).  
  - Comparar la salida esperada (lista de bloques libres) usando `assert.deepStrictEqual` del módulo `assert` de Node.  
  - Probar casos edge: lista vacía (debería devolver todo el día laboral), consultas que ocupan todo el día (debería devolver lista vacía), consultas fuera del horario laboral (debería ignorarse), consultas que comienzan o terminan exactamente en límites de slot, etc.  
  - **RFs cubiertos:** RF-5 (mostrar horarios disponibles), RF-16 (validaciones indirectamente, ya que la disponibilidad se basa en consultas existentes).  
- **Ejecución:** Estos tests se ejecutan directamente con `node --test src/utils/**/*.test.js`.

### 7.2. Tests de componentes (React Testing Library)
- **Ubicación:** `src/components/**/__tests__/` o `src/components/**/*.test.jsx`.  
- **Ejemplo:** `DisponibilidadGrid.test.jsx`  
- **Enfoque:**  
  - Renderizar el componente con datos de prueba (lista de horarios disponibles).  
  - Verificar que se renderizan el número correcto de celdas según la cantidad de slots disponibles y ocupados.  
  - Verificar que las celdas disponibles son seleccionables y tienen el `aria-label` esperado.  
  - Verificar que las celdas ocupadas están deshabilitadas y tienen el estilo adecuado.  
  - Simular un clic en una celda disponible y asegurar que se llama a la función de callback con los rangos de hora correctos.  
  - Probar la responsividad: cambiar el ancho del contenedor y verificar que la cuadrícula se ajusta (por ejemplo, cambia de una fila múltiple a una sola fila según el espacio).  
  - **RFs cubiertos:** RF-5 (visualización de disponibilidad en formato lista o cuadrícula), RF-10 (responsividad), RF-11 (foco visible se puede testear simulando tabulación y verificando que el elemento enfocado tiene un outline), RF-12 (etiquetas ARIA presentes), RF-7 (actualización en tiempo real se puede testear simulando un cambio de props y verificando re-renderizado).  
- **Ejecución:** Estos tests también se pueden ejecutar con `node --test` si se configura un entorno de DOM simulado (por ejemplo, usando `jsdom` como entorno de test). Alternativamente, se puede usar Vitest (que es compatible con `node --test` en modo de observación) pero se mantiene como dependencia del proyecto.

### 7.3. Tests de servicios y hooks
- **Servicios:** Se pueden mockear las llamadas al backend usando `msw` (Mock Service Worker) o simplemente creando una versión fake de `fetch` que devuelva respuestas predefinidas. Los tests verifican que se construyan correctamente las URLs, que se añadan los headers de autorización y que se manejen los errores.  
- **Hooks:** Se testean renderizando un componente wrapper que use el hook y se simulan cambios en el estado o en las propiedades.  
- **RFs cubiertos:** Todos los RFs que involucran interacción con el backend (RF-3, RF-6, RF-7, RF-8, RF-9, RF-14, RF-15, RF-16) y los requisitos no funcionales de comunicación segura (RNF-6) y manejo de errores (RNF-4, RNF-5).

### 7.4. Cobertura y criterios de finalización
- Se busca una cobertura de línea del 80%+ en funciones puras y servicios.  
- Los tests de componentes deben cubrir los principales flujos de interacción (login, creación de paciente, selección de disponibilidad, creación de cita).  
- Todos los tests deben pasar en el entorno de integración continua (aunque no se configure CI, se espera que se ejecuten localmente antes de commit).  
- **RFs cubiertos por la estrategia de tests:** La estrategia de tests en sí no implementa RFs, pero asegura que los RFs implementados sean correctos y no regresen. Por lo tanto, indirectamente cubre todos los RFs al verificar su cumplimiento.

## 8. Mapeo de partes del plan a RFs y RNFs

A continuación se indica qué requisitos funcionales y no funcionales son abordados por cada sección del plan.

- **Resumen del plan anterior:** Cubre todos los RFs y RNFs al ser una réplica del plan que ya los abordaba.
- **Archivos y responsabilidades:**  
  - Componentes de pacientes → RF-2, RF-3, RF-4, RF-14, RF-15.  
  - Componentes de consultas (incluyendo disponibilidad) → RF-5, RF-6, RF-7, RF-8, RF-16.  
  - Componentes de médicos → RF-16 (verificación de existencia).  
  - Componentes de disponibilidad → RF-5 (mostrar horarios disponibles), RF-10 (responsividad), RF-11 (foco visible), RF-12 (ARIA).  
  - Servicios → RF-3, RF-6, RF-7, RF-8, RF-9, RF-14, RF-15, RF-16, RNF-6.  
  - Utils (funciones puras) → RF-4, RF-14, RF-15, RF-16 (validaciones), RF-5 (disponibilidadUtils).  
  - Layout y routing → RF-1 (página principal según rol), RF-13 (cierre de sesión).  
  - Estilos → RNF-1 (WCAG 2.1 AA), RNF-2 (responsive), RNF-3 (latencia se ve afectada por eficiencia de renderizado).  
  - Estado (store/hooks) → RF-1, RF-3, RF-6, RF-7, RF-8, RF-9, RF-13, RNF-7 (mantener estado).  
- **Funciones puras:** Directamente respaldan RF-4, RF-14, RF-15, RF-16 (validaciones) y RF-5 (disponibilidad).  
- **Algoritmo del mapa:** Soporta RF-5 (mostrar horarios disponibles en formato lista o cuadrícula) mediante el cálculo puro de bloques libres.  
- **Pintado en la interfaz:** Cumple RF-5, RF-10, RF-11, RF-12, RNF-1, RNF-2.  
- **Decisiones técnicas:** Cada decisión se justifica mostrando cómo ayuda a cumplir con la constitución y los RFs/RNFs (ej. usar CSS Grid para responsividad y accesibilidad).  
- **Estrategia de tests:** Asegura que todos los RFs y RNFs implementados sean correctos y no introduzcan regresiones, cumpliendo con la constitución punto 2 (código fiel a la spec) y punto 4 (tests con dependencias del proyecto).

## 9. Conclusión

Este plan describe detalladamente cómo implementar el frontend del proyecto Vollmed, incluyendo la visualización de disponibilidad de citas (mapa de horarios), respetando en todo momento la constitución del proyecto y asegurando que todos los requisitos funcionales y no funcionales especificados en specs/001-front-end/spec.md estén cubiertos. El plan está listo para ser ejecutado por un equipo de desarrollo siguiendo las pautas establecidas.