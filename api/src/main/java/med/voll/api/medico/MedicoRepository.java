package med.voll.api.medico;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import med.voll.api.Especialidad;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface MedicoRepository extends JpaRepository<Medico,Long> {

    Page<Medico> findByActivoTrue(Pageable paginacion);

    @Query(value = "SELECT m FROM Medico m " +
            "WHERE m.activo = true " +
            "AND m.especialidad = :especialidad " +
            "AND m.id NOT IN (" +
            "   SELECT c.medico.id FROM Consulta c WHERE c.fecha = :fecha" +
            ") " +
            "ORDER BY RAND()")
    //JPQL (no nativa): Hibernate enlaza :especialidad segun el mapeo @Enumerated(STRING) de la entidad,
    //por lo que compara por nombre ('CARDIOLOGIA') y no por ordinal. Antes, como query nativa, el enum
    //se enlazaba como entero y con la columna varchar no coincidia (devolvia null).
    //Se quita 'LIMIT 1': JPQL no lo soporta; se limita con Pageable (size=1).
    Page<Medico> elegirMedicoAleatorioDisponibleEnLaFecha(Especialidad especialidad, @NotNull @Future LocalDateTime fecha, Pageable paginacion);
    //PARA CREAR UN TEST DE ESTE METODO HAY QUE DARLE CLICK DERECHO AL METODO Y DARLE A Generate, Test Y EN LA PANTALLA QUE SE ABRE SELECCIONAR EL METODO QUE ELEGIMOS
    //SE CREA UNA CLASE EN LA CARPETA src/test/medico NO EN MAIN
    @Query("""
            SELECT m.activo
            FROM Medico m
            WHERE
            m.id=:idMedico
            """)
    boolean findActivoById(Long idMedico);
}
