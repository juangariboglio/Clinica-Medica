package med.voll.api.dto;

import jakarta.validation.constraints.NotBlank;

public record DTODireccion(
        //LAS ARROBAS (anotaciones) SON VALIDACIONES DE LA DEPENDENCIA Validation.
        //DISTRITO Y COMPLEMENTO SON OPCIONALES (SE PUEDEN DEJAR EN BLANCO).
        @NotBlank
        String calle,
        String distrito,
        @NotBlank
        String ciudad,
        @NotBlank
        String numero,
        String complemento) {
}
