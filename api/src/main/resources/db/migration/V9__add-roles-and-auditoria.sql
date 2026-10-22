-- ROLES DE USUARIO
-- Los usuarios existentes quedan como recepcion para no conceder privilegios de borrado
-- de forma masiva. El usuario demo se deja como administrador para conservar la demo.
ALTER TABLE usuario ADD COLUMN rol VARCHAR(30) NOT NULL DEFAULT 'ROLE_RECEPCION';
UPDATE usuario SET rol = 'ROLE_ADMIN' WHERE login = 'recepcion.e2e';

-- AUDITORIA DE OPERACIONES SENSIBLES
CREATE TABLE auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL,
    accion VARCHAR(30) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id BIGINT,
    detalle VARCHAR(500),
    fecha_hora DATETIME(6) NOT NULL
);

CREATE INDEX idx_auditoria_fecha_hora ON auditoria (fecha_hora);
CREATE INDEX idx_auditoria_usuario ON auditoria (usuario);
