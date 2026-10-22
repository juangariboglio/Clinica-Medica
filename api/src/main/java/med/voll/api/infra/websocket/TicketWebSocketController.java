package med.voll.api.infra.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

//ENTREGA UN TICKET DE CORTA DURACION PARA EL HANDSHAKE DEL WEBSOCKET.
//LA RUTA EXIGE JWT PORQUE /ws SOLO ESTA LIBERADO PARA EL UPGRADE DEL WEBSOCKET.
@RestController
@RequestMapping("/ws")
public class TicketWebSocketController {
    @Autowired
    private ServicioTicketWebSocket servicioTicketWebSocket;

    @GetMapping("/ticket")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DTOTicketWebSocket> obtenerTicket(Authentication autenticacion) {
        if (autenticacion == null || !autenticacion.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new DTOTicketWebSocket(servicioTicketWebSocket.generar(autenticacion.getName())));
    }

    public record DTOTicketWebSocket(String ticket) {
    }
}
