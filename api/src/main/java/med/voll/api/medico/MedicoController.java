package med.voll.api.medico;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import med.voll.api.dto.*;
import med.voll.api.infra.auditoria.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/medico")
@SecurityRequirement(name = "bearer-key")//ESTO SIRVE PARA QUE EN ESTA URL http://localhost:8080/swagger-ui/index.html ESTE EL TOKEN GUARDADO DEL LOGEO DEL USUARIO
@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
public class MedicoController {
    @Autowired
    private MedicoRepository medicoRepository;
    @Autowired
    private AuditoriaService auditoriaService;
    //ESTE ARROBA DE ABAJO ES PARA IDENTIFICAR QUE ESTE ENDPOINT ES UN POST
    //POST ES PARA RECIBIR DATOS
    //http://localhost:8080/medico
    @PostMapping
    //EN EL PARENTESIS VA @RequestBody PARA QUE Spring SEPA QUE ES UN JSON LO QUE RECIBE EL ENDPOINT
    //CON @Valid SE VERIFICA QUE LO QUE SE RECIBE DEL JSON CUMPLA LAS RESTRICCIONES DE LAS ANOTACIONES HECHAS EN DTORegistroMedico
    //ESTE METODO ES DE TIPO ResponseEntity, ESTE METODO RETORNA UN TIPO DE RESPUESTA HTTP
    public ResponseEntity<DTORespuestaMedico> RegistrarMedicos(@RequestBody @Valid DTORegistroMedico json, //EN EL PARENTESIS VA LO QUE SE RECIBE DEL ENDPOINT, EN ESTE CASO json
                                                               UriComponentsBuilder uriComponentsBuilder){
        //CON LA LINEA DE ABAJO GUARDAMOS EL JSON QUE RECIBIMOS EN LA BASE DE DATOS
        //TENER EN CUENTA QUE SE CREO UN NUEVO CONSTRUCTOR DE MEDICO EN EL QUE LE PASAMOS COMO PARAMETRO EL DTO
        Medico medico=medicoRepository.save(new Medico(json));
        auditoriaService.registrar("CREAR", "MEDICO", medico.getId(), medico.getNombre());
        //PARA LA RESPUESTA DEL BODY VAN TODOS ESTOS DATOS
        DTORespuestaMedico dtoRespuestaMedico=new DTORespuestaMedico(medico.getId(), medico.getNombre(),medico.getEspecialidad().toString(),medico.getEmail(),medico.getTelefono(),medico.getDni(),
                new DTODireccion(medico.getDireccion().getCalle(),medico.getDireccion().getDistrito(),
                        medico.getDireccion().getCiudad(),medico.getDireccion().getNumero(),medico.getDireccion().getComplemento()));
        //UriComponentsBuilder SE USA PARA CUANDO EL URL ES DINAMICO, ES DECIR, PARA CUANDO SEA UN DOMINIO DIFERENTE
        //EN ESTE CASO ESTAMOS USANDO localhost:8080 PERO EN UN FUTURO NO VA A SER ESTE
        URI url=uriComponentsBuilder.path("/medicos/{id}").buildAndExpand(medico.getId()).toUri();
        //MUY IMPORTANTE LINEA DE ABAJO Y DE ARRIBA
        return ResponseEntity.created(url).body(dtoRespuestaMedico);
        //VER EN headers DE Insomnia LA URL QUE NOS DEVUELVE
    }
    //IMPORTANTE A TENER EN CUENTA
    //EN ESTA AULA SE ESTA USANDO EL REPOSITORIO PARA EL CONTROLLER
    //EN LAS AULAS DE OCTUBRE SE USA UN SERVICE PARA EL CONTROLLER, NO EL REPOSITORIO
    @GetMapping
    //http://localhost:8080/medico?size=2&page=0&sort=dni
    // SE PUEDEN USAR ESTOS PARAMETROS PARA LA PAGINA
    //O DEFINIRLOS EN EL PARENTESIS DE @PageableDefault()
    //ESTE METODO ES DE TIPO ResponseEntity, ESTE METODO RETORNA UN TIPO DE RESPUESTA HTTP
    public ResponseEntity<Page<DTOListadoMedico>> mostrarMedicos(@PageableDefault() Pageable paginacion){
    //        return medicoRepository.findAll(paginacion).map(DTOListadoMedico::new);
    // PARA ESTE MAPEAMENTO DE DATOS SE NECESITA UN CONSTRUCTOR EN DTOListadoMedico
        return ResponseEntity.ok(medicoRepository.findByActivoTrue(paginacion).map((DTOListadoMedico::new)));
    }
    //http://localhost:8080/medico
    @PutMapping
    @Transactional//IMPORTANTE PARA LA ACTUALIZACION/CAMBIO DE DATOS
    //ESTE METODO ES DE TIPO ResponseEntity, ESTE METODO RETORNA UN TIPO DE RESPUESTA HTTP
    //EN ESTE METODO ESTAMOS RETORNANDO .ok() Y COMO PARAMETRO NECESITA UN BODY, QUE EN ESTE CASO LE DAMOS EL medico
    public ResponseEntity<DTORespuestaMedico> actualizarMedicos(@RequestBody @Valid DTOActualizarMedico dtoActualizarMedico){
        //SE GUARDA EL MEDICO QUE SE TIENE QUE ACTUALIZAR BUSCADO POR ID
        Medico medico=medicoRepository.getReferenceById(dtoActualizarMedico.id());
        //PARA ACTUALIZAR DATOS SE TIENE QUE CREAR ESTE METODO
        medico.actualizarDatos(dtoActualizarMedico);
        auditoriaService.registrar("ACTUALIZAR", "MEDICO", medico.getId(), medico.getNombre());
        //PARA LA RESPUESTA DEL BODY VAN TODOS ESTOS DATOS
        return ResponseEntity.ok(new DTORespuestaMedico(medico.getId(), medico.getNombre(),medico.getEspecialidad().toString(),medico.getEmail(),medico.getTelefono(),medico.getDni(),
               new DTODireccion(medico.getDireccion().getCalle(),medico.getDireccion().getDistrito(),
                       medico.getDireccion().getCiudad(),medico.getDireccion().getNumero(),medico.getDireccion().getComplemento())));
    }

