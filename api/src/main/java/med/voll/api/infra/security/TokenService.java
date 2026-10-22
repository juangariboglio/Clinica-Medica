package med.voll.api.infra.security;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTCreationException;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import med.voll.api.usuario.Usuarios;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service//ANOTACION IMPORTANTE
public class TokenService {
    //LOGGER PARA NO USAR System.out, ADEMAS NO DEBE VOLTEAR EL TOKEN NI EL SECRETO
    private static final Logger logger = LoggerFactory.getLogger(TokenService.class);

    @Value("${api.security.secret}")
    private String apiSecret;
    //CREACION DEL TOKEN
    public String generarToken(Usuarios usuarios){
        //EL CODIGO DE ABAJO SE COPIA Y PEGA
        //IMPORTAR SUS CLASES
        try {
            Algorithm algorithm = Algorithm.HMAC256(apiSecret);
            //EN EL JWT.create() SE COLOCAN LOS PARAMETROS CON LOS QUE QUEREMOS QUE SE CREE EL TOKEN
            //EN ESTE CASO ES USERNAME(usuarios.getLogin()), EL ID(usuarios.getId())
            return JWT.create()
                    .withIssuer("voll med")//NOMBRE DE LA APLICACION O EMPRESA
                    .withSubject(usuarios.getLogin())//USERNAME
                    .withClaim("id",usuarios.getId())//ID
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
    //EN .plusHours(2) ESTAMOS INDICANDO QUE EXPIRA EN DOS HORAS
    //(ZoneOffset.of("-05:00") ES ZONA HORARIA DE SUDAMERICA
    private Instant generarFechaExpiracion(){
        return LocalDateTime.now().plusHours(2).toInstant(ZoneOffset.of("-05:00"));
    }
}
