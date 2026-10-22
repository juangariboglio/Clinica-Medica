package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.ConsultaRepository;
import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionMedicoConOtraConsultaEnElMismoHorario implements ValidadorDeConsultas{
    @Autowired
    private ConsultaRepository consultaRepository;
    public void validar(DTOConsultaReserva datos){
        var consultaMismoHorario=consultaRepository.existsByMedicoIdAndFecha(datos.idMedico(),datos.fecha());
        if(consultaMismoHorario){
            throw new ValidacionException("No se puede reservar la consulta porque el medico tiene una fecha el mismo horario");
        }
    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {

    }
}
