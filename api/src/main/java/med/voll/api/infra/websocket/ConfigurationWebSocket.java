package med.voll.api.infra.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import java.util.Arrays;

//REGISTRA EL ENDPOINT /ws (WEBSOCKET CRUDO, SIN STOMP NI SOCKJS). EL HANDSHAKE SE
//VALIDA CON UN TICKET EFIMERO Y LA RUTA SE LIBERA EN ConfigurationSecurity.
@Configuration
@EnableWebSocket
public class ConfigurationWebSocket implements WebSocketConfigurer {
    @Autowired
    private GestorWebSocket gestorWebSocket;
    @Autowired
    private InterceptorHandshake interceptorHandshake;

    //EN PRODUCCION SE DEBE SOBRESCRIBIR CON EL DOMINIO REAL DEL FRONTEND
    @Value("${app.websocket.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String origenesPermitidos;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gestorWebSocket, "/ws")
                .addInterceptors(interceptorHandshake)
                .setAllowedOrigins(Arrays.stream(origenesPermitidos.split(","))
                        .map(String::trim)
                        .filter(origen -> !origen.isBlank())
                        .toArray(String[]::new));
    }
}
