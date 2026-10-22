package med.voll.api.medico;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import med.voll.api.Especialidad;
import med.voll.api.dto.DTODireccion;

public record DTORegistroMedico(
        //LAS ARROBAS (anotaciones) SON VALIDACIONES DE LA DEPENDENCIA Validation
        @NotBlank//VALIDA QUE NO LLEGUE EN BLANCO EL NOMBRE
        String nombre,
        @NotBlank//VALIDA QUE NO LLEGUE EN BLANCO EL NOMBRE
        @Email//VALIDA QUE EL EMAIL LLEGUE EN EL FORMATO DE UN EMAIL
        String email,
        @NotBlank
        String telefono,
        @NotBlank//VALIDA QUE NO LLEGUE EN BLANCO EL NOMBRE
        @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}")
        //VALIDA EL PATRON DEL DNI, EN ESTE CASO LO QUE ESTA EN COMILLAS DICE QUE EL DNI DEBE TENER 2 DIGITOS, SEGUIDO DE UN PUNTO, 3 DIGITOS, UN PUNTO Y OTROS 3 DIGITOS
        //POR EJEMPLO: 19.436.777
        String dni,
        @NotNull
        Especialidad especialidad,
        @NotNull//AQUI VA @NotNull PORQUE ES UN OBJETO DTODireccion
        @Valid//ESTO TAMBIEN ES PARA EL OBJETO
        DTODireccion direccion) {
}
