package med.voll.api.infra.errores;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice//ANOTACION IMPORTANTE, ADVICE ES PARA TRATAR LOS ERRORES
public class TratadorDeErrores {
    //COLOCAR ESTA ANOTACION Y COMO PARAMETRO EL TIPO DE ERROR QUE TENEMOS
    //EN ESTE CASO EL ERROR ES EntityNotFoundException QUE ES QUE NO ENCONTRO UN ID
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity trataError404(){
        return ResponseEntity.notFound().build();
    }
    //ESTOS TIPOS DE ERRORES SE ENCUENTRAN EN LOS LOGS CUANDO EJECUTAMOS LA APLICACION
    //EN ESTE CASO EL ERROR MethodArgumentNotValidException SUCEDE CUANDO REGISTRAMOS UN MEDICO Y FALTA ALGUN DATO (EMAIL,DNI,NOMBRE,ETC)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity trataError400(MethodArgumentNotValidException e){
        var errores=e.getFieldErrors().stream().map(DatosErrorValidacion::new).toList();
        return ResponseEntity.badRequest().body(errores);
    }
    @ExceptionHandler(ValidacionException.class)
    public ResponseEntity trataErrorDeValidacion(ValidacionException e){
        return ResponseEntity.badRequest().body(e.getMessage());
    }
    //RF-15 DEL FRONTEND: CUANDO SE INTENTA GUARDAR UN DNI/EMAIL/TELEFONO DUPLICADO, LA BASE DE DATOS
    //LO RECHAZA POR SUS CONSTRAINTS UNIQUE Y SE PRODUCE UNA DataIntegrityViolationException.
    //SIN ESTE MANEJADOR EL CLIENTE RECIBIA UN 500 GENERICO; CON EL RECIBE UN 409 CON UN MENSAJE
    //QUE INDICA EL CAMPO DUPLICADO, QUE EL FRONTEND MUESTRA INLINE JUNTO AL CAMPO.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<DatosError> trataErrorConflicto(DataIntegrityViolationException e){
        var mensaje = "El valor informado ya está registrado en el sistema";
        var causa = e.getMostSpecificCause() != null ? String.valueOf(e.getMostSpecificCause().getMessage()) : "";
        var causaMinusculas = causa.toLowerCase();
        if (causaMinusculas.contains("dni")) {
            mensaje = "El DNI ya está registrado en el sistema";
        } else if (causaMinusculas.contains("email")) {
            mensaje = "El email ya está registrado en el sistema";
        } else if (causaMinusculas.contains("telefono") || causaMinusculas.contains("teléfono")) {
            mensaje = "El teléfono ya está registrado en el sistema";
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new DatosError(mensaje));
    }
//CONSTRUCTOR NECESARIO PARA var errores CUANDO HACEMOS LA LISTA DE ERRORES CON ESA VARIABLE CON .stream()
    private record DatosErrorValidacion(String campo,
                                        String error){
        public DatosErrorValidacion(FieldError error){
            this(error.getField(), error.getDefaultMessage());
        }
    }
    //RECORD PARA EL CUERPO JSON DE LOS ERRORES 409 (DUPLICADOS), QUE EL FRONTEND LEE COMO datos.mensaje
    private record DatosError(String mensaje){
    }
}
