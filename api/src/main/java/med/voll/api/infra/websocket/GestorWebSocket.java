package med.voll.api.infra.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

//GESTOR DE LAS CONEXIONES WEBSOCKET ABIERTAS. MANTIENE EL REGISTRO DE SESIONES Y
//PERMITE DIFUNDIR MENSAJES A TODOS LOS CLIENTES CONECTADOS (RF-7/RNF-3 DEL FRONTEND:
//LA AGENDA SE ACTUALIZA EN TIEMPO REAL, CON LATENCIA MENOR A 2 SEGUNDOS).
@Component
public class GestorWebSocket extends TextWebSocketHandler {
    private static final Logger logger = LoggerFactory.getLogger(GestorWebSocket.class);

    //CopyOnWriteArraySet PORQUE LAS SESIONES SE AGREGAN Y QUITAN DESDE VARIOS HILOS
    private final Set<WebSocketSession> sesiones = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        logger.info("Conexion WebSocket establecida por el usuario {}", session.getAttributes().get("usuario"));
        sesiones.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        logger.info("Conexion WebSocket cerrada: {}", status);
        sesiones.remove(session);
    }

    //ENVIA UN MENSAJE JSON A TODOS LOS CLIENTES CONECTADOS; LOS FALLOS DE UNA SESION
    //NO DEBEN CORTAR LA DIFUSION A LAS DEMAS
    public void difundir(String mensaje) {
        for (WebSocketSession sesion : sesiones) {
            if (sesion != null && sesion.isOpen()) {
                try {
                    synchronized (sesion) {
                        sesion.sendMessage(new TextMessage(mensaje));
                    }
                } catch (IOException e) {
                    logger.warn("No se pudo difundir el mensaje por WebSocket: {}", e.getMessage());
                }
            }
        }
    }
}
