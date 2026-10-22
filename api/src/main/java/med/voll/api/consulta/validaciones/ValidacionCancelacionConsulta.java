package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.Consulta;
import med.voll.api.consulta.ConsultaRepository;
import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionCancelacionConsulta implements ValidadorDeConsultas{
    @Autowired
    private ConsultaRepository consultaRepository;
    @Override
    public void validar(DTOConsultaReserva datos) {

    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {
        Optional<Consulta> consulta=consultaRepository.findById(datos.idConsulta());
        if (datos.motivo()==null){
            throw new ValidacionException("No se dio el motivo de la cancelacion de la consulta");
        }
        var fechaAhora= LocalDateTime.now();
        if (consulta.isPresent()){
            var limiteCancelacion=consulta.get().getFecha().minusHours(24);
            if (fechaAhora.isAfter(limiteCancelacion)){
                throw new ValidacionException("No se puede cancelar la consulta porque tiene que ser menos de 24 horas");
            }
        }
    }
}
