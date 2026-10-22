-- USUARIO DE BASE DE DATOS CON PRIVILEGIOS MINIMOS PARA PRODUCCION
-- Ejecutar como administrador de MySQL, una sola vez, cambiando la clave.
-- El usuario necesita DDL porque Flyway aplica las migraciones al arrancar.
-- Si se separa Flyway del runtime, quitar CREATE/ALTER/DROP/INDEX/REFERENCES al usuario de la app.

CREATE USER 'vollmed_app'@'%' IDENTIFIED BY '<CAMBIAR_POR_CLAVE_SEGURA>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
    ON vollmed_api.* TO 'vollmed_app'@'%';
FLUSH PRIVILEGES;

-- RECOMENDADO: restringir el host real de la aplicacion en lugar de '%',
-- por ejemplo 'vollmed_app'@'10.0.0.25'.
