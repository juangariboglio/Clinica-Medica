// FECHA LOCAL EN FORMATO YYYY-MM-DD. SE EVITA toISOString(), QUE PASA A UTC Y EN
// HORARIOS DE TARDE/NOCHE DEVUELVE EL DIA SIGUIENTE (BUG DE ZONA HORARIA).
export const aCadenaLocal = (date = new Date()) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export const esFechaPasada = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  return inputDate < today;
};

export const esHorarioLaboral = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return false;
  }
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = date.getHours();
  // HORARIO DE ATENCION DE LA CLINICA (IGUAL QUE ValidacionFueraHorarioConsulta):
  // LUNES A SABADO DE 7:00 A 19:00; LA ULTIMA HORA VALIDA ES 18:XX
  const diaLaboral = day >= 1 && day <= 6;
  const dentroDelHorario = hour >= 7 && hour <= 18;
  return diaLaboral && dentroDelHorario;
};

export const formatearFechaParaMostrar = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const obtenerDiaSemanaNombre = (date) => {
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[date.getDay()];
};