package med.voll.api.infra.auditoria;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

//SERVICIO TRANSVERSAL PARA DEJAR RASTRO DE QUIEN CREA, ACTUALIZA, ELIMINA O CANCELA.
@Service
public class AuditoriaService {
    private static final int LONGITUD_MAXIMA_DETALLE = 500;

    @Autowired
    private AuditoriaRepository auditoriaRepository;

    @Transactional
    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        var autenticacion = SecurityContextHolder.getContext().getAuthentication();
        var usuario = autenticacion != null && autenticacion.isAuthenticated()
                ? autenticacion.getName()
                : "sistema";
        auditoriaRepository.save(new Auditoria(usuario, accion, entidad, entidadId, recortar(detalle)));
    }

    private String recortar(String detalle) {
        if (detalle == null || detalle.length() <= LONGITUD_MAXIMA_DETALLE) {
            return detalle;
        }
        return detalle.substring(0, LONGITUD_MAXIMA_DETALLE);
    }
}
