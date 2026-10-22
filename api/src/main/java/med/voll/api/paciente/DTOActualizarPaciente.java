package med.voll.api.paciente;

import jakarta.validation.constraints.NotNull;
import med.voll.api.dto.DTODireccion;

public record DTOActualizarPaciente(
        @NotNull
        Long id,
        String nombre,
        // EL EMAIL SE PUEDE CAMBIAR; EL DNI NO FORMA PARTE DEL DTO (NO ES EDITABLE)
        String email,
        String telefono,
        DTODireccion direccion) {
}
