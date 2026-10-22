package med.voll.api.consulta;

import med.voll.api.Especialidad;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.AutoConfigureJsonTesters;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest//ANOTACION IMPORTANTE
@AutoConfigureMockMvc//ANOTACION IMPORTANTE
@AutoConfigureJsonTesters//ANOTACION IMPORTANTE PARA EL TESTEO CON JSON
class ConsultaControllerTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JacksonTester<DTOConsultaReserva> DTOReservaJson;
    @Autowired
    private JacksonTester<DTODetalleConsulta> DTODetalleJson;
    @MockitoBean
    private ReservaDeConsultas reservaDeConsultas;
    @Test
    @DisplayName("Deberia devolver metodo http 400 cuando la request no tenga datos")
    @WithMockUser(roles = "RECEPCION")//CON ESTA ANOTACION HACEMOS QUE NO NECESITEMOS ESTAR LOGEADOS (NECESITAR EL TOKEN) PARA TESTEAR LAS REQUEST IMPORTANTE AGREGAR DEPENDENCIA DE Spring Security Test
    //throws Exception SE GENERA CUANDO .perform ESTA EN ROJO ASI IMPLEMENTAMOS LA EXCEPCION
    void reservarEscenario1() throws Exception {
        //USAMOS post() YA QUE EL METODO reservar DEL CONTROLLER ConsultaController ES UN METODO HTTP DEL TIPO POST
        var response=mockMvc.perform(post("/consultas")//CUANDO CREAMOS EL post() IMPLEMENTAR: import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
                .with(user("testuser").roles("RECEPCION"))//EN Boot4/Security7 @WithMockUser no se aplica a la request; .with(user()) SI inyecta la autenticacion
                ).andReturn().getResponse();
        assertThat(response.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());//CON ESTA LINEA OBTENEMOS EL VALOR DEL BAD REQUEST QUE EN ESTE CASO SERIA CODIGO 400
        //IMPORTAR ESTO PARA LA LINEA DE ARRIBA: import static org.assertj.core.api.Assertions.assertThat;
    }
    @Test
    @DisplayName("Deberia devolver metodo http 400 cuando la request no tenga datos")
    @WithMockUser(roles = "RECEPCION")//CON ESTA ANOTACION HACEMOS QUE NO NECESITEMOS ESTAR LOGEADOS (NECESITAR EL TOKEN) PARA TESTEAR LAS REQUEST IMPORTANTE AGREGAR DEPENDENCIA DE Spring Security Test
        //throws Exception SE GENERA CUANDO .perform ESTA EN ROJO ASI IMPLEMENTAMOS LA EXCEPCION
    void reservarEscenario2() throws Exception {
        var fecha=LocalDateTime.now().plusHours(1);
        var especialidad=Especialidad.CARDIOLOGIA;
        var datosDetalle=new DTODetalleConsulta(null,2L,5L,fecha);
        when(reservaDeConsultas.reservar(any())).thenReturn(datosDetalle);
        //USAMOS post() YA QUE EL METODO reservar DEL CONTROLLER ConsultaController ES UN METODO HTTP DEL TIPO POST
        var response=mockMvc.perform(post("/consultas")//CUANDO CREAMOS EL post() IMPLEMENTAR: import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
                        .with(user("testuser").roles("RECEPCION"))//EN Boot4/Security7 @WithMockUser no se aplica a la request; .with(user()) SI inyecta la autenticacion
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DTOReservaJson.write(
                                new DTOConsultaReserva(2L, 5L,fecha,especialidad)
                        ).getJson()))
                .andReturn().getResponse();
        var jsonEsperado=DTODetalleJson.write(datosDetalle).getJson();
        assertThat(response.getStatus()).isEqualTo(HttpStatus.OK.value());//CON ESTA LINEA OBTENEMOS EL VALOR DEL OK QUE EN ESTE CASO SERIA CODIGO 200
        //IMPORTAR ESTO PARA LA LINEA DE ARRIBA: import static org.assertj.core.api.Assertions.assertThat;
        assertThat(response.getContentAsString()).isEqualTo(jsonEsperado);
    }
}
