package med.voll.api.usuario;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Table(name="usuario")
@Entity
//LAS ANOTACIONES(ARROBAS) DE ABAJO SON DE Lombok
//ESTAS ANOTACIONES SIRVEN PARA NO ESCRIBIR MAS CODIGO
//POR EJEMPLO NO SE ESCRIBEN LOS GETTERS NI LOS SETTERS, SE CREA UN CONSTRUCTOR SIN ARGUMENTOS Y OTRO CON TODOS LOS ARGUMENTOS
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of="id")
//CUANDO IMPLEMENTEMOS UserDetails, IMPLEMENTAR SUS METODOS, CON ESTO HACEMOS QUE LA CLASE Usuarios SEA UN OBJETO DE TIPO UserDetails
public class Usuarios implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String login;
    private String clave;
    //ROLES: ROLE_ADMIN (borrados) Y ROLE_RECEPCION (operacion diaria)
    @Column(nullable = false)
    private String rol;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        //SI LA COLUMNA VIENE VACIA SE USA EL ROL MINIMO PARA NO ROMPER DATOS ANTIGUOS
        var rolEfectivo = (rol == null || rol.isBlank()) ? "ROLE_RECEPCION" : rol;
        return List.of(new SimpleGrantedAuthority(rolEfectivo));
    }

    @Override
    public String getPassword() {
        return clave;
    }
    //EN RETURN VA EL ATRIBUTO DE LA CONTRASEÑA, EN ESTE CASO ES clave
    @Override
    public String getUsername() {
        return login;
    }
    //EN RETURN VA EL ATRIBUTO DEl NOMBRE DE USUARIO, EN ESTE CASO ES login
    @Override
    public boolean isAccountNonExpired() {
        return UserDetails.super.isAccountNonExpired();
    }

    @Override
    public boolean isAccountNonLocked() {
        return UserDetails.super.isAccountNonLocked();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return UserDetails.super.isCredentialsNonExpired();
    }

    @Override
    public boolean isEnabled() {
        return UserDetails.super.isEnabled();
    }
}
