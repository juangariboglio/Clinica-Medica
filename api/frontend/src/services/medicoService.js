import { fetchWithAuth, lanzarErrorDeRespuesta } from '../utils/api.js';

// OJO: EL BACKEND USA LA RUTA EN SINGULAR (/medico) Y DEVUELVE UNA PAGINA DE SPRING
const API_BASE = '/api/medico';

// ESPECIALIDADES DEL ENUM DEL BACKEND (SE USAN EN EL FORMULARIO Y EN EL FILTRO)
export const ESPECIALIDADES = ['ORTOPEDIA', 'CARDIOLOGIA', 'GINECOLOGIA', 'PEDIATRIA'];

const leerCuerpo = async (response) => {
  if (response.status === 204) {
    return null;
  }
  const texto = await response.text();
  return texto ? JSON.parse(texto) : null;
};

export const getAll = async () => {
  const response = await fetchWithAuth(`${API_BASE}?size=50`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener los médicos');
  }
  const datos = await leerCuerpo(response);
  return datos && Array.isArray(datos.content) ? datos.content : (datos || []);
};

// GET /medico/{id} DEVUELVE DTORespuestaMedico (id, nombre, especialidad, email,
// telefono, dni, direccion). SE USA PARA RF-16 (VERIFICAR QUE EL MEDICO EXISTE).
export const getById = async (id) => {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener el médico');
  }
  return leerCuerpo(response);
};

// ALTA: EL FORMULARIO TIENE LOS CAMPOS DE DIRECCION PLANOS Y AQUI SE ANIDAN
export const create = async (medicoData) => {
  const { calle, distrito, ciudad, numero, complemento, ...datosMedico } = medicoData;
  const response = await fetchWithAuth(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...datosMedico,
      direccion: { calle, distrito, ciudad, numero, complemento }
    })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al crear el médico');
  }
  return leerCuerpo(response);
};

// EDICION: SE PUEDEN CAMBIAR NOMBRE, EMAIL, TELEFONO, ESPECIALIDAD Y DIRECCION.
// EL DNI NO VIAJA: EL FORMULARIO LO BLOQUEA Y EL BACKEND LO MANTIENE.
export const update = async (id, medicoData) => {
  const { calle, distrito, ciudad, numero, complemento, nombre, email, telefono, especialidad } = medicoData;
  const response = await fetchWithAuth(`${API_BASE}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      nombre,
      email,
      telefono,
      especialidad,
      direccion: { calle, distrito, ciudad, numero, complemento }
    })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al actualizar el médico');
  }
  return leerCuerpo(response);
};
