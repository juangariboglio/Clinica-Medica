package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import med.voll.api.paciente.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionPacienteActivo implements ValidadorDeConsultas{
    @Autowired
    private PacienteRepository pacienteRepository;
    public void validar(DTOConsultaReserva datos){
        var PacienteActivo=pacienteRepository.findActivoById(datos.idPaciente());
        if(!PacienteActivo){
            throw new ValidacionException("No se puede reservar la consulta porque el paciente no esta activo");
        }
    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {

    }
}
