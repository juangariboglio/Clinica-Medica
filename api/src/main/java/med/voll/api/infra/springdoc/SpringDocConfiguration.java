package med.voll.api.infra.springdoc;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

//TODA ESTA CLASE SE COPIA Y PEGA, VER EN LA PAGINA DE SpringDoc Y BUSCAR bearer CON CTRL+F
@Configuration//ANOTACION IMPORTANTE
public class SpringDocConfiguration {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .components(new Components()
                        .addSecuritySchemes("bearer-key",
                                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                //Esta configuración se utiliza para enriquecer la documentación Swagger/OpenAPI generada para la API.
                // Es útil para que los usuarios de la API comprendan su propósito, cómo contactarse y las reglas de uso.
                //CON .info PODEMOS COLOCAR ESTE TIPO DE INFORMACION PARA LA DOCUMENTACION GENERADA EN LA URL http://localhost:8080/swagger-ui/index.html
                .info(new Info()
                        .title("Voll.med API")
                        .description("API Rest de la aplicación Voll.med, que contiene las funcionalidades CRUD de médicos y de pacientes, además de reserva y cancelamiento de consultas")
                        .contact(new Contact()
                                .name("Equipo Backend")
                                .email("backend@voll.med"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://voll.med/api/licencia")));
    }
}
