import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => {
      return store[key] || null;
    },
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();
global.localStorage = localStorageMock;

// Mock fetch. LAS RESPUESTAS SIMULADAS IMITAN AL BACKEND REAL: GET DEVUELVE
// PAGINAS DE SPRING ({content: [...]}), POST/PUT PUEDEN RESPONDER CON CUERPO
// VACIO, Y LOS ERRORES PUEDEN TRAER TEXTO PLANO O JSON.
let mockFetchImpl;
const originalFetch = global.fetch;

function setupFetchMock(mockImpl) {
  mockFetchImpl = mockImpl;
  global.fetch = async (input, init) => {
    return mockFetchImpl(input, init);
  };
}

// FABRICA DE RESPUESTAS CON CUERPO (text/json como fetch real)
const respuesta = (estado, cuerpo) => ({
  ok: estado >= 200 && estado < 300,
  status: estado,
  text: async () => (cuerpo === undefined ? '' : JSON.stringify(cuerpo)),
  json: async () => cuerpo
});

function teardownFetchMock() {
  global.fetch = originalFetch;
}

describe('Service tests with mocked fetch (contrato del backend real)', () => {
  describe('pacienteService', () => {
    it('getAll debería desenvolver el content de la página de Spring', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        let urlConsultada = '';
        setupFetchMock(async (input) => {
          urlConsultada = input;
          if (input !== '/api/pacientes?size=50') {
            throw new Error('URL inesperada: ' + input);
          }
          return respuesta(200, { content: [{ id: 1, nombre: 'Juan' }], totalElements: 1 });
        });
        const result = await pacienteServiceModule.getAll();
        assert.deepStrictEqual(result, [{ id: 1, nombre: 'Juan' }]);
        assert.strictEqual(urlConsultada, '/api/pacientes?size=50');
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('getAll debería lanzar el mensaje del servidor en un error', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        setupFetchMock(async () => respuesta(500, { mensaje: 'Error interno' }));
        await assert.rejects(pacienteServiceModule.getAll(), (err) => {
          // RF-15: el servicio propaga el mensaje del servidor y el estado HTTP
          assert.strictEqual(err.message, 'Error interno');
          assert.strictEqual(err.estado, 500);
          return true;
        });
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('create debería anidar la dirección y devolver null con cuerpo vacío', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        let cuerpoEnviado = null;
        setupFetchMock(async (input, init) => {
          cuerpoEnviado = JSON.parse(init.body);
          // EL POST DEL BACKEND DEVUELVE 200 SIN CUERPO
          return respuesta(200, undefined);
        });
        const resultado = await pacienteServiceModule.create({
          nombre: 'Juan',
          email: 'juan@ejemplo.com',
          telefono: '123456789',
          dni: '12.345.678',
          calle: 'Av. Siempre Viva',
          distrito: 'Centro',
          ciudad: 'Springfield',
          numero: '742',
          complemento: 'Piso 2'
        });
        assert.strictEqual(resultado, null);
        assert.strictEqual(cuerpoEnviado.nombre, 'Juan');
        assert.strictEqual(cuerpoEnviado.dni, '12.345.678');
        // LA DIRECCION VIAJA ANIDADA (DTORegistroPaciente)
        assert.deepStrictEqual(cuerpoEnviado.direccion, {
          calle: 'Av. Siempre Viva',
          distrito: 'Centro',
          ciudad: 'Springfield',
          numero: '742',
          complemento: 'Piso 2'
        });
        // LOS CAMPOS DE DIRECCION NO VAN DUPLICADOS EN LA RAIZ
        assert.strictEqual(cuerpoEnviado.calle, undefined);
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('create debería traducir un 409 con mensaje de duplicado (RF-15)', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        setupFetchMock(async () => respuesta(409, { mensaje: 'El DNI ya está registrado en el sistema' }));
        await assert.rejects(
          pacienteServiceModule.create({ dni: '12.345.678', nombre: 'Juan' }),
          (err) => {
            assert.strictEqual(err.message, 'El DNI ya está registrado en el sistema');
            assert.strictEqual(err.estado, 409);
            assert.strictEqual(err.cuerpo.mensaje, 'El DNI ya está registrado en el sistema');
            return true;
          }
        );
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('update debería enviar {id, nombre, telefono, direccion} al PUT', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        let cuerpoEnviado = null;
        setupFetchMock(async (input, init) => {
          cuerpoEnviado = JSON.parse(init.body);
          return respuesta(200, undefined);
        });
        await pacienteServiceModule.update(5, {
          nombre: 'Juan Actualizado',
          telefono: '987654321',
          calle: 'Calle Nueva',
          distrito: 'Norte',
          ciudad: 'Springfield',
          numero: '10',
          complemento: 'Bajo'
        });
        // EL PUT DEL BACKEND SOLO ACEPTA id/nombre/telefono/direccion
        assert.strictEqual(cuerpoEnviado.id, 5);
        assert.strictEqual(cuerpoEnviado.nombre, 'Juan Actualizado');
        assert.strictEqual(cuerpoEnviado.telefono, '987654321');
        assert.strictEqual(cuerpoEnviado.direccion.calle, 'Calle Nueva');
        assert.strictEqual(cuerpoEnviado.email, undefined);
        assert.strictEqual(cuerpoEnviado.dni, undefined);
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('remove debería tolerar el 204 sin cuerpo del borrado lógico', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        let urlConsultada = '';
        setupFetchMock(async (input, init) => {
          urlConsultada = input;
          assert.strictEqual(init.method, 'DELETE');
          return { ok: true, status: 204, text: async () => '' };
        });
        const resultado = await pacienteServiceModule.remove(3);
        assert.strictEqual(resultado, null);
        assert.strictEqual(urlConsultada, '/api/pacientes/3');
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('getById debería devolver el detalle completo del paciente', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const pacienteServiceModule = await import('../frontend/src/services/pacienteService.js');
        const detalle = {
          id: 5,
          nombre: 'Juan',
          email: 'juan@ejemplo.com',
          telefono: '123456789',
          dni: '12.345.678',
          direccion: { calle: 'Av. Siempre Viva', distrito: 'Centro', ciudad: 'Springfield', numero: '742', complemento: 'Piso 2' },
          activo: true
        };
        setupFetchMock(async (input) => {
          if (input !== '/api/pacientes/5') {
            throw new Error('URL inesperada: ' + input);
          }
          return respuesta(200, detalle);
        });
        const resultado = await pacienteServiceModule.getById(5);
        assert.deepStrictEqual(resultado, detalle);
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });
  });

  describe('consultaService', () => {
    it('getByFechaMedico debería consultar /consultas?medicoId&fecha', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const consultaServiceModule = await import('../frontend/src/services/consultaService.js');
        let urlConsultada = '';
        setupFetchMock(async (input) => {
          urlConsultada = input;
          return respuesta(200, [
            { id: 1, idMedico: 1, nombreMedico: 'Dra. Perez', idPaciente: 2, nombrePaciente: 'Juan', fecha: '2026-10-16T09:00:00' }
          ]);
        });
        const resultado = await consultaServiceModule.getByFechaMedico(1, '2026-10-16');
        assert.strictEqual(urlConsultada, '/api/consultas?medicoId=1&fecha=2026-10-16');
        assert.strictEqual(resultado.length, 1);
        assert.strictEqual(resultado[0].nombrePaciente, 'Juan');
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('getDisponibilidad debería calcular los huecos a partir de las consultas ocupadas', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const consultaServiceModule = await import('../frontend/src/services/consultaService.js');
        setupFetchMock(async () =>
          respuesta(200, [
            { id: 1, fecha: '2026-11-02T09:00:00' },
            { id: 2, fecha: '2026-11-02T09:30:00' }
          ])
        );
        // LUNES 2026-11-02, CLINICA ABIERTA: LA CONSULTA OCUPA 9:00-10:00
        // (CADA CONSULTA OCUPA MEDIA HORA), EL RESTO DEL DIA (7:00-9:00 Y 10:00-19:00) ESTA LIBRE
        const resultado = await consultaServiceModule.getDisponibilidad(1, '2026-11-02');
        assert.deepStrictEqual(resultado, [
          { inicio: '07:00', fin: '09:00' },
          { inicio: '10:00', fin: '19:00' }
        ]);
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('create debería enviar {idPaciente, idMedico, fecha ISO} al POST', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const consultaServiceModule = await import('../frontend/src/services/consultaService.js');
        let cuerpoEnviado = null;
        setupFetchMock(async (input, init) => {
          cuerpoEnviado = JSON.parse(init.body);
          return respuesta(200, { id: 1, idMedico: 1, idPaciente: 2, fecha: '2026-11-02T09:00:00' });
        });
        const resultado = await consultaServiceModule.create({
          pacienteId: 2,
          medicoId: 1,
          fecha: '2026-11-02',
          hora: '09:00'
        });
        // EL BACKEND ESPERA DTOConsultaReserva: idPaciente/idMedico/fecha (LocalDateTime)
        assert.strictEqual(cuerpoEnviado.idPaciente, 2);
        assert.strictEqual(cuerpoEnviado.idMedico, 1);
        assert.strictEqual(cuerpoEnviado.fecha, '2026-11-02T09:00:00');
        assert.strictEqual(cuerpoEnviado.pacienteId, undefined);
        assert.strictEqual(resultado.id, 1);
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('create debería propagar el texto plano de una ValidacionException', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const consultaServiceModule = await import('../frontend/src/services/consultaService.js');
        // EL BACKEND DEVUELVE TEXTO PLANO EN LOS ERRORES DE VALIDACION (400)
        const textoPlano = 'Horario seleccionado fuera del horario de atendimiento de la clinica';
        setupFetchMock(async () => ({
          ok: false,
          status: 400,
          text: async () => textoPlano,
          json: async () => {
            throw new Error('no es JSON');
          }
        }));
        await assert.rejects(
          consultaServiceModule.create({ pacienteId: 2, medicoId: 1, fecha: '2026-11-02', hora: '09:00' }),
          (err) => {
            assert.strictEqual(err.message, textoPlano);
            assert.strictEqual(err.estado, 400);
            return true;
          }
        );
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });
  });

  describe('medicoService', () => {
    it('getAll debería desenvolver el content de la página de /medico (singular)', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const medicoServiceModule = await import('../frontend/src/services/medicoService.js');
        let urlConsultada = '';
        setupFetchMock(async (input) => {
          urlConsultada = input;
          if (input !== '/api/medico?size=50') {
            throw new Error('URL inesperada: ' + input);
          }
          return respuesta(200, { content: [{ id: 1, nombre: 'Dra. Perez', especialidad: 'CARDIOLOGIA' }] });
        });
        const resultado = await medicoServiceModule.getAll();
        assert.deepStrictEqual(resultado, [{ id: 1, nombre: 'Dra. Perez', especialidad: 'CARDIOLOGIA' }]);
        assert.strictEqual(urlConsultada, '/api/medico?size=50');
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });

    it('getById debería consultar /medico/{id}', async () => {
      localStorage.setItem('token', 'dummy-token');
      try {
        const medicoServiceModule = await import('../frontend/src/services/medicoService.js');
        let urlConsultada = '';
        setupFetchMock(async (input) => {
          urlConsultada = input;
          return respuesta(200, { id: 1, nombre: 'Dra. Perez' });
        });
        const resultado = await medicoServiceModule.getById(1);
        assert.strictEqual(urlConsultada, '/api/medico/1');
        assert.deepStrictEqual(resultado, { id: 1, nombre: 'Dra. Perez' });
      } finally {
        localStorage.removeItem('token');
        teardownFetchMock();
      }
    });
  });
});
