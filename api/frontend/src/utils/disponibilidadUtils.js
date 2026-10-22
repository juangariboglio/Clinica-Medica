export const calcularHorariosDisponibles = (horariosOcupados, fecha) => {
  // If fecha is not a valid Date, return empty array
  if (!(fecha instanceof Date) || isNaN(fecha)) {
    return [];
  }

  const day = fecha.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // HORARIO DE ATENCION DE LA CLINICA (ValidacionFueraHorarioConsulta DEL BACKEND):
  // LUNES A SABADO DE 7:00 A 19:00; SOLO LOS DOMINGOS ESTA CERRADA
  if (day === 0) {
    return [];
  }

  const WORK_START_MINUTES = 7 * 60; // 07:00
  const WORK_END_MINUTES = 19 * 60; // 19:00

  // Convert occupied slots to minutes, clamp to working day, and filter valid slots
  const occupiedMinutes = horariosOcupados
    .map((slot) => {
      const startMatch = slot.inicio.match(/^(\d{2}):(\d{2})$/);
      const endMatch = slot.fin.match(/^(\d{2}):(\d{2})$/);
      if (!startMatch || !endMatch) {
        return null;
      }
      const startHours = parseInt(startMatch[1], 10);
      const startMinutes = parseInt(startMatch[2], 10);
      const endHours = parseInt(endMatch[1], 10);
      const endMinutes = parseInt(endMatch[2], 10);
      const start = startHours * 60 + startMinutes;
      const end = endHours * 60 + endMinutes;
      // Validate that start and end are numbers and start < end
      if (isNaN(start) || isNaN(end) || start >= end) {
        return null;
      }
      // Clamp to working day
      const clampedStart = Math.max(start, WORK_START_MINUTES);
      const clampedEnd = Math.min(end, WORK_END_MINUTES);
      // If after clamping the slot is invalid (empty or reversed), ignore
      if (clampedStart >= clampedEnd) {
        return null;
      }
      return { start: clampedStart, end: clampedEnd };
    })
    .filter((slot) => slot !== null);

  // If no valid occupied slots after clamping, return the whole working day as free
  if (occupiedMinutes.length === 0) {
    return [
      { inicio: '07:00', fin: '19:00' }
    ];
  }

  // Sort occupied slots by start time
  occupiedMinutes.sort((a, b) => a.start - b.start);

  // Merge overlapping occupied slots
  const merged = [];
  let current = occupiedMinutes[0];
  for (let i = 1; i < occupiedMinutes.length; i++) {
    const slot = occupiedMinutes[i];
    if (slot.start <= current.end) {
      // Overlapping or adjacent, merge
      current.end = Math.max(current.end, slot.end);
    } else {
      // No overlap, push current and start a new current
      merged.push(current);
      current = slot;
    }
  }
  merged.push(current);

  // Compute free slots as gaps between merged occupied slots, considering working day boundaries
  const freeSlots = [];
  let prevEnd = WORK_START_MINUTES;
  for (const slot of merged) {
    if (slot.start > prevEnd) {
      // There is a gap between prevEnd and slot.start
      freeSlots.push({
        start: prevEnd,
        end: slot.start
      });
    }
    prevEnd = Math.max(prevEnd, slot.end);
  }
  // After the last occupied slot, if there is time left until WORK_END_MINUTES
  if (prevEnd < WORK_END_MINUTES) {
    freeSlots.push({
      start: prevEnd,
      end: WORK_END_MINUTES
    });
  }

  // Convert free slots from minutes to HH:mm strings
  const result = freeSlots.map(({ start, end }) => {
    const startHours = String(Math.floor(start / 60)).padStart(2, '0');
    const startMinutes = String(start % 60).padStart(2, '0');
    const endHours = String(Math.floor(end / 60)).padStart(2, '0');
    const endMinutes = String(end % 60).padStart(2, '0');
    return {
      inicio: `${startHours}:${startMinutes}`,
      fin: `${endHours}:${endMinutes}`
    };
  });

  return result;
};

/**
 * Elimina los horarios que ya pasaron cuando la fecha consultada es hoy: el
 * backend exige fecha futura (@Future) y una anticipación mínima, así que no
 * tiene sentido ofrecer franjas pasadas.
 * @param {Array<{inicio: string, fin: string}>} horariosLibres
 * @param {Date} fecha - La fecha consultada
 * @param {number} anticipacionMinutos - Minutos mínimos de anticipación (30 por defecto)
 */
export const filtrarHorariosPasados = (horariosLibres, fecha, anticipacionMinutos = 30) => {
  if (!Array.isArray(horariosLibres)) {
    return [];
  }
  const ahora = new Date();
  const esHoy =
    fecha instanceof Date &&
    fecha.getFullYear() === ahora.getFullYear() &&
    fecha.getMonth() === ahora.getMonth() &&
    fecha.getDate() === ahora.getDate();
  if (!esHoy) {
    return horariosLibres;
  }
  const limiteMinutos = ahora.getHours() * 60 + ahora.getMinutes() + anticipacionMinutos;
  return horariosLibres.filter((slot) => {
    const coincide = slot.inicio.match(/^(\d{2}):(\d{2})$/);
    if (!coincide) {
      return false;
    }
    const inicioMinutos = parseInt(coincide[1], 10) * 60 + parseInt(coincide[2], 10);
    return inicioMinutos >= limiteMinutos;
  });
};