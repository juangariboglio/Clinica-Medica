package med.voll.api.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DTOAutenticacionUsuario(@NotBlank(message = "El usuario es obligatorio")
                                      @Size(max = 100, message = "El usuario no puede superar los 100 caracteres")
                                      String login,
                                      @NotBlank(message = "La clave es obligatoria")
                                      @Size(max = 200, message = "La clave no puede superar los 200 caracteres")
                                      String clave) {
}
