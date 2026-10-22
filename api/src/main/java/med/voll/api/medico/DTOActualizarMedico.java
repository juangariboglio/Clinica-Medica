package med.voll.api.medico;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import med.voll.api.Especialidad;
import med.voll.api.dto.DTODireccion;

//ESTE DTO ESTA HECHO PARA QUE TIPO DE DATOS ACTUALIZAR.
//EL ID ES PARA BUSCAR EL MEDICO; SE PUEDEN CAMBIAR NOMBRE, EMAIL, TELEFONO,
//ESPECIALIDAD Y DIRECCION. EL DNI NO SE ENVIA: EL FRONTEND LO BLOQUEA.
public record DTOActualizarMedico(@NotNull Long id,
                                  String nombre,
                                  @Email
                                  String email,
                                  String telefono,
                                  String dni,
                                  Especialidad especialidad,
                                  DTODireccion direccion) {
}
