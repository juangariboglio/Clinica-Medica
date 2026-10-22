import { fetchWithAuth, lanzarErrorDeRespuesta } from '../utils/api.js';
import { calcularHorariosDisponibles, filtrarHorariosPasados } from '../utils/disponibilidadUtils.js';

// LA API REAL DEL BACKEND: POST /consultas RECIBE DTOConsultaReserva
// {idPaciente, idMedico, fecha (LocalDateTime ISO), especialidad} Y GET /consultas
// LISTA LAS CONSULTAS ACTIVAS (CON FILTROS OPCIONALES medicoId Y fecha).
const API_BASE = '/api/consultas';

const leerCuerpo = async (response) => {
  if (response.status === 204) {
    return null;
  }
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
};

const aFechaISO = (fecha) => (fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha);

// TODAS LAS CONSULTAS ACTIVAS (AGENDA GENERAL). SI SE INDICA UNA FECHA, SOLO LAS
// DEL DIA SELECCIONADO (RF-7: LA AGENDA MUESTRA LA LISTA DE CONSULTAS DEL DIA).
export const getAll = async (fecha) => {
  const fechaStr = fecha ? aFechaISO(fecha) : null;
  const response = await fetchWithAuth(fechaStr ? `${API_BASE}?fecha=${fechaStr}` : API_BASE, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener las consultas');
  }
  return leerCuerpo(response);
};

// CONSULTAS ACTIVAS DE UN MEDICO EN UNA FECHA (YYYY-MM-DD O Date)
export const getByFechaMedico = async (medicoId, fecha) => {
  const fechaStr = aFechaISO(fecha);
  const response = await fetchWithAuth(`${API_BASE}?medicoId=${medicoId}&fecha=${fechaStr}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener las consultas del médico');
  }
  return leerCuerpo(response);
};

/**
 * Horarios libres de un médico en una fecha: se piden las consultas ya reservadas
 * (cada una ocupa su franja de 30 minutos) y se calculan los huecos dentro del
 * horario de atención de la clínica (7:00–19:00, lunes a sábado).
 * @param {number|string} medicoId
 * @param {string|Date} fecha - Fecha en formato YYYY-MM-DD o Date
 * @returns {Promise<Array<{inicio: string, fin: string}>>}
 */
export const getDisponibilidad = async (medicoId, fecha) => {
  const consultas = await getByFechaMedico(medicoId, fecha);
  const fechaDate = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00`);
  // CADA CONSULTA OCUPA LA MEDIA HORA QUE EMPIEZA EN SU HORA EXACTA
  const horariosOcupados = (consultas || []).map((consulta) => {
    const hora = String(consulta.fecha).split('T')[1] || '00:00:00';
    const [hh, mm] = hora.split(':');
    const inicioMinutos = parseInt(hh, 10) * 60 + parseInt(mm, 10);
    const finMinutos = inicioMinutos + 30;
    const formatear = (minutos) =>
      `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
    return {
      inicio: formatear(inicioMinutos),
      fin: formatear(Math.min(finMinutos, 19 * 60))
    };
  });
  const libres = calcularHorariosDisponibles(horariosOcupados, fechaDate);
  // SI LA FECHA ES HOY, NO SE OFRECEN HORARIOS QUE YA PASARON (EL BACKEND EXIGE FECHA FUTURA)
  return filtrarHorariosPasados(libres, fechaDate);
};

/**
 * Crea una consulta (cita). Traduce la selección del formulario al DTO del backend.
 * @param {Object} datos - { pacienteId, medicoId, fecha (YYYY-MM-DD), hora (HH:MM) }
 */
export const create = async ({ pacienteId, medicoId, fecha, hora }) => {
  const fechaStr = aFechaISO(fecha);
  const response = await fetchWithAuth(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      idPaciente: pacienteId,
      idMedico: medicoId,
      // EL BACKEND ESPERA UN LocalDateTime ISO: "2026-10-17T09:00:00"
      fecha: `${fechaStr}T${hora}:00`
    })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al crear la consulta');
  }
  return leerCuerpo(response);
};

// CANCELA UNA CONSULTA (DELETE CON BODY SEGUN EL DISEÑO DEL BACKEND)
export const cancelar = async (idConsulta, motivo) => {
  const response = await fetchWithAuth(`${API_BASE}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idConsulta, motivo })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al cancelar la consulta');
  }
  return leerCuerpo(response);
};

// MANTENIDO POR COMPATIBILIDAD CON TESTS EXISTENTES; NO HAY ENDPOINT EQUIVALENTE
// EN EL BACKEND, ASI QUE SE RESUELVE CON REJECT
export const updateEstado = async (id, estado) => {
  throw new Error('Operación no soportada por el backend');
};

export const getById = async (id) => {
  const response = await fetchWithAuth(`${API_BASE}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener la consulta');
  }
  const consultas = await leerCuerpo(response);
  return (consultas || []).find((c) => String(c.id) === String(id)) || null;
};
