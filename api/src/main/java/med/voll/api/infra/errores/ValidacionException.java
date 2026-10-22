package med.voll.api.infra.errores;
//COLOCAR EL extends RuntimeException A LA CLASE
public class ValidacionException extends RuntimeException {
    public ValidacionException(String mensaje) {
        super(mensaje);
    }
}
