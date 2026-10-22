package med.voll.api.infra.security;

import med.voll.api.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service//IMPORTANTE ANOTACION
//IMPLEMENTAR UserDetailsService, CUANDO LA LINEA DE ABAJO ESTE EN ROJO, IMPLEMENTAR LOS METODOS (Implement methods)
//E IMPLEMENTARA EL METODO UserDetails loadUserByUsername
public class AutenticacionService implements UserDetailsService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    //LIMITE DE INTENTOS FALLIDOS DE LOGIN POR IP. EL CONTADOR ES EN MEMORIA:
    //SI SE DESPLIEGAN VARIAS INSTANCIAS, CONVIENE UN ALMACEN COMPARTIDO (REDIS).
    @Value("${seguridad.login.max-intentos:10}")
    private int maxIntentosFallidos;
    @Value("${seguridad.login.minutos-ventana:15}")
    private long minutosVentana;
    @Value("${seguridad.login.minutos-bloqueo:15}")
    private long minutosBloqueo;

    private final Map<String, RegistroIntentos> registros = new ConcurrentHashMap<>();

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        //COLOCAR EN EL RETURN usuarioRepository.findByUserName(username)
        //CUANDO ESTE EN ROJO findByUserName, CREAMOS EL METODO
        return usuarioRepository.findByLogin(username);
    }

    public boolean estaBloqueado(String ip) {
        var registro = registros.get(ip);
        if (registro == null) {
            return false;
        }
        synchronized (registro) {
            var ahora = Instant.now();
            if (registro.bloqueadoHasta != null) {
                if (ahora.isBefore(registro.bloqueadoHasta)) {
                    return true;
                }
                registros.remove(ip, registro);
                return false;
            }
            if (registro.primerIntento == null
                    || Duration.between(registro.primerIntento, ahora).compareTo(ventana()) >= 0) {
                registros.remove(ip, registro);
            }
            return false;
        }
    }

    public void registrarIntentoFallido(String ip) {
        limpiarRegistrosVencidos();
        var registro = registros.computeIfAbsent(ip, clave -> new RegistroIntentos());
        synchronized (registro) {
            var ahora = Instant.now();
            if (registro.primerIntento == null
                    || Duration.between(registro.primerIntento, ahora).compareTo(ventana()) >= 0) {
                registro.primerIntento = ahora;
                registro.cantidad = 0;
            }
            registro.cantidad++;
            if (registro.cantidad >= maxIntentosFallidos) {
                registro.bloqueadoHasta = ahora.plus(Duration.ofMinutes(minutosBloqueo));
            }
        }
    }

    public void registrarInicioSesionExitoso(String ip) {
        registros.remove(ip);
    }

    public long segundosDeBloqueo() {
        return Duration.ofMinutes(minutosBloqueo).toSeconds();
    }

    private Duration ventana() {
        return Duration.ofMinutes(minutosVentana);
    }

    //EVITA QUE EL MAPA CREZCA SIN LIMITE CON IPs QUE SOLO FALLAN UNA VEZ.
    private void limpiarRegistrosVencidos() {
        if (registros.size() < 1000) {
            return;
        }
        var ahora = Instant.now();
        registros.entrySet().removeIf(entrada -> {
            var registro = entrada.getValue();
            synchronized (registro) {
                if (registro.bloqueadoHasta != null) {
                    return registro.bloqueadoHasta.isBefore(ahora);
                }
                return registro.primerIntento == null
                        || Duration.between(registro.primerIntento, ahora).compareTo(ventana()) >= 0;
            }
        });
    }

    private static final class RegistroIntentos {
        private Instant primerIntento;
        private int cantidad;
        private Instant bloqueadoHasta;
    }
}
