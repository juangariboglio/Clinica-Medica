package med.voll.api.consulta;

import med.voll.api.consulta.validaciones.ValidadorDeConsultas;
import med.voll.api.infra.errores.ValidacionException;
import med.voll.api.medico.Medico;
import med.voll.api.medico.MedicoRepository;
import med.voll.api.paciente.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service//ANOTACION IMPORTANTE
public class ReservaDeConsultas {
    @Autowired
    private MedicoRepository medicoRepository;
    @Autowired
    private PacienteRepository pacienteRepository;
    @Autowired
    private ConsultaRepository consultaRepository;
    //LISTA CON TODAS LAS VALIDACIONES YA GUARDADAS AUTOMATICAMENTE
    @Autowired
    private List<ValidadorDeConsultas> validadores;
    //ACA SE EJECUTAN LAS REGLAS DE NEGOCIO
    public DTODetalleConsulta reservar(DTOConsultaReserva datos){
        //EL ERROR ValidacionException SE CREO
        if(!pacienteRepository.existsById(datos.idPaciente())){
            throw new ValidacionException("No existe paciente con el id informado");
        }
        //datos.idMedico()!=null VERIFICA SI EL ID QUE SE ENVIO NO ES NULO
        if(datos.idMedico()!=null && !medicoRepository.existsById(datos.idMedico())){
            throw new ValidacionException("No existe medico con el id informado");
        }
        //VALIDACIONES (con esto ejecutamos cada una de las validaciones de las reglas de negocio)
        validadores.forEach(v-> v.validar(datos));
        //EL METODO DE ABAJO SE CREA
        var medico=elegirMedico(datos);//BUSCAMOS EL ID DEL MEDICO DE ESTA FORMA
        //datos.idMedico()!=null VERIFICA SI EL ID QUE SE ENVIO NO ES NULO
        if(medico==null){
            throw new ValidacionException("No existe un medico disponible ese horario");
        }
        var paciente=pacienteRepository.findById(datos.idPaciente()).get();//BUSCAMOS EL ID DEL PACIENTE DE ESTA FORMA
        var consulta=new Consulta(null,medico,paciente,datos.fecha(),null);
        consultaRepository.save(consulta);
        return new DTODetalleConsulta(consulta);
    }

    private Medico elegirMedico(DTOConsultaReserva datos) {
        if(datos.idMedico()!=null){
            return medicoRepository.getReferenceById(datos.idMedico());
        }
        if(datos.especialidad()==null)
        {
            throw new ValidacionException("Es necesario elegir una especialidad cuando no se elige un medico");
        }
        return medicoRepository.elegirMedicoAleatorioDisponibleEnLaFecha(datos.especialidad(),datos.fecha(), PageRequest.of(0, 1)).getContent().stream().findFirst().orElse(null);
    }
    public void cancelar(DTOCancelamientoConsulta datos) {
        if (!consultaRepository.existsById(datos.idConsulta())) {
            throw new ValidacionException("Id de la consulta informado no existe!");
        }
        validadores.forEach(v-> v.validar(datos));
        var consulta = consultaRepository.getReferenceById(datos.idConsulta());
        consulta.cancelar(datos.motivo());
    }
}
