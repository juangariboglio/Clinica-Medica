package med.voll.api.consulta;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ConsultaRepository extends JpaRepository<Consulta,Long> {
    boolean existsByPacienteIdAndFechaBetween( Long idPaciente, LocalDateTime primerHorario, LocalDateTime ultimoHorario);

    boolean existsByMedicoIdAndFecha(Long idMedico, LocalDateTime fecha);

    //CONSULTAS SIN CANCELAR (SIN MOTIVO DE CANCELAMIENTO) PARA LA VISTA DE AGENDA
    //Y PARA CALCULAR LA DISPONIBILIDAD DEL MEDICO EN EL FRONTEND (RF-5/RF-6/RF-7)
    @Query("""
            SELECT c FROM Consulta c
            WHERE c.motivoCancelamiento IS NULL
            """)
    List<Consulta> findAllActivas();

    @Query("""
            SELECT c FROM Consulta c
            WHERE c.motivoCancelamiento IS NULL
            AND c.fecha >= :inicio
            AND c.fecha < :fin
            """)
    List<Consulta> findActivasPorDia(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("""
            SELECT c FROM Consulta c
            WHERE c.motivoCancelamiento IS NULL
            AND c.medico.id = :idMedico
            """)
    List<Consulta> findActivasPorMedico(@Param("idMedico") Long idMedico);

    @Query("""
            SELECT c FROM Consulta c
            WHERE c.motivoCancelamiento IS NULL
            AND c.medico.id = :idMedico
            AND c.fecha >= :inicio
            AND c.fecha < :fin
            """)
    List<Consulta> findActivasPorMedicoYDia(@Param("idMedico") Long idMedico,
                                             @Param("inicio") LocalDateTime inicio,
                                             @Param("fin") LocalDateTime fin);
}
