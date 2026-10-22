package med.voll.api.paciente;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import med.voll.api.dto.DTODireccion;

public record DTORegistroPaciente(@NotBlank
                                  String nombre,
                                  @NotBlank
                                  @Email
                                  String email,
                                  @NotBlank
                                  String telefono,
                                  @NotBlank
                                  @Pattern(regexp = "\\d{2}\\.\\d{3}\\.\\d{3}")
                                  //VALIDA EL PATRON DEL DNI, EN ESTE CASO LO QUE ESTA EN COMILLAS DICE QUE EL DNI DEBE TENER 2 DIGITOS, SEGUIDO DE UN PUNTO, 3 DIGITOS, UN PUNTO Y OTROS 3 DIGITOS
                                  //POR EJEMPLO: 19.436.777
                                  String dni,
                                  @NotNull @Valid DTODireccion direccion) {
}
