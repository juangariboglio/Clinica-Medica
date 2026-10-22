package med.voll.api.paciente;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import med.voll.api.infra.auditoria.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pacientes")
@SecurityRequirement(name = "bearer-key")//ESTO SIRVE PARA QUE EN ESTA URL http://localhost:8080/swagger-ui/index.html ESTE EL TOKEN GUARDADO DEL LOGEO DEL USUARIO
@PreAuthorize("hasAnyRole('ADMIN','RECEPCION')")
public class PacienteController {

    @Autowired
    private PacienteRepository repository;
    @Autowired
    private AuditoriaService auditoriaService;

    @PostMapping
    @Transactional
    public void registrar(@RequestBody @Valid DTORegistroPaciente datos) {
        var paciente = repository.save(new Paciente(datos));
        auditoriaService.registrar("CREAR", "PACIENTE", paciente.getId(), paciente.getNombre());
    }

    @GetMapping
    public Page<DTOListadoPaciente> listar(@PageableDefault(size = 10, sort = {"nombre"}) Pageable paginacion) {
        return repository.findAllByActivoTrue(paginacion).map(DTOListadoPaciente::new);
    }

    @PutMapping
    @Transactional
    public void actualizar(@RequestBody @Valid DTOActualizarPaciente datos) {
        var paciente = repository.getReferenceById(datos.id());
        paciente.actualizarInformaciones(datos);
        auditoriaService.registrar("ACTUALIZAR", "PACIENTE", paciente.getId(), paciente.getNombre());
    }

    //DETALLE COMPLETO DE UN PACIENTE PARA EL MODO EDICION DEL FORMULARIO DEL FRONTEND
    //(DTOListadoPaciente NO TRAE TELEFONO NI DIRECCION) Y PARA VERIFICAR SU EXISTENCIA (RF-16)
    @GetMapping("/{id}")
    public ResponseEntity<DTODetallePaciente> detalle(@PathVariable Long id) {
        var paciente = repository.getReferenceById(id);
        return ResponseEntity.ok(new DTODetallePaciente(paciente));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminar(@PathVariable Long id) {
        var paciente = repository.getReferenceById(id);
        paciente.eliminar();
        auditoriaService.registrar("ELIMINAR", "PACIENTE", id, paciente.getNombre());
    }
}
