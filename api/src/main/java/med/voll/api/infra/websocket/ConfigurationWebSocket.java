package med.voll.api.infra.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

//REGISTRA EL ENDPOINT /ws (WEBSOCKET CRUDO, SIN STOMP NI SOCKJS). EL HANDSHAKE SE
//VALIDA CON EL INTERCEPTOR DE TOKEN Y LA RUTA SE LIBERA EN ConfigurationSecurity.
@Configuration
@EnableWebSocket
public class ConfigurationWebSocket implements WebSocketConfigurer {
    @Autowired
    private GestorWebSocket gestorWebSocket;
    @Autowired
    private InterceptorHandshake interceptorHandshake;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gestorWebSocket, "/ws")
                .addInterceptors(interceptorHandshake)
                //ORIGEN DEL FRONTEND EN DESARROLLO (VITE EN 5173); EN PRODUCCION SE AJUSTA AL DOMINIO REAL
                .setAllowedOrigins("http://localhost:5173", "http://127.0.0.1:5173");
    }
}
