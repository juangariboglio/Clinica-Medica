package med.voll.api.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import med.voll.api.usuario.DTOAutenticacionUsuario;
import med.voll.api.dto.DTOJWTtoken;
import med.voll.api.infra.security.AutenticacionService;
import med.voll.api.infra.security.TokenService;
import med.voll.api.usuario.Usuarios;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login")
//TODA ESTA CLASE ES PARA EL LOGIN DE USUARIOS
//AQUI NO VA @SecurityRequirement(name = "bearer-key") PORQUE EL LOGEO SI NECESITA AUTORIZACION PARA TODOS
public class AutenticacionController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private AutenticacionService autenticacionService;

    @PostMapping
    public ResponseEntity<?> autenticarUsuario(@RequestBody @Valid DTOAutenticacionUsuario dtoAutenticacionUsuario,
                                               HttpServletRequest request) {
        //EL LIMITE ES POR IP; DETRAS DE UN PROXY HAY QUE CONFIGURAR LAS CABECERAS
        //FORWARDED PARA QUE getRemoteAddr() REFLEJE AL CLIENTE REAL.
        var ip = request.getRemoteAddr();
        if (autenticacionService.estaBloqueado(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(autenticacionService.segundosDeBloqueo()))
                    .body(new DTOErrorAutenticacion("Demasiados intentos fallidos. Intente de nuevo más tarde."));
        }

        //CON LA LINEA DE ABAJO SE GENERA EL TOKEN, SE VE QUE LOS PARAMETROS NECESARIOS SON
        //login() Y clave()
        Authentication authToken=new UsernamePasswordAuthenticationToken(dtoAutenticacionUsuario.login(),dtoAutenticacionUsuario.clave());
        try {
            var usuarioAutenticado=authenticationManager.authenticate(authToken);
            autenticacionService.registrarInicioSesionExitoso(ip);
            //TENER EN CUENTA LA CLASE CREADA TokenService
            //EN generarToken() SE NECESITA COMO PARAMETRO LO QUE ESTA EN LA LINEA DE ABAJO
            var jwtToken=tokenService.generarToken((Usuarios) usuarioAutenticado.getPrincipal());
            return ResponseEntity.ok(new DTOJWTtoken(jwtToken));
        } catch (AuthenticationException e) {
            autenticacionService.registrarIntentoFallido(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new DTOErrorAutenticacion("Usuario o contraseña incorrectos"));
        }
    }

    private record DTOErrorAutenticacion(String mensaje) {
    }
}
