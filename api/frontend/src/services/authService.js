// SERVICIO DE AUTENTICACION. EL BACKEND REAL ESPERA {login, clave} EN POST /login Y
// RESPONDE {"jwtToken": "..."} (DTOJWTtoken). ADEMAS DE GUARDAR EL TOKEN, SE PUEDE
// DECODIFICAR EL PAYLOAD PARA SABER QUIEN ES EL USUARIO ACTUAL (claim "sub").
export const authService = {
  /**
   * Inicia sesión con las credenciales proporcionadas.
   * @param {Object} credenciales - Objeto con { login, clave }
   * @returns {Promise<Object>} Promise que resuelve con la respuesta del backend
   */
  login: async (credenciales) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credenciales)
    });

    if (!response.ok) {
      // El backend responde 403 con cuerpo vacío cuando las credenciales no son válidas
      throw new Error('Usuario o contraseña incorrectos');
    }

    const data = await response.json();
    const token = data.jwtToken;
    if (token) {
      localStorage.setItem('token', token);
    }
    return data;
  },

  /**
   * Cierra la sesión eliminando el token almacenado.
   */
  logout: () => {
    localStorage.removeItem('token');
  },

  /**
   * Obtiene el token almacenado.
   * @returns {string|null} El token o null si no existe
   */
  getToken: () => {
    return localStorage.getItem('token');
  },

  /**
   * Almacena el token proporcionado.
   * @param {string} token - El token a almacenar
   */
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  /**
   * Decodifica el payload del JWT almacenado para saber el usuario actual.
   * No verifica la firma (eso lo hace el backend en cada petición); solo lee el subject.
   * @returns {Object|null} Objeto con { login, id } o null si no hay token válido
   */
  obtenerUsuarioActual: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    try {
      const partes = token.split('.');
      if (partes.length !== 3) {
        return null;
      }
      // El payload viaja en base64url; se convierte a base64 normal antes de decodificar
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (!payload || typeof payload.sub !== 'string') {
        return null;
      }
      return { login: payload.sub, id: payload.id };
    } catch {
      return null;
    }
  }
};

export default authService;
