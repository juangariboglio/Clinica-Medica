package med.voll.api.paciente;

import med.voll.api.dto.DTODireccion;

//DTO CON TODOS LOS DATOS DEL PACIENTE PARA EL MODO EDICION DEL FORMULARIO DEL FRONTEND.
//DTOListadoPaciente SOLO TRAE ID/NOMBRE/EMAIL/DNI; ESTE TRAE TAMBIEN TELEFONO Y DIRECCION.
public record DTODetallePaciente(Long id,
                                 String nombre,
                                 String email,
                                 String telefono,
                                 String dni,
                                 DTODireccion direccion,
                                 Boolean activo) {

    public DTODetallePaciente(Paciente paciente) {
        this(paciente.getId(),
                paciente.getNombre(),
                paciente.getEmail(),
                paciente.getTelefono(),
                paciente.getDni(),
                new DTODireccion(paciente.getDireccion().getCalle(),
                        paciente.getDireccion().getDistrito(),
                        paciente.getDireccion().getCiudad(),
                        paciente.getDireccion().getNumero(),
                        paciente.getDireccion().getComplemento()),
                paciente.getActivo());
    }
}
