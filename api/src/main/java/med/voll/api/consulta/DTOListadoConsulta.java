package med.voll.api.consulta;

import java.time.LocalDateTime;

//DTO PARA LA VISTA DE AGENDA DEL FRONTEND: A DIFFERENCIA DE DTODetalleConsulta,
//INCLUYE LOS NOMBRES DE MEDICO Y PACIENTE PARA PODER MOSTRARLOS EN LA LISTA.
public record DTOListadoConsulta(Long id,
                                 Long idMedico,
                                 String nombreMedico,
                                 Long idPaciente,
                                 String nombrePaciente,
                                 LocalDateTime fecha) {

    public DTOListadoConsulta(Consulta consulta) {
        this(consulta.getId(),
                consulta.getMedico().getId(),
                consulta.getMedico().getNombre(),
                consulta.getPaciente().getId(),
                consulta.getPaciente().getNombre(),
                consulta.getFecha());
    }
}
