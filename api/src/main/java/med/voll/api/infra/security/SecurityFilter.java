package med.voll.api.infra.security;

import  jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import med.voll.api.usuario.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component//ANOTACION IMPORTANTE
public class SecurityFilter extends OncePerRequestFilter {//CUANDO IMPLEMENTAMOS ESTA INTERFAZ DE SPRING, IMPLEMENTAR SUS METODOS
    @Autowired
    private TokenService tokenService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    //REPOSITORIO QUE USA SecurityContextHolderFilter POR DEFECTO EN MODO STATELESS:
    //AL GUARDAR EL CONTEXTO AQUI, EL CONTEXTO DIFERIDO (LAZY) QUE LEE AuthorizationFilter
    //ENCUENTRA LA AUTENTICACION. SIN ESTO, SPRING SECURITY 7 RECHAZA CON 401 AUN CON
    //EL CONTEXTO PUESTO EN EL ThreadLocal (PATRON DE LAS DOCS: Servlet Authentication Architecture).
    private final SecurityContextRepository securityContextRepository = new RequestAttributeSecurityContextRepository();
    @Override
    //FILTER CHAIN (o cadenas de filtros) ES EL ENCARGADO DE INTERCEPTAR LAS SOLICITUDES
    //UNO DE LOS OBJETIVOS ES BLOQUEAR UNA SOLICITUD
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        //CON ESTA LINEA DE ABAJO OBTENEMOS EL TOKEN DE Auth DE Insomnia CADA VEZ QUE LANZAMOS EL REQUEST DE Logeo de usuarios
        //EN Auth COLOCAR Auth DE TIPO Bearer token
        var authHeader=request.getHeader("Authorization");
        if(authHeader!=null){
            var token=authHeader.replace("Bearer ","");
            //getSubject DEVUELVE null SI EL TOKEN ES INVALIDO(EXPIRADO/FIRMA MALA), EN ESE CASO NO SE AUTENTICA
            var nombreDeUsuario=tokenService.getSubject(token);
            if (nombreDeUsuario!=null) {
                //SE BUSCA EL USUARIO POR EL SUBJECT(username)
                var usuario=usuarioRepository.findByLogin(nombreDeUsuario);
                //GUARD: SI EL USUARIO YA NO EXISTE EN LA BD, NO SE AUTENTICA (PARA EVITAR NPE -> 500)
                if (usuario!=null) {
                    //TOKEN VALIDO
                    var authentication= new UsernamePasswordAuthenticationToken(usuario,null,
                            usuario.getAuthorities());//FORZAMOS UN INICIO DE SESION
                    //PATRON OFICIAL DE SPRING SECURITY 7 (docs: Servlet Authentication Architecture):
                    //SE CREA UN CONTEXTO NUEVO Y SE REEMPLAZA EL DEL HOLDER. MUTAR getContext()
                    //DIRECTAMENTE NO SE PROPAGA AL RESTO DE LA CADENA CON EL CONTEXTO DIFERIDO
                    //QUE GESTIONA SecurityContextHolderFilter, Y TODA RUTA PROTEGIDA DABA 401.
                    var contexto = SecurityContextHolder.createEmptyContext();
                    contexto.setAuthentication(authentication);
                    SecurityContextHolder.setContext(contexto);
                    //ADEMAS SE PERSISTE EN EL REPOSITORIO DEL REQUEST: ES EL QUE LEE EL
                    //CONTEXTO DIFERIDO (LAZY) QUE GESTIONA SecurityContextHolderFilter, ASI
                    //QUE SIN ESTE saveContext EL AuthorizationFilter NO VE LA AUTENTICACION.
                    securityContextRepository.saveContext(contexto, request, response);
                }
            }
       }
        filterChain.doFilter(request,response);
    }
}
