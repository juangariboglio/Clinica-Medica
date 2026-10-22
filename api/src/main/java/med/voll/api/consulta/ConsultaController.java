package med.voll.api.consulta;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import med.voll.api.infra.websocket.GestorWebSocket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/consultas")
@SecurityRequirement(name = "bearer-key")//ESTO SIRVE PARA QUE EN ESTA URL http://localhost:8080/swagger-ui/index.html ESTE EL TOKEN GUARDADO DEL LOGEO DEL USUARIO
public class ConsultaController {
    @Autowired
    private ReservaDeConsultas reservaDeConsultas;
    @Autowired
    private ConsultaRepository consultaRepository;
    //WEBSOCKET PARA AVISAR EN TIEMPO REAL A LOS FRONTENDS CONECTADOS (RF-7/RNF-3)
    @Autowired
    private GestorWebSocket gestorWebSocket;

    @PostMapping
    @Transactional
    public ResponseEntity reservar(@RequestBody @Valid DTOConsultaReserva datos){
        var detalleConsulta=reservaDeConsultas.reservar(datos);
        //SE DIFUNDE EL EVENTO PARA QUE LA AGENDA DE LOS OTROS USUARIOS SE REFRESQUE SIN RECARGAR
        gestorWebSocket.difundir("{\"tipo\":\"CONSULTA_CREADA\"}");
        return ResponseEntity.ok(detalleConsulta);
    }

    //DELETE CON BODY (SEGUN EL DISEÑO DEL CURSO) PARA CANCELAR UNA CONSULTA YA CREADA
    @DeleteMapping
    @Transactional
    public ResponseEntity cancelar(@RequestBody @Valid DTOCancelamientoConsulta datos) {
        reservaDeConsultas.cancelar(datos);
        gestorWebSocket.difundir("{\"tipo\":\"CONSULTA_CANCELADA\"}");
        return ResponseEntity.noContent().build();
    }

    //LISTADO DE CONSULTAS ACTIVAS PARA LA AGENDA DEL FRONTEND. LOS DOS FILTROS SON
    //OPCIONALES: SIN PARAMETROS DEVUELVE TODAS; CON FECHA, LAS DEL DIA; CON MEDICO Y
    //FECHA, LAS DEL MEDICO ESE DIA (RF-5: DISPONIBILIDAD; RF-6/RF-7: AGENDA EN TIEMPO REAL)
    @Operation(summary = "Lista las consultas activas, con filtros opcionales de medico y fecha")
    @GetMapping
    public ResponseEntity<List<DTOListadoConsulta>> listar(
            @RequestParam(required = false) Long medicoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        List<Consulta> consultas;
        if (medicoId != null && fecha != null) {
            consultas = consultaRepository.findActivasPorMedicoYDia(medicoId,
                    fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay());
        } else if (fecha != null) {
            consultas = consultaRepository.findActivasPorDia(
                    fecha.atStartOfDay(), fecha.plusDays(1).atStartOfDay());
        } else if (medicoId != null) {
            consultas = consultaRepository.findActivasPorMedico(medicoId);
        } else {
            consultas = consultaRepository.findAllActivas();
        }
        return ResponseEntity.ok(consultas.stream().map(DTOListadoConsulta::new).toList());
    }
}
