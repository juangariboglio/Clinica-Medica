package med.voll.api.medico;

import jakarta.persistence.*;
import lombok.*;
import med.voll.api.Especialidad;
import med.voll.api.model.Direccion;

@Table(name="medico")
@Entity
//LAS ANOTACIONES(ARROBAS) DE ABAJO SON DE Lombok
//ESTAS ANOTACIONES SIRVEN PARA NO ESCRIBIR MAS CODIGO
//POR EJEMPLO NO SE ESCRIBEN LOS GETTERS NI LOS SETTERS, SE CREA UN CONSTRUCTOR SIN ARGUMENTOS Y OTRO CON TODOS LOS ARGUMENTOS
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of="id")
public class Medico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private String email;
    private String dni;
    private String telefono;
    @Enumerated(EnumType.STRING)
    private Especialidad especialidad;
    //@Embedded SIRVE PARA INCLUIR OBJETOS EN UNA ENTIDAD, EN ESTE CASO AGRUPAMOS LOS ATRIBUTOS DE DIRECCION
    //TENER EN CUENTA @Embeddable EN LA CLASE Direccion
    @Embedded
    private Direccion direccion;
    private Boolean activo;

    //CONSTRUCTOR
    public Medico(DTORegistroMedico json) {
        this.activo=true;
        this.nombre=json.nombre();
        this.email= json.email();
        this.telefono= json.telefono();
        this.dni= json.dni();
        this.especialidad=json.especialidad();
        this.direccion=new Direccion(json.direccion());
    }
    //METODO PARA LA ACTUALIZACION DE DATOS
    public void actualizarDatos(DTOActualizarMedico dtoActualizarMedico) {
        //SE PREGUNTA SI ES DISTINTO DE NULL POR SI QUEREMOS CAMBIAR SOLO UN PARAMETRO
        if(dtoActualizarMedico.nombre()!=null){
            this.nombre= dtoActualizarMedico.nombre();
        }
        //EL EMAIL SE ACTUALIZA SI VIENE INFORMADO (NO SE PERMITE DEJARLO EN BLANCO)
        if(dtoActualizarMedico.email()!=null && !dtoActualizarMedico.email().isBlank()){
            this.email= dtoActualizarMedico.email();
        }
        if(dtoActualizarMedico.telefono()!=null && !dtoActualizarMedico.telefono().isBlank()){
            this.telefono= dtoActualizarMedico.telefono();
        }
        if(dtoActualizarMedico.especialidad()!=null){
            this.especialidad= dtoActualizarMedico.especialidad();
        }
        //EL DNI SE ACEPTA EN EL DTO POR COMPATIBILIDAD, PERO EL FRONTEND NO LO ENVIA
        if(dtoActualizarMedico.dni()!=null){
            this.dni= dtoActualizarMedico.dni();
        }
        //TENER EN CUENTA COMO SE ACTUALIZA DIRECCION PORQUE ES UN OBJETO
        if(dtoActualizarMedico.direccion()!=null){
            this.direccion=direccion.actualizarDatos(dtoActualizarMedico.direccion());
        }


    }

    public void desactivarMedico() {
        this.activo=false;
    }
}
