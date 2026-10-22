package med.voll.api.infra.websocket;

import med.voll.api.infra.security.TokenService;
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

//VALIDA EL TOKEN JWT DURANTE EL HANDSHAKE DEL WEBSOCKET. LOS NAVEGADORES NO PUEDEN
//ENVIAR EL ENCABEZADO Authorization EN UNA CONEXION WEBSOCKET, POR ESO EL TOKEN VIAJA
//EN EL QUERY PARAM ?token=... Y SE VALIDA AQUI CON EL MISMO TokenService DEL REST.
@Component
public class InterceptorHandshake implements HandshakeInterceptor {
    @Autowired
    private TokenService tokenService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
        var token = obtenerTokenDelQuery(request.getURI().getRawQuery());
        var nombreDeUsuario = token != null ? tokenService.getSubject(token) : null;
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

    //EXTRAE EL VALOR DEL PARAMETRO token DE LA CADENA DE QUERY (SIN DEPENDENCIAS EXTERNAS)
    private String obtenerTokenDelQuery(String query) {
        if (query == null) {
            return null;
        }
        for (String parametro : query.split("&")) {
            if (parametro.startsWith("token=")) {
                return URLDecoder.decode(parametro.substring("token=".length()), StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
