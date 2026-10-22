import { fetchWithAuth, lanzarErrorDeRespuesta } from '../utils/api.js';

// LA API REAL DEL BACKEND: GET /pacientes DEVUELVE UNA PAGINA DE SPRING
// ({content: [...]}), POST/PUT RESPONDEN CON CUERPO VACIO, Y EL PUT SOLO ACEPTA
// {id, nombre, telefono, direccion} (NO SE PUEDEN CAMBIAR DNI NI EMAIL).
const API_BASE = '/api/pacientes';

// LEE EL CUERPO DE LA RESPUESTA DEVOLVIENDO null CUANDO ESTA VACIO (204/200 SIN BODY)
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
    await lanzarErrorDeRespuesta(response, 'Error al obtener los pacientes');
  }
  const datos = await leerCuerpo(response);
  // EL BACKEND DEVUELVE UNA PAGINA: {content: [...], totalElements, ...}
  return datos && Array.isArray(datos.content) ? datos.content : (datos || []);
};

export const getById = async (id) => {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al obtener el paciente');
  }
  return leerCuerpo(response);
};

// RECORTE DEL FORMULARIO (CAMPOS PLANOS) AL DTO DEL BACKEND:
// {nombre, email, telefono, dni, calle, distrito, ciudad, numero, complemento}
// SE CONVIERTE EN DTORegistroPaciente CON direccion ANIDADA
export const create = async (pacienteData) => {
  const { calle, distrito, ciudad, numero, complemento, ...datosPaciente } = pacienteData;
  const response = await fetchWithAuth(`${API_BASE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...datosPaciente,
      direccion: { calle, distrito, ciudad, numero, complemento }
    })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al crear el paciente');
  }
  return leerCuerpo(response);
};

// EL PUT DEL BACKEND ACEPTA {id, nombre, email, telefono, direccion} (EL DNI NO SE EDITA)
export const update = async (id, pacienteData) => {
  const { calle, distrito, ciudad, numero, complemento, nombre, email, telefono } = pacienteData;
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
      direccion: { calle, distrito, ciudad, numero, complemento }
    })
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al actualizar el paciente');
  }
  return leerCuerpo(response);
};

// BORRADO LOGICO: EL BACKEND DEVUELVE 204 SIN CUERPO
export const remove = async (id) => {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    await lanzarErrorDeRespuesta(response, 'Error al eliminar el paciente');
  }
  return leerCuerpo(response);
};

export const deletePaciente = remove;
export { remove as delete };
