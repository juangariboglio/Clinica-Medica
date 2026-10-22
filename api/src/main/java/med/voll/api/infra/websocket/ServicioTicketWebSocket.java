package med.voll.api.infra.websocket;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

//EL JWT NO DEBE VIAJAR EN LA URL DEL WEBSOCKET (QUEDA EN LOGS E HISTORIAL).
//ESTE SERVICIO EMITE UN TICKET EFIMERO, DE UN SOLO USO, PARA EL HANDSHAKE.
@Service
public class ServicioTicketWebSocket {
    private static final Duration VALIDEZ = Duration.ofSeconds(60);
    private static final int LIMITE_LIMPIEZA = 1000;

    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();

    public String generar(String usuario) {
        limpiarVencidos();
        var ticket = UUID.randomUUID().toString();
        tickets.put(ticket, new Ticket(usuario, Instant.now().plus(VALIDEZ)));
        return ticket;
    }

    //CONSUMIR ELIMINA EL TICKET: NO SE PUEDE REUTILIZAR AUNQUE NO HAYA EXPIRADO.
    public String consumir(String ticket) {
        if (ticket == null || ticket.isBlank()) {
            return null;
        }
        var registro = tickets.remove(ticket);
        if (registro == null || Instant.now().isAfter(registro.expira())) {
            return null;
        }
        return registro.usuario();
    }

    private void limpiarVencidos() {
        if (tickets.size() < LIMITE_LIMPIEZA) {
            return;
        }
        var ahora = Instant.now();
        tickets.entrySet().removeIf(entrada -> ahora.isAfter(entrada.getValue().expira()));
    }

    private record Ticket(String usuario, Instant expira) {
    }
}
