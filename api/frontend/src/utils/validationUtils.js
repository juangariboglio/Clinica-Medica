export const validarDNI = (dni) => {
  if (typeof dni !== 'string' || dni.trim() === '') {
    return { esValido: false, mensaje: 'El DNI no puede estar vacío' };
  }
  const cleanDNI = dni.trim();
  // FORMATO EXIGIDO POR LA SPEC Y EL BACKEND: 2 DIGITOS, PUNTO, 3 DIGITOS, PUNTO,
  // 3 DIGITOS (PATRON \d{2}\.\d{3}\.\d{3}), P. EJ. 12.345.678
  const dniRegex = /^\d{2}\.\d{3}\.\d{3}$/;
  if (!dniRegex.test(cleanDNI)) {
    return { esValido: false, mensaje: 'El DNI debe tener el formato 12.345.678' };
  }
  return { esValido: true, mensaje: 'DNI válido' };
};

export const validarEmail = (email) => {
  if (typeof email !== 'string') {
    return { esValido: false, mensaje: 'El email debe ser una cadena de texto' };
  }
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { esValido: false, mensaje: 'El email no tiene un formato válido' };
  }
  return { esValido: true, mensaje: 'Email válido' };
};

export const validarTelefono = (telefono) => {
  if (typeof telefono !== 'string') {
    return { esValido: false, mensaje: 'El teléfono debe ser una cadena de texto' };
  }
  const cleanTelefono = telefono.trim();
  // Assuming Spanish phone number: 9 digits, no spaces or dashes
  const telefonoRegex = /^\d{9}$/;
  if (!telefonoRegex.test(cleanTelefono)) {
    return { esValido: false, mensaje: 'El teléfono debe tener exactamente 9 dígitos' };
  }
  return { esValido: true, mensaje: 'Teléfono válido' };
};

export const validarNombre = (nombre) => {
  if (typeof nombre !== 'string') {
    return { esValido: false, mensaje: 'El nombre debe ser una cadena de texto' };
  }
  const cleanNombre = nombre.trim();
  if (cleanNombre.length === 0) {
    return { esValido: false, mensaje: 'El nombre no puede estar vacío' };
  }
  // Allow letters, spaces, hyphens, apostrophes
  const nombreRegex = /^[A-Za-záéíóúÁÉÍÓÚñÑ\s\-']+$/;
  if (!nombreRegex.test(cleanNombre)) {
    return { esValido: false, mensaje: 'El nombre solo puede contener letras, espacios, guiones y apostrofes' };
  }
  return { esValido: true, mensaje: 'Nombre válido' };
};

/**
 * RF-15: a partir del error lanzado por un servicio, detecta si el fallo se debe
 * a un DNI o email duplicado y devuelve los mensajes de error inline por campo.
 * @param {Error} err - Error del servicio (puede llevar `estado` con el código HTTP)
 * @returns {Object|null} Errores por campo (p. ej. { dni: '...' }) o null si no es un duplicado
 */
export const detectarErroresUnicidad = (err) => {
  const mensaje = ((err && err.message) || '').toLowerCase();
  const esDuplicado =
    (err && err.estado === 409) ||
    mensaje.includes('ya existe') ||
    mensaje.includes('ya está registrad') ||
    mensaje.includes('ya registrad') ||
    mensaje.includes('duplicad');
  if (!esDuplicado) {
    return null;
  }
  const errores = {};
  if (mensaje.includes('dni')) {
    errores.dni = 'Este DNI ya está registrado en el sistema';
  }
  if (mensaje.includes('email') || mensaje.includes('correo')) {
    errores.email = 'Este email ya está registrado en el sistema';
  }
  if (mensaje.includes('teléfono') || mensaje.includes('telefono')) {
    errores.telefono = 'Este teléfono ya está registrado en el sistema';
  }
  return Object.keys(errores).length > 0 ? errores : null;
};

/**
 * RF-16: indica si un error se debe a la pérdida de conexión (y no a que el
 * registro consultado no exista). Se usa al verificar paciente y médico antes
 * de crear una cita, para no confundir ambos casos.
 * @param {Error} err - Error lanzado por un servicio
 * @returns {boolean}
 */
export const esErrorDeConexion = (err) => {
  const mensaje = ((err && err.message) || '').toLowerCase();
  return mensaje.includes('conexión') || mensaje.includes('conexion');
};

/**
 * Valida que un campo obligatorio no esté vacío (para los subcampos de dirección).
 * @param {string} valor
 * @param {string} nombreDelCampo - Nombre legible para el mensaje de error
 */
export const validarCampoRequerido = (valor, nombreDelCampo) => {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return { esValido: false, mensaje: `${nombreDelCampo} es obligatorio` };
  }
  return { esValido: true, mensaje: '' };
};

/**
 * RF-4: convierte el cuerpo de un error 400 del backend (array de {campo, error})
 * en errores inline por campo del formulario. Los campos anidados llegan como
 * "direccion.calle" y se convierten a la clave plana "calle".
 * @param {Error} err - Error lanzado por lanzarErrorDeRespuesta (con .cuerpo)
 * @returns {Object|null} Errores por campo o null si el cuerpo no es un listado 400
 */
export const mapearErroresDelBackend = (err) => {
  const cuerpo = err && err.cuerpo;
  if (!Array.isArray(cuerpo) || cuerpo.length === 0) {
    return null;
  }
  const errores = {};
  for (const detalle of cuerpo) {
    if (detalle && typeof detalle.campo === 'string' && typeof detalle.error === 'string') {
      const campo = detalle.campo.replace('direccion.', '');
      // NO SOBRESCRIBIR UN ERROR DE UNICIDAD (RF-15) CON UNO DE FORMATO
      if (!errores[campo]) {
        errores[campo] = detalle.error;
      }
    }
  }
  return Object.keys(errores).length > 0 ? errores : null;
};