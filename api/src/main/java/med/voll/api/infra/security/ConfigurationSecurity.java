package med.voll.api.infra.security;

import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

@Configuration//IMPORTANTE ANOTACION
@EnableWebSecurity//IMPORTANTE ANOTACION
@EnableMethodSecurity(securedEnabled = true)//ANOTACION IMPORTANTE PARA DECIDIR QUE ROLES TIENEN ACCESO
public class ConfigurationSecurity {
    @Autowired
    private SecurityFilter securityFilter;
    //IMPORTANTE
    //TODO LO DE ABAJO SE COPIA Y PEGA Y SE IMPORTAN SUS CLASES
    //IMPORTANTE
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
         http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth->auth
                        .requestMatchers(HttpMethod.POST, "/login").permitAll()
                        //LA LINEA DE ARRIBA INDICA QUE LOS METODOS POST Y QUE TENGA /LOGIN EN LA URL PUEDA ENTRAR CUALQUIERA
                        .requestMatchers("/v3/api-docs/**","/swagger-ui.html","/swagger-ui/**").permitAll()
                        //LA LINEA DE ARRIBA ES PARA LIBERAR LAS URLS QUE SE GENERAN DE SpringDoc (ver .txt sobre la dependencia)
                        //HANDSHAKE DEL WEBSOCKET: LOS NAVEGADORES NO ENVIAN EL ENCABEZADO Authorization EN EL
                        //HANDSHAKE, ASI QUE /ws SE LIBERA Y VALIDA UN TICKET EFIMERO DE UN SOLO USO.
                        //EL ENDPOINT /ws/ticket SI EXIGE JWT (anyRequest().authenticated()).
                        .requestMatchers("/ws").permitAll()
                        .anyRequest().authenticated()
                ).addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)//ESTO INDICA QUE PARA CADA OTRO REQUEST NECESITA ESTAR AUTENTICADO
                //SIN ESTO, SPRING SECURITY 7 DEVUELVE 403 POR DEFECTO; CON EL ENTRY POINT DEVUELVE 401 (NO AUTENTICADO)
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"mensaje\":\"No autenticado: token ausente o inválido\"}");
                }));
        return http.build();

    }
    //SINO CREAMOS ESTE METODO NOS DARA UN ERROR LA APLICACION DEL AutenticacionController
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    //METODO PARA LA ENCRIPTACION DE LA CLAVE (HASH DE PASSWORD SE LO DENOMINA)
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    //EL SecurityFilter ES @Component Y SPRING BOOT LO REGISTRA ADEMAS COMO FILTRO GLOBAL
    //DEL CONTENEDOR DE SERVLETS: CORRERIA EN TODA PETICION FUERA DE LA SECURITY CHAIN Y
    //SecurityContextHolderFilter PISARIA SU AUTENTICACION AL CARGAR EL CONTEXTO DEL
    //REPOSITORIO (EFECTO: 401 EN TODA RUTA PROTEGIDA AUN CON TOKEN VALIDO). ESTE BEAN
    //DESHABILITA ESE REGISTRO: EL FILTRO SOLO VIVE DENTRO DE LA CADENA (addFilterBefore).
    @Bean
    public FilterRegistrationBean<SecurityFilter> desactivarRegistroGlobalDelFiltro(SecurityFilter filtro) {
        FilterRegistrationBean<SecurityFilter> registro = new FilterRegistrationBean<>(filtro);
        registro.setEnabled(false);
        return registro;
    }
}
