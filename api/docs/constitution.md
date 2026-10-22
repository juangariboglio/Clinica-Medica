# Constitución del Proyecto Vollmed

1. Stack mínimo: Java 17, Spring Boot 4.1.1 y Maven; sin dependencias extra.
2. Código fiel a la spec: comportamiento exactamente lo especificado, ni más ni menos.
3. Lógica de negocio separada de la interfaz (services/repositorios vs controllers).
4. Tests solo con dependencias del proyecto; no se instalan paquetes externos.
5. Protección de datos: contraseñas con bcrypt, nunca en texto plano.
6. Código en ingles; comentarios y textos de la aplicación en español.
7. **La spec manda**: nada se implementa si no está en la spec activa. Si falta una
decisión, se para y se pregunta. 