    //DELETE LOGICO
    @DeleteMapping("/{id}")
    @Transactional//IMPORTANTE PARA LA ACTUALIZACION/CAMBIO DE DATOS
    @PreAuthorize("hasRole('ADMIN')")
    //ESTE METODO ES DE TIPO ResponseEntity, ESTE METODO RETORNA UN TIPO DE RESPUESTA HTTP
    //EN ESTE METODO ESTAMOS RETORNANDO UN .noContent()(Codigo 204), QUE NO ENVIA NINGUN CONTENIDO EN LA RESPUESTA
    //NO HAY PROBLEMA SI NO SE LE ESPECIFICA EL TIPO QUE RETORNA ResponseEntity
    public ResponseEntity eliminarMedico(@PathVariable Long id){
        Medico medico=medicoRepository.getReferenceById(id);
        medico.desactivarMedico();
        auditoriaService.registrar("ELIMINAR", "MEDICO", id, medico.getNombre());
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}")
    //ESTE METODO ES DE TIPO ResponseEntity, ESTE METODO RETORNA UN TIPO DE RESPUESTA HTTP
    public ResponseEntity<DTORespuestaMedico> retornaDatosMedico(@PathVariable Long id){
        Medico medico=medicoRepository.getReferenceById(id);
        var datosMedico = new DTORespuestaMedico(medico.getId(), medico.getNombre(),medico.getEspecialidad().toString(),medico.getEmail(),medico.getTelefono(),medico.getDni(),
                new DTODireccion(medico.getDireccion().getCalle(),medico.getDireccion().getDistrito(),
                        medico.getDireccion().getCiudad(),medico.getDireccion().getNumero(),medico.getDireccion().getComplemento()));
        return ResponseEntity.ok(datosMedico);
    }
    //BORRAR DE LA BASE DE DATOS
    //    @DeleteMapping("/{id}")
    //    @Transactional//IMPORTANTE PARA LA ACTUALIZACION/CAMBIO DE DATOS
    //    public void eliminarMedico(@PathVariable Long id){
    //        Medico medico=medicoRepository.getReferenceById(id);
    //        medicoRepository.delete(medico);
    //    }
}
