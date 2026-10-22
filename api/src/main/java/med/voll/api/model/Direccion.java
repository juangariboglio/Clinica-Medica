package med.voll.api.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import med.voll.api.dto.DTODireccion;

//TENER EN CUENTA @Embedded EN LA CLASE Medico PARA USAR ESTE ARROBA DE ABAJO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Direccion {
    private String calle;
    private String numero;
    private String complemento;
    private String ciudad;
    private String distrito;

    public Direccion(DTODireccion direccion) {
        this.calle=direccion.calle();
        this.numero=direccion.numero();
        this.distrito= direccion.distrito();
        this.complemento=direccion.complemento();
        this.ciudad=direccion.ciudad();
    }

    public Direccion actualizarDatos(DTODireccion direccion) {
        this.calle=direccion.calle();
        this.numero= direccion.numero();
        this.distrito= direccion.distrito();
        this.complemento=direccion.complemento();
        this.ciudad=direccion.ciudad();
        return this;
    }
}
