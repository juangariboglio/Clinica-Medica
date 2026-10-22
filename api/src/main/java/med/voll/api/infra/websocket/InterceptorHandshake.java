package med.voll.api.infra.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

//VALIDA UN TICKET EFIMERO DURANTE EL HANDSHAKE DEL WEBSOCKET. EL JWT NUNCA VIAJA
//EN LA URL: EL FRONTEND LO CAMBIA POR UN TICKET DE UN SOLO USO EN /ws/ticket.
@Component
public class InterceptorHandshake implements HandshakeInterceptor {
    @Autowired
    private ServicioTicketWebSocket servicioTicketWebSocket;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
        var ticket = obtenerParametroDelQuery(request.getURI().getRawQuery(), "ticket");
        var nombreDeUsuario = servicioTicketWebSocket.consumir(ticket);
        if (nombreDeUsuario == null) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
        attributes.put("usuario", nombreDeUsuario);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // Nada que hacer despues del handshake
    }

    //EXTRAE EL VALOR DE UN PARAMETRO DE LA CADENA DE QUERY (SIN DEPENDENCIAS EXTERNAS)
    private String obtenerParametroDelQuery(String query, String nombre) {
        if (query == null) {
            return null;
        }
        var prefijo = nombre + "=";
        for (String parametro : query.split("&")) {
            if (parametro.startsWith(prefijo)) {
                return URLDecoder.decode(parametro.substring(prefijo.length()), StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
