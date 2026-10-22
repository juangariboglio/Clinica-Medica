package med.voll.api.consulta.validaciones;

import med.voll.api.consulta.DTOCancelamientoConsulta;
import med.voll.api.consulta.DTOConsultaReserva;
import med.voll.api.infra.errores.ValidacionException;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
@Component//ANOTACION IMPORTANTE PARA LAS VALIDACIONES
public class ValidacionFueraHorarioConsulta implements ValidadorDeConsultas{
    public void validar(DTOConsultaReserva datos){
        //EL HORARIO DE ATENCION DE LA CLINICA ES DE LUNES A SABADO DE 7:00 A 19:00
        var fechaConsulta=datos.fecha();
        var domingo=fechaConsulta.getDayOfWeek().equals(DayOfWeek.SUNDAY);
        var horarioAntesDeAperturaClinica=fechaConsulta.getHour()<7;
        var horarioDespuesDeCierreClinica=fechaConsulta.getHour()>18;//HASTA LA HORA 18 PARA NO RESERVAR CONSULTAS A LAS 19 HS
        if(domingo || horarioAntesDeAperturaClinica || horarioDespuesDeCierreClinica){
            throw new ValidacionException("Horario seleccionado fuera del horario de atendimiento de la clinica");
        }
    }

    @Override
    public void validar(DTOCancelamientoConsulta datos) {

    }
}
