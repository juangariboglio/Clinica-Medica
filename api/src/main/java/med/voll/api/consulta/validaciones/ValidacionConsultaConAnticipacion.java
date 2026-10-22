package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionConsultaConAnticipacion implements ValidadorDeConsultas{
    //LAS CONSULTAS NO PUEDEN REALIZARSE CON 30 MINUTOS DE ANTICIPACION
    public void validar(DTOConsultaReserva datos){
        var fechaConsulta=datos.fecha();
        var ahora= LocalDateTime.now();
        var diferenciaEnMinutos= Duration.between(ahora,fechaConsulta).toMinutes();
        if(diferenciaEnMinutos<30){
            throw new ValidacionException("El horario seleccionado es menor que 30 minutos de anticipacion");
        }
    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {

    }
}
