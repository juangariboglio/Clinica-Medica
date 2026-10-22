package med.voll.api.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.annotation.PostConstruct;
import med.voll.api.usuario.Usuarios;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service//ANOTACION IMPORTANTE
public class TokenService {
    //LOGGER PARA NO USAR System.out, ADEMAS NO DEBE VOLTEAR EL TOKEN NI EL SECRETO
    private static final Logger logger = LoggerFactory.getLogger(TokenService.class);

    private static final String SECRETO_DESARROLLO = "dev-secret-local-vollmed-3cambiar-en-produccion-9f4a";
    private static final int LONGITUD_MINIMA_SECRETO = 32;

    @Value("${api.security.secret}")
    private String apiSecret;

    @Autowired
    private Environment environment;

    //FALLA AL ARRANCAR SI EL SECRETO ES DEBIL O SI PRODUCCION USA EL VALOR DE DESARROLLO.
    //ESTO EVITA QUE UN DESPLIEGUE MAL CONFIGURADO ACEPTE TOKENS FIRMADOS CON UN SECRETO PUBLICO.
    @PostConstruct
    void validarSecreto() {
        if (apiSecret == null || apiSecret.isBlank()
                || apiSecret.getBytes(StandardCharsets.UTF_8).length < LONGITUD_MINIMA_SECRETO) {
            throw new IllegalStateException(
                    "api.security.secret debe tener al menos " + LONGITUD_MINIMA_SECRETO
                            + " bytes; defina VOLLMED_JWT_SECRET con un valor seguro");
        }
        if (environment.matchesProfiles("production") && SECRETO_DESARROLLO.equals(apiSecret)) {
            throw new IllegalStateException(
                    "No se puede usar el secreto JWT de desarrollo en production; defina VOLLMED_JWT_SECRET");
        }
    }
    //CREACION DEL TOKEN
    public String generarToken(Usuarios usuarios){
        //EL CODIGO DE ABAJO SE COPIA Y PEGA
        //IMPORTAR SUS CLASES
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);
            //EN EL JWT.create() SE COLOCAN LOS PARAMETROS CON LOS QUE QUEREMOS QUE SE CREE EL TOKEN
            //EN ESTE CASO ES USERNAME(usuarios.getLogin()), EL ID(usuarios.getId())
            var rol = usuarios.getRol() == null || usuarios.getRol().isBlank()
                    ? "ROLE_RECEPCION"
                    : usuarios.getRol();
            return JWT.create()
                    .withIssuer("voll med")//NOMBRE DE LA APLICACION O EMPRESA
                    .withSubject(usuarios.getLogin())//USERNAME
                    .withClaim("id",usuarios.getId())//ID
                    .withClaim("rol",rol)//SOLO PARA QUE LA UI OCULTE ACCIONES NO PERMITIDAS
                    .withExpiresAt(generarFechaExpiracion())
                    .sign(algorithm);
        } catch (JWTCreationException exception){
            // Invalid Signing configuration / Couldn't convert Claims.
            throw new RuntimeException();
        }
    }
    //VERIFICACION DEL TOKEN
    //DEVUELVE EL SUBJECT(username) O null SI EL TOKEN ES INVALIDO (FIRMA, EXPIRACION O EMISSOR)
    //DEVOLVER null PERMITE QUE SecurityFilter RESPONDA 401 EN VEZ DE LANZAR UNA EXCEPCION QUE TERMINA EN 500
    public String getSubject(String token) {
        if (token==null){
            return null;
        }
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);//VALIDANDO FIRMA DEL TOKEN
            DecodedJWT verifier = JWT.require(algorithm)
                    .withIssuer("voll med")
                    .build()
                    .verify(token);
            return verifier.getSubject();
        } catch (JWTVerificationException exception) {
            // Firma invalida, token expirado o issuer distinto
            logger.warn("Token JWT invalido: {}", exception.getMessage());
            return null;
        }
    }
    //ESTE METODO GENERA LA FECHA DE EXPIRACION DEL TOKEN
    //SE USA Instant PARA QUE LA DURACION NO DEPENDA DE LA ZONA HORARIA DEL SERVIDOR
    private Instant generarFechaExpiracion(){
        return Instant.now().plus(2, ChronoUnit.HOURS);
    }
}
