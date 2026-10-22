package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.ConsultaRepository;
import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionPacienteEnElMismoDia implements ValidadorDeConsultas{
    @Autowired
    private ConsultaRepository consultaRepository;
    public void validar(DTOConsultaReserva datos){
        var primerHorario=datos.fecha().withHour(7);
        var ultimoHorario=datos.fecha().withHour(18);
        var pacienteTieneOtraConsultaElMismoDia=consultaRepository.existsByPacienteIdAndFechaBetween(datos.idPaciente(),primerHorario,ultimoHorario);
        if(pacienteTieneOtraConsultaElMismoDia){
            throw new ValidacionException("No se puede crear la consulta porque el paciente tiene una consulta el mismo dia");
        }
    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {

    }
}
