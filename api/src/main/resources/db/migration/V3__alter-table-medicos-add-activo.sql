alter table medico add activo bit;
-- ESTA LINEA ES PARA ACTUALIZAR LOS MEDICOS CON EL ACTIVO
update medico set activo=1;
-- ESTO ES PARA AGREGAR activo A LA TABLA medico
