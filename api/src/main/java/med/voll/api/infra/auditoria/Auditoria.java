package med.voll.api.infra.auditoria;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

//REGISTRO INMUTABLE DE OPERACIONES SENSIBLES. NO GUARDA CLAVES NI TOKENS.
@Table(name = "auditoria")
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Auditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String accion;

    @Column(nullable = false)
    private String entidad;

    private Long entidadId;

    @Column(length = 500)
    private String detalle;

    @Column(nullable = false)
    private LocalDateTime fechaHora;

    public Auditoria(String usuario, String accion, String entidad, Long entidadId, String detalle) {
        this.usuario = usuario;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId;
        this.detalle = detalle;
        this.fechaHora = LocalDateTime.now();
    }
}
